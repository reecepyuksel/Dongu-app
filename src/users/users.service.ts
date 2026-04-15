import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import {
  Item,
  ItemStatus,
  DeliveryStatus,
} from '../items/entities/item.entity';
import { Giveaway } from '../giveaways/entities/giveaway.entity';
import { Message, TradeStatus } from '../messages/entities/message.entity';
import { BlockedUser } from '../messages/entities/blocked-user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { AppCacheService } from '../common/redis/app-cache.service';

@Injectable()
export class UsersService {
  private readonly useTimescaleLeaderboard: boolean;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(Giveaway)
    private giveawaysRepository: Repository<Giveaway>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(BlockedUser)
    private blockedUsersRepository: Repository<BlockedUser>,
    private dataSource: DataSource,
    private appCacheService: AppCacheService,
    private configService: ConfigService,
  ) {
    this.useTimescaleLeaderboard =
      this.configService.get<string>('USE_TIMESCALE_LEADERBOARD', 'false') ===
      'true';
  }

  private async invalidateLeaderboardCache() {
    await this.appCacheService.invalidateLeaderboard(100);
    if (this.useTimescaleLeaderboard) {
      await this.refreshLeaderboardSnapshot(100);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async refreshLeaderboardSnapshotJob() {
    if (!this.useTimescaleLeaderboard) return;
    await this.refreshLeaderboardSnapshot(100);
  }

  private async refreshLeaderboardSnapshot(limit = 100) {
    const rows = await this.dataSource.query(
      `
      SELECT
        u.id,
        u."fullName" AS "fullName",
        u."avatarUrl" AS "avatarUrl",
        u."karmaPoint" AS "karmaPoint",
        u.badges,
        ROW_NUMBER() OVER(ORDER BY u."karmaPoint" DESC, u."createdAt" ASC) as rank,
        MAX(kl.created_at) AS "lastKarmaEventAt"
      FROM "user" u
      LEFT JOIN karma_ledger kl ON kl.user_id = u.id
      GROUP BY u.id
      ORDER BY u."karmaPoint" DESC, u."createdAt" ASC
      LIMIT $1
      `,
      [limit],
    );

    await this.dataSource.transaction(async (manager) => {
      await manager.query(`TRUNCATE TABLE leaderboard_snapshot`);

      for (const row of rows) {
        await manager.query(
          `
          INSERT INTO leaderboard_snapshot (
            user_id,
            rank,
            full_name,
            avatar_url,
            karma_point,
            badges,
            last_karma_event_at,
            snapshot_at
          ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, now())
          `,
          [
            row.id,
            Number(row.rank),
            row.fullName,
            row.avatarUrl || null,
            Number(row.karmaPoint || 0),
            JSON.stringify(row.badges || null),
            row.lastKarmaEventAt || null,
          ],
        );
      }
    });

    const normalized = rows.map((row: any) => ({
      id: row.id,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      karmaPoint: Number(row.karmaPoint || 0),
      badges: row.badges,
      rank: Number(row.rank),
      lastKarmaEventAt: row.lastKarmaEventAt || null,
    }));

    await this.appCacheService.setLeaderboard(limit, normalized, 120);
  }

  async getSuccessfulTradesCount(userId: string): Promise<number> {
    return this.messagesRepository.count({
      where: [
        {
          sender: { id: userId },
          isTradeOffer: true,
          tradeStatus: TradeStatus.ACCEPTED,
          isDeleted: false,
        },
        {
          receiver: { id: userId },
          isTradeOffer: true,
          tradeStatus: TradeStatus.ACCEPTED,
          isDeleted: false,
        },
      ],
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, fullName } = createUserDto;

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      fullName,
    });

    const saved = await this.usersRepository.save(user);
    await this.invalidateLeaderboardCache();
    return saved;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findOne(id: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({ where: { id } });
    } catch {
      return null;
    }
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Kullanici bulunamadi');
    }

    if (dto.email && dto.email !== user.email) {
      const existingByEmail = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existingByEmail && existingByEmail.id !== user.id) {
        throw new ConflictException(
          'Bu e-posta baska bir hesap tarafindan kullaniliyor',
        );
      }
      user.email = dto.email;
      user.isEmailVerified = false;
    }

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.city !== undefined) user.city = dto.city;
    if (dto.district !== undefined) user.district = dto.district;
    if (dto.notifyTradeOffers !== undefined)
      user.notifyTradeOffers = dto.notifyTradeOffers;
    if (dto.notifyMessages !== undefined)
      user.notifyMessages = dto.notifyMessages;

    if (dto.phone !== undefined) {
      const nextPhone = dto.phone?.trim() || null;
      const phoneChanged = (user.phone || null) !== nextPhone;
      user.phone = nextPhone as any;
      if (phoneChanged) {
        user.isPhoneVerified = false;
      }
    }

    if (dto.isEmailVerified !== undefined) {
      user.isEmailVerified = dto.isEmailVerified;
    }

    if (dto.isPhoneVerified !== undefined) {
      user.isPhoneVerified = dto.isPhoneVerified && Boolean(user.phone);
    }

    user.trustScore =
      (user.isEmailVerified ? 50 : 0) + (user.isPhoneVerified ? 50 : 0);

    if (dto.newPassword) {
      user.password = await bcrypt.hash(dto.newPassword, 10);
    }

    const saved = await this.usersRepository.save(user);
    await this.invalidateLeaderboardCache();
    const { password, ...result } = saved;
    return result;
  }

  // Kullanıcının paylaştığı eşyalar
  async findUserItems(userId: string): Promise<Item[]> {
    return this.itemsRepository.find({
      where: { owner: { id: userId } },
      relations: ['winner'],
      order: { createdAt: 'DESC' },
    });
  }

  // Kullanıcının katıldığı çekilişler
  async findUserApplications(userId: string): Promise<Giveaway[]> {
    return this.giveawaysRepository.find({
      where: { applicant: { id: userId } },
      relations: ['item', 'item.owner', 'item.winner'],
      order: { appliedAt: 'DESC' },
    });
  }

  // Karma puanı ve rank hesapla
  async getKarmaScore(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    const karmaPoint = user?.karmaPoint || 0;
    const rank = await this.getUserRank(userId);

    // Bağışlanan eşyalar (GIVEN_AWAY)
    const donatedItems = await this.itemsRepository.count({
      where: { owner: { id: userId }, status: ItemStatus.GIVEN_AWAY },
    });

    // Katılınan çekilişler
    const participations = await this.giveawaysRepository.count({
      where: { applicant: { id: userId } },
    });

    // Teslim edilen eşyalar (DELIVERED)
    const deliveredItems = await this.itemsRepository.count({
      where: {
        owner: { id: userId },
        deliveryStatus: DeliveryStatus.DELIVERED,
      },
    });

    const successfulTradesCount = await this.getSuccessfulTradesCount(userId);

    // Rank belirle (karmaPoint üzerinden)
    let badge = {
      name: 'Yeni Paylaşımcı',
      emoji: '🥉',
      level: 1,
      color: 'bronze',
    };
    if (karmaPoint > 2000)
      badge = { name: 'Döngü Ustası', emoji: '💎', level: 4, color: 'emerald' };
    else if (karmaPoint >= 751)
      badge = { name: 'İyilik Elçisi', emoji: '🥇', level: 3, color: 'gold' };
    else if (karmaPoint >= 251)
      badge = {
        name: 'İyilik Yolcusu',
        emoji: '🥈',
        level: 2,
        color: 'silver',
      };

    // Sonraki seviye hesapla
    let nextRankAt: number | null = 251;
    let nextRankName: string | null = 'İyilik Yolcusu';
    if (karmaPoint >= 2000) {
      nextRankAt = null; // Max seviye
      nextRankName = null;
    } else if (karmaPoint >= 751) {
      nextRankAt = 2001;
      nextRankName = 'Döngü Ustası';
    } else if (karmaPoint >= 251) {
      nextRankAt = 751;
      nextRankName = 'İyilik Elçisi';
    }

    return {
      score: karmaPoint,
      rank,
      badge,
      nextRankAt,
      nextRankName,
      pointsToNext: nextRankAt ? nextRankAt - karmaPoint : 0,
      stats: {
        donatedItems,
        participations,
        deliveredItems,
        successfulTradesCount,
      },
    };
  }

  // Herkesin görebildiği genel profil
  async getPublicProfile(userId: string, viewerId?: string) {
    try {
      if (viewerId && viewerId !== userId) {
        const blocked = await this.blockedUsersRepository.findOne({
          where: [
            { blocker: { id: viewerId }, blocked: { id: userId } },
            { blocker: { id: userId }, blocked: { id: viewerId } },
          ],
        });
        if (blocked) {
          throw new ForbiddenException('Bu profil görüntülenemiyor.');
        }
      }

      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });
      if (!user) return null;

      const activeItems = await this.itemsRepository.find({
        where: { owner: { id: userId }, status: ItemStatus.AVAILABLE },
        order: { createdAt: 'DESC' },
      });

      const completedLoops = await this.itemsRepository.count({
        where: { owner: { id: userId }, status: ItemStatus.GIVEN_AWAY },
      });

      const receivedItems = await this.itemsRepository.count({
        where: { winner: { id: userId }, isConfirmed: true },
      });

      const promisedItemsCount = completedLoops; // alias for clarity
      const confirmedDeliveries = await this.itemsRepository.count({
        where: {
          owner: { id: userId },
          status: ItemStatus.GIVEN_AWAY,
          isConfirmed: true,
        },
      });

      // Tamamlama oranı: Başlatılan döngülerden yüzde kaçı Onaylandı?
      const completionRate =
        promisedItemsCount > 0
          ? Math.round((confirmedDeliveries / promisedItemsCount) * 100)
          : 0; // Eğer hiç söz vermediyse %0 kalsın, ipucu çıksın

      const karmaStats = await this.getKarmaScore(userId);
      const successfulTradesCount = await this.getSuccessfulTradesCount(userId);

      return {
        id: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        city: user.city,
        district: user.district,
        isVerifiedAccount: Boolean(
          user.isEmailVerified && user.isPhoneVerified,
        ),
        trustScore: user.trustScore,
        karmaPoint: user.karmaPoint,
        resolvedRequestsCount: user.resolvedRequestsCount,
        badges: user.badges,
        createdAt: user.createdAt,
        activeItems,
        completedLoops,
        receivedItems,
        completionRate,
        karmaStats,
        successfulTradesCount,
      };
    } catch (error) {
      return null;
    }
  }

  // Kullanıcının başarıyla bağışladığı eşyalar
  async getDonatedItems(userId: string) {
    return this.itemsRepository.find({
      where: { owner: { id: userId }, status: ItemStatus.GIVEN_AWAY },
      select: [
        'id',
        'title',
        'imageUrl',
        'createdAt',
        'isConfirmed',
        'proofImage',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // Kullanıcının kazandığı (ve onayladığı) eşyalar
  async getReceivedItems(userId: string) {
    return this.itemsRepository.find({
      where: { winner: { id: userId }, isConfirmed: true },
      select: [
        'id',
        'title',
        'imageUrl',
        'createdAt',
        'isConfirmed',
        'proofImage',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // Genel Liderlik Sıralaması
  async getLeaderboard(limit = 100) {
    if (this.useTimescaleLeaderboard) {
      const cached = await this.appCacheService.getLeaderboard(limit);
      if (cached && cached.length) {
        return cached;
      }

      const snapshotRows = await this.dataSource.query(
        `
        SELECT user_id AS id,
               rank,
               full_name AS "fullName",
               avatar_url AS "avatarUrl",
               karma_point AS "karmaPoint",
               badges,
               last_karma_event_at AS "lastKarmaEventAt"
        FROM leaderboard_snapshot
        ORDER BY rank ASC
        LIMIT $1
        `,
        [limit],
      );

      if (snapshotRows.length) {
        const normalized = snapshotRows.map((row: any) => ({
          ...row,
          rank: Number(row.rank),
          karmaPoint: Number(row.karmaPoint || 0),
        }));
        await this.appCacheService.setLeaderboard(limit, normalized, 120);
        return normalized;
      }
    }

    const rawQuery = `
      SELECT 
        id, 
        "fullName", 
        "avatarUrl", 
        "karmaPoint",
        badges,
        ROW_NUMBER() OVER(ORDER BY "karmaPoint" DESC, "createdAt" ASC) as rank
      FROM "user"
      ORDER BY "karmaPoint" DESC, "createdAt" ASC
      LIMIT $1
    `;
    const result = await this.usersRepository.query(rawQuery, [limit]);

    const rows = result.map((u: any) => ({
      ...u,
      rank: parseInt(u.rank, 10),
      karmaPoint: parseInt(u.karmaPoint, 10) || 0,
    }));

    if (this.useTimescaleLeaderboard) {
      await this.appCacheService.setLeaderboard(limit, rows, 120);
    }

    return rows;
  }

  // Kullanıcının Sıralamasını (Rank) Hesapla
  async getUserRank(userId: string): Promise<number | null> {
    const rawQuery = `
      SELECT rank FROM (
        SELECT id, ROW_NUMBER() OVER(ORDER BY "karmaPoint" DESC, "createdAt" ASC) as rank
        FROM "user"
      ) r WHERE id = $1
    `;
    const result = await this.usersRepository.query(rawQuery, [userId]);
    if (result && result.length > 0) {
      return parseInt(result[0].rank, 10);
    }
    return null;
  }
}
