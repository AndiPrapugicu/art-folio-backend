import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ArtworksModule } from './artworks/artworks.module';
import { Artwork } from './artworks/artwork.entity';
import { User } from './users/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { JwtModule } from '@nestjs/jwt';
import { join } from 'path';
import { ShopModule } from './shop/shop.module';
import { Product } from './shop/product.entity';
import { NewsModule } from './news/news.module';
import { News } from './news/news.entity';
import { ContactModule } from './contact/contact.module';
import { Contact } from './contact/contact.entity';
// import { JwtAuthModule } from './jwt-auth/jwt-auth.module';
import { JwtAuthModule } from './users/jwt-auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get<string>('DATABASE_NAME', 'database.sqlite'),
        entities: [Artwork, User, Product, News, Contact],
        synchronize: configService.get<boolean>('DATABASE_SYNCHRONIZE', true),
        logging: true,
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '84h',
        },
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      exclude: ['/api'],
      serveStaticOptions: {
        index: false,
        fallthrough: true,
        setHeaders: (res) => {
          res.set('Cross-Origin-Resource-Policy', 'cross-origin');
          res.set('Access-Control-Allow-Origin', '*');
          res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
          res.set(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept',
          );
        },
      },
    }),
    UsersModule,
    NewsModule,
    ArtworksModule,
    ShopModule,
    ContactModule,
    JwtAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [JwtModule],
})
export class AppModule {}
