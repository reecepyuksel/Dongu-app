import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Not, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Giveaway } from './entities/giveaway.entity';
import {
  Item,
  ItemStatus,
  DeliveryStatus,
  ItemSelectionType,
} from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { Message } from '../messages/entities/message.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class GiveawaysService {
  private readonly logger = new Logger(GiveawaysService.name);

  constructor(
    @InjectRepository(Giveaway)
    private giveawaysRepository: Repository<Giveaway>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private notificationsService: NotificationsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // Kullanıcının bu ilana katılıp katılmadığını kontrol et
  async checkApplication(
    itemId: string,
    userId: string,
  ): Promise<{ applied: boolean }> {
    const existing = await this.giveawaysRepository.findOne({
      where: { item: { id: itemId }, applicant: { id: userId } },
    });
    return { applied: !!existing };
  }

  async apply(itemId: string, userId: string): Promise<Giveaway> {
    // Load User first to ensure valid entity
    const user = await this.itemsRepository.manager.findOne(User, {
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const item = await this.itemsRepository.findOne({
      where: { id: itemId },
      relations: ['applications', 'owner'],
    });

    if (!item) {
      throw new NotFoundException('Eşya bulunamadı.');
    }

    if (item.status !== ItemStatus.AVAILABLE) {
      throw new BadRequestException(
        'Bu eşya şu an döngüye katılmak için uygun değil.',
      );
    }

    if (item.owner.id === userId) {
      throw new BadRequestException(
        'Kendi paylaştığınız eşya için döngüye katılamazsınız.',
      );
    }

    const existingApplication = await this.giveawaysRepository.findOne({
      where: { item: { id: itemId }, applicant: { id: userId } },
    });

    if (existingApplication) {
      throw new BadRequestException('Bu döngüye zaten katılmışsınız.');
    }

    const giveaway = this.giveawaysRepository.create({
      item,
      applicant: user,
    });

    // Bildirim: İlan sahibine yeni katılımcı bilgisini ilet
    if (item.owner && item.owner.id !== user.id) {
      await this.notificationsService.createNotification(
        item.owner.id,
        '🎫 Yeni Katılımcı!',
        `${user.fullName} "${item.title}" döngünüze katılmak istiyor.`,
        NotificationType.INFO,
        item.id,
      );
    }

    try {
      return await this.giveawaysRepository.save(giveaway);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new BadRequestException('Bu döngüye zaten katılmışsınız.');
      }
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Checking for due giveaways...');

    const now = new Date();
    const itemsToDraw = await this.itemsRepository.find({
      where: {
        status: ItemStatus.AVAILABLE,
        selectionType: ItemSelectionType.LOTTERY, // Manuel ilanları atla
        drawDate: LessThanOrEqual(now), // drawDate null olanlar zaten LessThanOrEqual ile eşleşmez
      },
      relations: ['owner'],
    });

    for (const item of itemsToDraw) {
      this.logger.log(
        `Time up for item: ${item.title} (${item.id}). Setting to DRAW_PENDING.`,
      );
      item.status = ItemStatus.DRAW_PENDING;
      await this.itemsRepository.save(item);

      // Notify owner that it's time to pick a winner
      const ownerMsg = this.messagesRepository.create({
        item: item,
        sender: null,
        receiver: item.owner,
        content: `⏳ "${item.title}" döngünüzün süresi doldu! Lütfen panelden yeni sahibini belirleyin.`,
        isRead: false,
      });
      await this.messagesRepository.save(ownerMsg);

      // Bildirim gönder — ilan sahibine
      await this.notificationsService.createNotification(
        item.owner.id,
        '⏳ Çekiliş Süresi Doldu!',
        `"${item.title}" döngünüzün süresi doldu. Yeni sahibini belirlemek için ilana göz atın.`,
        NotificationType.WARNING,
        item.id,
      );
    }
  }

  // Get applicants for an item (for owner to see)
  async getApplicants(itemId: string, userId: string) {
    const item = await this.itemsRepository.findOne({
      where: { id: itemId },
      relations: ['owner'],
    });

    if (!item) throw new NotFoundException('İlan bulunamadı');
    if (item.owner.id !== userId)
      throw new BadRequestException('Bu işlem için yetkiniz yok');

    const apps = await this.giveawaysRepository.find({
      where: { item: { id: itemId } },
      relations: ['applicant'],
      order: { appliedAt: 'DESC' },
    });

    return apps.map((app) => ({
      userId: app.applicant.id,
      fullName: app.applicant.fullName,
      email: app.applicant.email,
      avatarUrl: app.applicant.avatarUrl || null,
      karmaPoint: app.applicant.karmaPoint ?? 100,
      appliedAt: app.appliedAt,
    }));
  }

  async selectWinner(
    itemId: string,
    userId: string,
    winnerId?: string,
    isRandom: boolean = false,
  ) {
    const item = await this.itemsRepository.findOne({
      where: { id: itemId },
      relations: ['owner'],
    });

    if (!item) throw new NotFoundException('İlan bulunamadı');
    if (item.owner.id !== userId)
      throw new BadRequestException('Bu işlem için yetkiniz yok');
    if (
      item.status !== ItemStatus.DRAW_PENDING &&
      item.status !== ItemStatus.AVAILABLE
    ) {
      throw new BadRequestException(
        'Bu ilan için seçim yapılamaz (Zaten tamamlanmış veya uygun değil)',
      );
    }

    const applications = await this.giveawaysRepository.find({
      where: { item: { id: itemId } },
      relations: ['applicant'],
    });

    if (applications.length === 0) {
      throw new BadRequestException('Bu ilana henüz kimse başvurmamış');
    }

    let selectedUser: User;

    if (isRandom) {
      const randomIndex = Math.floor(Math.random() * applications.length);
      selectedUser = applications[randomIndex].applicant;
    } else {
      if (!winnerId)
        throw new BadRequestException(
          'Yeni sahibi belirlenirken bir sorun oluştu (ID eksik).',
        );
      const winnerApp = applications.find(
        (app) => app.applicant.id === winnerId,
      );
      if (!winnerApp)
        throw new BadRequestException('Seçilen kullanıcı bu ilana başvurmamış');
      selectedUser = winnerApp.applicant;
    }

    // Mark winner in Giveaway table
    // First reset any previous (if any logic allowed retry, though here we finish)
    await this.giveawaysRepository.update(
      { item: { id: itemId } },
      { isWinner: false },
    );

    await this.giveawaysRepository.update(
      { item: { id: itemId }, applicant: { id: selectedUser.id } },
      { isWinner: true },
    );

    // Update Item
    item.status = ItemStatus.GIVEN_AWAY;
    item.winner = selectedUser;
    item.deliveryStatus = DeliveryStatus.PENDING;
    await this.itemsRepository.save(item);

    this.logger.log(
      `Winner selected for item ${item.id}: ${selectedUser.email}`,
    );

    // --- Send System Messages ---

    // 1. Kazanana mesaj
    const winnerMsg = this.messagesRepository.create({
      item: item,
      sender: null,
      receiver: selectedUser,
      content: `Harika haber! Bu döngünün yeni sahibi siz oldunuz! 🎉 Eşya teslimatı için buradan iletişime geçebilirsiniz.`,
      isRead: false,
    });
    await this.messagesRepository.save(winnerMsg);

    // 2. İlan sahibine mesaj
    const ownerMsg = this.messagesRepository.create({
      item: item,
      sender: null,
      receiver: item.owner,
      content: `✅ "${item.title}" döngüsünde yeni sahibini belirlediniz: ${selectedUser.fullName}. Teslimat süreci için sohbeti başlatabilirsiniz.`,
      isRead: false,
    });
    await this.messagesRepository.save(ownerMsg);

    // --- Bildirimler ---

    // Kazanana bildirim
    await this.notificationsService.createNotification(
      selectedUser.id,
      '🎉 Döngü Yeni Sahibi Sensin!',
      `"${item.title}" eşyasının yeni sahibi sen oldun! 🌍 Teslimat detayları için ilan sahibiyle iletişime geç.`,
      NotificationType.SUCCESS,
      item.id,
    );

    // İlan sahibine bildirim
    await this.notificationsService.createNotification(
      item.owner.id,
      '✅ Yeni Sahibi Belirlendi!',
      `"${item.title}" döngüsü için yeni sahibi: ${selectedUser.fullName}. Döngüyü tamamlamak için iletişime geçebilirsiniz.`,
      NotificationType.SUCCESS,
      item.id,
    );

    // Kaybedenlere (diğer katılımcılara) bildirim
    const losers = applications.filter(
      (app) => app.applicant.id !== selectedUser.id,
    );
    for (const loser of losers) {
      await this.notificationsService.createNotification(
        loser.applicant.id,
        '🔄 Döngü Tamamlandı',
        `Katıldığınız "${item.title}" döngüsünün yeni sahibi belirlendi. Modunuzu düşürmeyin, diğer döngülerde şansınız devam ediyor! ✨`,
        NotificationType.INFO,
        item.id,
      );
    }

    return { success: true, winner: selectedUser };
  }

  async remove(id: string, userId: string): Promise<void> {
    const item = await this.itemsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!item) {
      throw new NotFoundException('İlan bulunamadı.');
    }

    if (item.owner.id !== userId) {
      throw new BadRequestException('Bu ilanı silme yetkiniz yok.');
    }

    // Cloudinary cleanup
    if (item.images && item.images.length > 0) {
      for (const imageUrl of item.images) {
        if (imageUrl.includes('cloudinary.com')) {
          const publicId = this.extractPublicId(imageUrl);
          if (publicId) {
            try {
              await this.cloudinaryService.deleteImage(publicId);
            } catch (err) {
              this.logger.error(
                `Cloudinary delete error for ${publicId}:`,
                err,
              );
            }
          }
        }
      }
    }

    await this.itemsRepository.remove(item);
  }

  private extractPublicId(url: string): string | null {
    try {
      const parts = url.split('/');
      const lastPart = parts[parts.length - 1];
      const fileName = lastPart.split('.')[0];

      // Handle potential folder paths
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex !== -1) {
        // Typically: .../upload/v12345/folder/id.jpg
        // We want skip 'v12345'
        const pathParts = parts.slice(uploadIndex + 2);
        const fullIdWithExt = pathParts.join('/');
        return fullIdWithExt.split('.')[0];
      }

      return fileName;
    } catch {
      return null;
    }
  }
}
