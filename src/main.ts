import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configurare de bază
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Configurare CORS global (pentru API și uploads)
  app.enableCors({
    origin: 'https://art-folio-coral.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Definirea directoarelor pentru upload-uri
  const uploadsConfig = {
    root: join(process.cwd(), 'uploads'),
    directories: ['profiles', 'products', 'artworks'],
  };

  // Creare directoare dacă nu există
  uploadsConfig.directories.forEach((dir) => {
    const path = join(uploadsConfig.root, dir);
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  });

  // Servirea fișierelor statice pentru /uploads
  app.use(
    '/uploads',
    express.static(uploadsConfig.root, {
      index: false,
    }),
  );

  // (Opțional) Pentru compatibilitate cu ServeStaticModule
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    index: false,
  });

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('ArtFolio API')
    .setDescription('The ArtFolio API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT || 3000, '0.0.0.0');

  console.log(`Application running on: ${await app.getUrl()}`);
  console.log(`Static files being served from: ${uploadsConfig.root}`);
}

bootstrap();
