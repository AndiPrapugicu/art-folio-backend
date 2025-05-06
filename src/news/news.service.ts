import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './news.entity';
import { CreateNewsDto } from './dto/create-news.dto';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
  ) {}

  async create(
    createNewsDto: CreateNewsDto,
    userId: number,
    imageUrl?: string,
  ): Promise<News> {
    const news = this.newsRepository.create({
      ...createNewsDto,
      userId,
      imageUrl,
    });
    console.log('Creating news with data:', news);
    return await this.newsRepository.save(news);
  }

  async findByUsername(username: string): Promise<News[]> {
    return await this.newsRepository.find({
      where: { user: { username } },
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: number, userId: number): Promise<void> {
    const news = await this.newsRepository.findOne({
      where: { id, userId },
    });

    if (!news) {
      throw new NotFoundException('News article not found');
    }

    await this.newsRepository.remove(news);
  }
}
