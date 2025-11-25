import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LinkEntity } from '../entities/link.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LinksRepository {
  public constructor(
    @InjectRepository(LinkEntity)
    private linksEntityRepository: Repository<LinkEntity>,
  ) {}

  public async save(entity: LinkEntity): Promise<LinkEntity> {
    return this.linksEntityRepository.save(entity);
  }

  public async findOne(slug: string): Promise<LinkEntity> {
    return this.linksEntityRepository.findOne({ where: { slug } });
  }

  public async findOneAndIncrementVisits(slug: string): Promise<LinkEntity> {
    const result = await this.linksEntityRepository
      .createQueryBuilder()
      .update(LinkEntity)
      .set({ visits: () => 'visits + 1' })
      .where('slug = :slug', { slug })
      .andWhere('("expiresAt" IS NULL OR "expiresAt" > NOW())')
      .returning('*')
      .execute();

    if (result.affected === 1) {
      return result.raw[0];
    }

    return null;
  }

  public async findAll(search: string, offset: number, limit: number) {
    const queryBuilder = this.linksEntityRepository.createQueryBuilder('link');

    if (search) {
      queryBuilder.where(`link.url ILIKE :search OR link.slug ILIKE :search`, { search: `%${search}%` });
    }

    queryBuilder.take(limit).skip(offset);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
    };
  }
}
