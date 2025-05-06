import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../users/jwt-auth.guard';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {
    // Creează directorul pentru upload dacă nu există
    const uploadPath = join(__dirname, '..', '..', 'uploads', 'news');
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/news',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async create(
    @Body() createNewsDto: CreateNewsDto,
    @Req() req,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('File received:', file); // Pentru debugging
    const imageUrl = file ? `/uploads/news/${file.filename}` : null;
    console.log('Image URL:', imageUrl); // Pentru debugging
    return await this.newsService.create(createNewsDto, req.user.sub, imageUrl);
  }

  @Get(':username')
  async findByUsername(@Param('username') username: string) {
    return await this.newsService.findByUsername(username);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: number, @Req() req) {
    return await this.newsService.delete(id, req.user.sub);
  }
}
