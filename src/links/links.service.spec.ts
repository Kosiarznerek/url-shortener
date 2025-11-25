import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, GoneException, NotFoundException } from '@nestjs/common';
import { LinksService } from './links.service';
import { LinksRepository } from '../database/repositories/links.repository';

const mockLinksRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  findOneAndIncrementVisits: jest.fn(),
  findAll: jest.fn(),
};

describe('LinksService', () => {
  let service: LinksService;
  let repository: LinksRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        {
          provide: LinksRepository,
          useValue: mockLinksRepository,
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
    repository = module.get<LinksRepository>(LinksRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      url: 'https://example.com/long-url',
      slug: 'test-slug',
    };

    const expectedLinkEntity = {
      id: 1,
      url: createDto.url,
      slug: createDto.slug,
      visits: 0,
      expiresAt: null,
    };

    it('should successfully create and return a link when slug is unique', async () => {
      mockLinksRepository.findOne.mockResolvedValue(null);
      mockLinksRepository.save.mockResolvedValue(expectedLinkEntity);

      const result = await service.create(createDto);

      expect(repository.findOne).toHaveBeenCalledWith(createDto.slug);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(expectedLinkEntity);
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockLinksRepository.findOne.mockResolvedValue(expectedLinkEntity);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow('Link with given slug already exists');

      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOneAndRedirect', () => {
    const testSlug = 'redirect-slug';
    const activeLink = {
      id: 2,
      url: 'redirect-url',
      slug: testSlug,
      visits: 10,
      expiresAt: null,
    };

    it('should return the link DTO if successfully incremented and found (active link)', async () => {
      mockLinksRepository.findOneAndIncrementVisits.mockResolvedValue(activeLink);

      const result = await service.findOneAndRedirect(testSlug);

      expect(repository.findOneAndIncrementVisits).toHaveBeenCalledWith(testSlug);
      expect(result).toEqual(activeLink);
    });

    it('should throw NotFoundException if link is not found', async () => {
      mockLinksRepository.findOneAndIncrementVisits.mockResolvedValue(null);
      mockLinksRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneAndRedirect(testSlug)).rejects.toThrow(NotFoundException);
      await expect(service.findOneAndRedirect(testSlug)).rejects.toThrow(
        `Link with slug '${testSlug}' has not been found`,
      );

      expect(repository.findOne).toHaveBeenCalledWith(testSlug);
    });

    it('should throw GoneException if link is found but expired', async () => {
      const expiredDate = new Date(Date.now() - 3600000);
      const expiredLink = { ...activeLink, expiresAt: expiredDate };

      mockLinksRepository.findOneAndIncrementVisits.mockResolvedValue(null);
      mockLinksRepository.findOne.mockResolvedValue(expiredLink);

      await expect(service.findOneAndRedirect(testSlug)).rejects.toThrow(GoneException);
      await expect(service.findOneAndRedirect(testSlug)).rejects.toThrow(
        `Link with slug '${testSlug}' expired.`,
      );

      expect(repository.findOne).toHaveBeenCalledWith(testSlug);
    });
  });

  describe('findAll', () => {
    const mockList = {
      items: [
        {
          id: 1,
          url: 'url1',
          slug: 's1',
          visits: 1,
          expiresAt: null,
        },
      ],
      total: 10,
    };
    const search = 'test';
    const offset = 0;
    const limit = 5;

    it('should return LinkListDto with correct structure', async () => {
      mockLinksRepository.findAll.mockResolvedValue(mockList);

      const result = await service.findAll(search, offset, limit);

      expect(repository.findAll).toHaveBeenCalledWith(search, offset, limit);
      expect(result).toEqual({
        items: mockList.items,
        total: mockList.total,
        limit,
        offset,
      });
    });
  });
});
