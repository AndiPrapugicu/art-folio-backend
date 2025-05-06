import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { ArtworksController } from './artworks/artworks.controller';
import { ArtworksService } from './artworks/artworks.service';
import { Artwork } from './artwork.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Artwork]),
    UsersModule,
    ConfigModule,
    MulterModule.register({
      dest: './uploads/artworks',
    }),
  ],
  controllers: [ArtworksController],
  providers: [ArtworksService],
  exports: [ArtworksService],
})
export class ArtworksModule {}
