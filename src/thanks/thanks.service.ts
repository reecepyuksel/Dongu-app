import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThanksNote } from './thanks.entity';
import { User } from '../users/entities/user.entity';
import { Item } from '../items/entities/item.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ThanksService {
  constructor(
    @InjectRepository(ThanksNote)
    private thanksRepository: Repository<ThanksNote>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    private notificationsService: NotificationsService,
  ) {}

  async createThanks(
    senderId: string,
    receiverId: string,
    itemId: string,
    textContent?: string,
  ) {
    const text = (textContent || '').trim();

    if (!text) {
      return { saved: false, message: 'Takas Başarıyla Tamamlandı' };
    }

    if (senderId === receiverId) {
      throw new BadRequestException('Kendinize teşekkür notu bırakamazsınız.');
    }

    const sender = await this.usersRepository.findOne({
      where: { id: senderId },
    });
    const receiver = await this.usersRepository.findOne({
      where: { id: receiverId },
    });
    const item = await this.itemsRepository.findOne({ where: { id: itemId } });

    if (!sender || !receiver || !item) {
      throw new NotFoundException('Gerekli kayıtlar bulunamadı.');
    }

    const note = this.thanksRepository.create({
      textContent: text,
      sender,
      receiver,
      item,
    });

    const saved = await this.thanksRepository.save(note);

    await this.notificationsService.createNotification(
      receiver.id,
      '🔔 Yeni Teşekkür Notu',
      `${sender.fullName} sana bir teşekkür notu bıraktı!`,
      NotificationType.SUCCESS,
      item.id,
    );

    return { saved: true, thanksId: saved.id };
  }

  async getReceivedThanks(receiverId: string) {
    const notes = await this.thanksRepository.find({
      where: { receiver: { id: receiverId } },
      relations: ['sender', 'item'],
      order: { createdAt: 'DESC' },
    });

    return notes.map((note) => ({
      id: note.id,
      textContent: note.textContent,
      createdAt: note.createdAt,
      sender: {
        id: note.sender.id,
        fullName: note.sender.fullName,
        avatarUrl: note.sender.avatarUrl,
      },
      item: {
        id: note.item.id,
        title: note.item.title,
      },
    }));
  }
}
