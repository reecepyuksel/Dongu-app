import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Community, CommunityType } from './entities/community.entity';
import {
  CommunityMember,
  CommunityRole,
} from './entities/community-member.entity';
import { Item, ItemPostType, ItemStatus } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommunityDto } from './dto/create-community.dto';

@Injectable()
export class CommunitiesService {
  constructor(
    @InjectRepository(Community)
    private readonly communitiesRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private readonly membersRepository: Repository<CommunityMember>,
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private sanitizeUser(user?: User | null) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      karmaPoint: user.karmaPoint,
      trustScore: user.trustScore,
      city: user.city,
      district: user.district,
      isVerifiedAccount: Boolean(user.isEmailVerified && user.isPhoneVerified),
    };
  }

  private sanitizeItem(item: Item) {
    const raw = item as Item & { applicationsCount?: number };

    return {
      ...raw,
      owner: this.sanitizeUser(item.owner),
      community: item.community
        ? {
            id: item.community.id,
            name: item.community.name,
            image: item.community.image,
            type: item.community.type,
            isVerified: item.community.is_verified,
          }
        : null,
      applicationsCount: raw.applicationsCount ?? 0,
    };
  }

  private serializeCommunity(community: Community) {
    const raw = community as Community & {
      membersCount?: number;
      activeItemsCount?: number;
      offeringCount?: number;
      requestingCount?: number;
    };

    return {
      id: community.id,
      name: community.name,
      description: community.description,
      image: community.image,
      type: community.type,
      city: community.city,
      district: community.district,
      isVerified: community.is_verified,
      membersCount: raw.membersCount ?? 0,
      activeItemsCount: raw.activeItemsCount ?? 0,
      offeringCount: raw.offeringCount ?? 0,
      requestingCount: raw.requestingCount ?? 0,
    };
  }

  private async loadCommunities(ids?: string[]) {
    const query = this.communitiesRepository
      .createQueryBuilder('community')
      .loadRelationCountAndMap('community.membersCount', 'community.members')
      .loadRelationCountAndMap(
        'community.activeItemsCount',
        'community.items',
        'activeItems',
        (qb) =>
          qb.andWhere('activeItems.status = :activeStatus', {
            activeStatus: ItemStatus.AVAILABLE,
          }),
      )
      .loadRelationCountAndMap(
        'community.offeringCount',
        'community.items',
        'offeringItems',
        (qb) =>
          qb
            .andWhere('offeringItems.status = :activeStatus', {
              activeStatus: ItemStatus.AVAILABLE,
            })
            .andWhere('offeringItems.postType = :offeringType', {
              offeringType: ItemPostType.OFFERING,
            }),
      )
      .loadRelationCountAndMap(
        'community.requestingCount',
        'community.items',
        'requestingItems',
        (qb) =>
          qb
            .andWhere('requestingItems.status = :activeStatus', {
              activeStatus: ItemStatus.AVAILABLE,
            })
            .andWhere('requestingItems.postType = :requestingType', {
              requestingType: ItemPostType.REQUESTING,
            }),
      )
      .orderBy('community.is_verified', 'DESC')
      .addOrderBy('community.createdAt', 'DESC');

    if (ids?.length) {
      query.where('community.id IN (:...ids)', { ids });
    }

    return query.getMany();
  }

  private getLocationScore(community: Community, user?: User | null) {
    if (!user) {
      return 0;
    }

    if (
      community.city &&
      community.district &&
      user.city === community.city &&
      user.district === community.district
    ) {
      return 2;
    }

    if (community.city && user.city === community.city) {
      return 1;
    }

    return 0;
  }

  async listMyCommunities(userId: string) {
    const memberships = await this.membersRepository.find({
      where: { user: { id: userId } },
      relations: ['community'],
      order: { joinDate: 'ASC' },
    });

    if (memberships.length === 0) {
      return [];
    }

    const communities = await this.loadCommunities(
      memberships.map((membership) => membership.community.id),
    );
    const communitiesMap = new Map(
      communities.map((community) => [community.id, community]),
    );

    return memberships
      .map((membership) => {
        const community = communitiesMap.get(membership.community.id);
        if (!community) {
          return null;
        }

        return {
          ...this.serializeCommunity(community),
          role: membership.role,
          joinDate: membership.joinDate,
          isMember: true,
        };
      })
      .filter((community): community is NonNullable<typeof community> =>
        Boolean(community),
      );
  }

  async createCommunity(
    userId: string,
    dto: CreateCommunityDto,
    imageUrl?: string | null,
  ) {
    const creator = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!creator) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const normalizedName = dto.name.trim();
    const existing = await this.communitiesRepository.findOne({
      where: { name: normalizedName },
    });

    if (existing) {
      throw new ConflictException('Bu isimde bir topluluk zaten mevcut.');
    }

    const createdCommunity =
      await this.communitiesRepository.manager.transaction(async (manager) => {
        const community = manager.create(Community, {
          name: normalizedName,
          description: dto.description.trim(),
          image: imageUrl ?? undefined,
          city: creator.city ?? undefined,
          district: creator.district ?? undefined,
          type: CommunityType.HOBBY,
        });

        const savedCommunity = await manager.save(Community, community);

        const membership = manager.create(CommunityMember, {
          community: savedCommunity,
          user: creator,
          role: CommunityRole.ADMIN,
        });

        await manager.save(CommunityMember, membership);

        return savedCommunity;
      });

    return this.getCommunityDetail(createdCommunity.id, userId);
  }

  async getDiscoverData(userId?: string) {
    const [allCommunities, viewer, myCommunities] = await Promise.all([
      this.loadCommunities(),
      userId ? this.usersRepository.findOne({ where: { id: userId } }) : null,
      userId ? this.listMyCommunities(userId) : Promise.resolve([]),
    ]);

    const joinedIds = new Set(myCommunities.map((community) => community.id));

    const suggestedCommunities = allCommunities
      .filter((community) => !joinedIds.has(community.id))
      .sort((left, right) => {
        const locationDiff =
          this.getLocationScore(right, viewer) -
          this.getLocationScore(left, viewer);
        if (locationDiff !== 0) {
          return locationDiff;
        }

        const verifiedDiff =
          Number(right.is_verified) - Number(left.is_verified);
        if (verifiedDiff !== 0) {
          return verifiedDiff;
        }

        return (
          ((right as any).membersCount ?? 0) - ((left as any).membersCount ?? 0)
        );
      })
      .slice(0, 6)
      .map((community) => this.serializeCommunity(community));

    const categories = [
      { type: CommunityType.CAMPUS, label: 'Kampüs' },
      { type: CommunityType.NEIGHBORHOOD, label: 'Mahalle' },
      { type: CommunityType.HOBBY, label: 'Hobi' },
    ].map((category) => ({
      ...category,
      communities: allCommunities
        .filter((community) => community.type === category.type)
        .map((community) => ({
          ...this.serializeCommunity(community),
          isMember: joinedIds.has(community.id),
        })),
    }));

    return {
      joinedCommunities: myCommunities,
      suggestedCommunities,
      categories,
    };
  }

  async getCommunityDetail(communityId: string, userId?: string) {
    const community = (await this.loadCommunities([communityId]))[0];

    if (!community) {
      throw new NotFoundException('Topluluk bulunamadı.');
    }

    const membership = userId
      ? await this.membersRepository.findOne({
          where: {
            community: { id: communityId },
            user: { id: userId },
          },
        })
      : null;

    const leaders = await this.membersRepository
      .createQueryBuilder('member')
      .innerJoin('member.community', 'community')
      .leftJoinAndSelect('member.user', 'user')
      .where('community.id = :communityId', { communityId })
      .orderBy('user.karmaPoint', 'DESC')
      .addOrderBy('member.joinDate', 'ASC')
      .take(5)
      .getMany();

    const feedUnlocked = Boolean(membership);

    const [showcaseItems, requestItems] = await Promise.all([
      feedUnlocked
        ? this.itemsRepository
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.owner', 'owner')
            .leftJoinAndSelect('item.community', 'itemCommunity')
            .where('item.status = :status', { status: ItemStatus.AVAILABLE })
            .andWhere('item.postType = :postType', {
              postType: ItemPostType.OFFERING,
            })
            .andWhere('itemCommunity.id = :communityId', { communityId })
            .loadRelationCountAndMap(
              'item.applicationsCount',
              'item.applications',
            )
            .orderBy('item.createdAt', 'DESC')
            .take(12)
            .getMany()
        : Promise.resolve([]),
      feedUnlocked
        ? this.itemsRepository
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.owner', 'owner')
            .leftJoinAndSelect('item.community', 'itemCommunity')
            .where('item.status = :status', { status: ItemStatus.AVAILABLE })
            .andWhere('item.postType = :postType', {
              postType: ItemPostType.REQUESTING,
            })
            .andWhere('itemCommunity.id = :communityId', { communityId })
            .loadRelationCountAndMap(
              'item.applicationsCount',
              'item.applications',
            )
            .orderBy('item.createdAt', 'DESC')
            .take(12)
            .getMany()
        : Promise.resolve([]),
    ]);

    return {
      community: {
        ...this.serializeCommunity(community),
        isMember: feedUnlocked,
        membership: membership
          ? {
              role: membership.role,
              joinDate: membership.joinDate,
            }
          : null,
      },
      feedUnlocked,
      trustMessage: community.is_verified
        ? 'Doğrulanmış ve güven odaklı bir topluluk alanındasın.'
        : 'Topluluk içi etkileşimler güven puanı ve üyelik doğrulamasıyla korunur.',
      leaders: leaders.map((leader) => ({
        user: this.sanitizeUser(leader.user),
        role: leader.role,
        joinDate: leader.joinDate,
      })),
      showcaseItems: showcaseItems.map((item) => this.sanitizeItem(item)),
      requestItems: requestItems.map((item) => this.sanitizeItem(item)),
    };
  }

  async joinCommunity(communityId: string, userId: string) {
    const [community, user, existingMembership] = await Promise.all([
      this.communitiesRepository.findOne({ where: { id: communityId } }),
      this.usersRepository.findOne({ where: { id: userId } }),
      this.membersRepository.findOne({
        where: {
          community: { id: communityId },
          user: { id: userId },
        },
      }),
    ]);

    if (!community) {
      throw new NotFoundException('Topluluk bulunamadı.');
    }

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    if (existingMembership) {
      throw new ConflictException('Bu topluluğa zaten üyesiniz.');
    }

    if (
      community.type === CommunityType.CAMPUS &&
      !user.email.toLowerCase().endsWith('.edu.tr')
    ) {
      throw new ForbiddenException(
        'Kampüs topluluklarına yalnızca .edu.tr uzantılı e-posta ile katılabilirsiniz.',
      );
    }

    const membership = this.membersRepository.create({
      community,
      user,
      role: CommunityRole.MEMBER,
    });

    await this.membersRepository.save(membership);

    return this.getCommunityDetail(communityId, userId);
  }
}
