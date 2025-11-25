import { ConflictException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { LinksRepository } from '../database/repositories/links.repository';
import { LinkCreateDto } from './dto/link-create.dto';
import { LinkDto } from './dto/link.dto';
import { LinkListDto } from './dto/link-list.dto';
import { LinkEntity } from '../database/entities/link.entity';

@Injectable()
export class LinksService {
  public constructor(private linksRepository: LinksRepository) {}

  public async create(linkCreateDto: LinkCreateDto): Promise<LinkDto> {
    const linkEntity = new LinkEntity();

    linkEntity.url = linkCreateDto.url;
    linkEntity.slug = linkCreateDto.slug;
    linkEntity.url = linkCreateDto.url;
    linkEntity.expiresAt = linkCreateDto.expiresAt;

    const alreadyExists = await this.linksRepository.findOne(linkCreateDto.slug);
    if (alreadyExists) {
      throw new ConflictException('Link with given slug already exists');
    }

    return this.linksRepository.save(linkEntity);
  }

  public async findOne(slug: string): Promise<LinkEntity> {
    return this.linksRepository.findOne(slug);
  }

  public async findOneAndRedirect(slug: string): Promise<LinkDto> {
    const visitedLink = await this.linksRepository.findOneAndIncrementVisits(slug);
    if (visitedLink) {
      return visitedLink;
    }

    const unvisitedLink = await this.linksRepository.findOne(slug);

    if (!unvisitedLink) {
      throw new NotFoundException(`Link with slug '${slug}' has not been found`);
    }

    if (unvisitedLink.expiresAt && unvisitedLink.expiresAt.getTime() < Date.now()) {
      throw new GoneException(`Link with slug '${slug}' expired.`);
    }
  }

  public async findAll(search: string, offset: number, limit: number): Promise<LinkListDto> {
    const { items, total } = await this.linksRepository.findAll(search, offset, limit);

    return {
      items,
      total,
      limit,
      offset,
    };
  }
}
