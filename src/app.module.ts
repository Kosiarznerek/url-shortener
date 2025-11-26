import { Module } from '@nestjs/common';
import { LinksModule } from './links/links.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './app.configuration';

@Module({
  imports: [
    DatabaseModule,
    LinksModule,
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
})
export class AppModule {}
