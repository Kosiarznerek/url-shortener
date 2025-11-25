import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LinksRepository } from './links.repository';
import { LinkEntity } from '../entities/link.entity';
import { Repository, UpdateResult } from 'typeorm';

const mockLinksEntityRepository = {
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
  getManyAndCount: jest.fn(),
};

describe('LinksRepository', () => {
  let repository: LinksRepository;
  let linksEntityRepository: Repository<LinkEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksRepository,
        {
          provide: getRepositoryToken(LinkEntity),
          useValue: mockLinksEntityRepository,
        },
      ],
    }).compile();

    repository = module.get<LinksRepository>(LinksRepository);
    linksEntityRepository = module.get<Repository<LinkEntity>>(getRepositoryToken(LinkEntity));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('save', () => {
    it('should call repository.save with the provided entity', async () => {
      const mockEntity = { slug: 'test', url: 'http://example.com' } as LinkEntity;
      mockLinksEntityRepository.save.mockResolvedValue(mockEntity);

      const result = await repository.save(mockEntity);

      expect(linksEntityRepository.save).toHaveBeenCalledWith(mockEntity);
      expect(result).toEqual(mockEntity);
    });
  });

  describe('findOne', () => {
    const testSlug = 'unique-slug';
    const mockLink = { slug: testSlug, url: 'http://example.com' } as LinkEntity;

    it('should call repository.findOne with correct slug and return link', async () => {
      mockLinksEntityRepository.findOne.mockResolvedValue(mockLink);

      const result = await repository.findOne(testSlug);

      expect(linksEntityRepository.findOne).toHaveBeenCalledWith({ where: { slug: testSlug } });
      expect(result).toEqual(mockLink);
    });

    it('should return null if link is not found', async () => {
      mockLinksEntityRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne(testSlug);

      expect(result).toBeNull();
    });
  });

  describe('findOneAndIncrementVisits', () => {
    const testSlug = 'atomic-slug';
    const mockRawLink = { id: 1, slug: testSlug, visits: 11, url: 'http://redirect.com' };
    const mockSuccessResult = { affected: 1, raw: [mockRawLink] } as UpdateResult;
    const mockFailedResult = { affected: 0, raw: [] } as UpdateResult;

    const mockQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    beforeEach(() => {
      mockLinksEntityRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should successfully increment visits and return the updated link', async () => {
      mockQueryBuilder.execute.mockResolvedValue(mockSuccessResult);

      const result = await repository.findOneAndIncrementVisits(testSlug);

      expect(linksEntityRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(LinkEntity);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith({ visits: expect.any(Function) });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('slug = :slug', { slug: testSlug });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('("expiresAt" IS NULL OR "expiresAt" > NOW())');
      expect(mockQueryBuilder.returning).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.execute).toHaveBeenCalled();

      expect(result).toEqual(mockRawLink);
    });

    it('should return null if no row was affected (link not found or expired)', async () => {
      mockQueryBuilder.execute.mockResolvedValue(mockFailedResult);

      const result = await repository.findOneAndIncrementVisits(testSlug);

      expect(mockQueryBuilder.execute).toHaveBeenCalled();

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    const mockSearch = 'query';
    const mockOffset = 10;
    const mockLimit = 5;
    const mockItems: LinkEntity[] = [{ slug: 's1' } as LinkEntity, { slug: 's2' } as LinkEntity];
    const mockTotal = 15;

    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([mockItems, mockTotal]),
    };

    beforeEach(() => {
      mockLinksEntityRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should call getManyAndCount with correct pagination and no search query', async () => {
      const search = '';

      const result = await repository.findAll(search, mockOffset, mockLimit);

      expect(linksEntityRepository.createQueryBuilder).toHaveBeenCalledWith('link');
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(mockLimit);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(mockOffset);
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalled();

      expect(result).toEqual({ items: mockItems, total: mockTotal });
    });

    it('should call getManyAndCount with search query and pagination', async () => {
      const result = await repository.findAll(mockSearch, mockOffset, mockLimit);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        `link.url ILIKE :search OR link.slug ILIKE :search`,
        { search: `%${mockSearch}%` },
      );
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(mockLimit);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(mockOffset);

      expect(result).toEqual({ items: mockItems, total: mockTotal });
    });
  });
});
