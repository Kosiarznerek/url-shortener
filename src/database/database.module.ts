import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkEntity } from './entities/link.entity';
import { LinksRepository } from './repositories/links.repository';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseConfig = configService.get('database');

        return {
          type: databaseConfig.type,
          host: databaseConfig.host,
          port: databaseConfig.port,
          username: databaseConfig.username,
          password: databaseConfig.password,
          database: databaseConfig.database,
          entities: [LinkEntity],
          synchronize: true,
        };
      },
    }),
    TypeOrmModule.forFeature([LinkEntity]),
  ],
  providers: [LinksRepository],
  exports: [LinksRepository],
})
export class DatabaseModule {}
