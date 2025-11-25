import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';
import { LinkCreateDto } from 'src/links/dto/link-create.dto';

describe('LinksController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const fastifyAdapter = new FastifyAdapter();
    app = moduleFixture.createNestApplication(fastifyAdapter);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const dataSource = app.get(DataSource);
    const entityManager = dataSource.manager;

    const tableNames = dataSource.entityMetadatas.map((entity) => entity.tableName).join(', ');

    if (tableNames) {
      await entityManager.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`);
    }
  });

  afterEach(async () => {
    await app.close();
  });

  it('should redirect with 302 to link and increase visit counter', async () => {
    const linkCreateDto: LinkCreateDto = {
      url: 'https://www.google.pl',
    };

    const linkCreateResponse = await request(app.getHttpServer())
      .post('/links')
      .send(linkCreateDto)
      .expect(201);

    expect(linkCreateResponse.body.visits).toEqual(0);
    expect(linkCreateResponse.body.url).toEqual(linkCreateDto.url);

    const linkRedirectResponse = await request(app.getHttpServer())
      .get(`/links/${linkCreateResponse.body.slug}`)
      .expect(302);

    expect(linkRedirectResponse.header.location).toBe(linkCreateDto.url);

    const linkGetResponse = await request(app.getHttpServer())
      .get(`/links?search=${linkCreateResponse.body.slug}`)
      .expect(200);

    expect(linkGetResponse.body.items.length).toEqual(1);
    expect(linkGetResponse.body.items[0].visits).toEqual(1);
  });

  it('should return 404 if link does not exists', () => {
    return request(app.getHttpServer()).get('/links/nonexistentslug').expect(404);
  });

  it('should return with 410 for expired links and do not increase counter', async () => {
    const linkCreateDto: LinkCreateDto = {
      url: 'https://www.google.pl',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    };

    const linkCreateResponse = await request(app.getHttpServer())
      .post('/links')
      .send(linkCreateDto)
      .expect(201);

    expect(linkCreateResponse.body.visits).toEqual(0);
    expect(linkCreateResponse.body.url).toEqual(linkCreateDto.url);

    await request(app.getHttpServer()).get(`/links/${linkCreateResponse.body.slug}`).expect(410);

    const linkGetResponse = await request(app.getHttpServer())
      .get(`/links?search=${linkCreateResponse.body.slug}`)
      .expect(200);

    expect(linkGetResponse.body.items.length).toEqual(1);
    expect(linkGetResponse.body.items[0].visits).toEqual(0);
  });
});
