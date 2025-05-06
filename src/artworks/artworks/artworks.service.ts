import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artwork } from '../artwork.entity';
import { UsersService } from 'src/users/users/users.service';

@Injectable()
export class ArtworksService {
  constructor(
    @InjectRepository(Artwork)
    private artworksRepository: Repository<Artwork>,
    private usersService: UsersService,
  ) {}

  async createArtwork(
    userId: number,
    artworkData: Partial<Artwork>,
  ): Promise<Artwork> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const newArtwork = this.artworksRepository.create({
      ...artworkData,
      artist: user.username, // Asigură-te că aici se setează username-ul, nu ID-ul
      userId: userId,
      isVisible: true,
    });

    return await this.artworksRepository.save(newArtwork);
  }

  async seedArtworks() {
    // Codul pentru seedArtworks rămâne neschimbat
  }

  async findAllArtworks(): Promise<Artwork[]> {
    return await this.artworksRepository.find();
  }

  async findArtworksByUser(userId: number): Promise<Artwork[]> {
    return this.artworksRepository.find({ where: { userId } });
  }

  async findByUserAndCategory(username: string, category: string) {
    console.log('Căutare artwork-uri pentru:', { username, category });

    const normalizedCategory = category
      .split('-')
      // .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const artworks = await this.artworksRepository
      .createQueryBuilder('artwork')
      .where('LOWER(artwork.artist) = LOWER(:username)', { username })
      .andWhere('LOWER(artwork.category) = LOWER(:category)', {
        category: normalizedCategory,
      })
      .andWhere('artwork.isVisible = :isVisible', { isVisible: true })
      .orderBy('artwork.datePosted', 'DESC')
      .getMany();

    console.log(
      `Găsite ${artworks.length} artwork-uri pentru ${username} în categoria ${category}`,
    );
    return artworks;
  }

  // Adăugăm o metodă separată pentru user autentificat
  async findByUserAndCategoryAuth(userId: number, category: string) {
    console.log('findByUserAndCategoryAuth called with:', { userId, category });

    const normalizedCategory = category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const artworks = await this.artworksRepository
      .createQueryBuilder('artwork')
      .where('artwork.userId = :userId', { userId })
      .andWhere('artwork.category = :category', {
        category: normalizedCategory,
      })
      .orderBy('artwork.datePosted', 'DESC')
      .getMany();

    console.log(`Found ${artworks.length} artworks for authenticated user`);
    return artworks;
  }

  async findByUsernameAndCategory(username: string, category: string) {
    console.log('Căutare artwork-uri cu parametrii:', { username, category });

    // Mai întâi să vedem toate artwork-urile acestui utilizator
    const allUserArtworks = await this.artworksRepository.find({
      where: { artist: username },
    });

    console.log('Toate artwork-urile utilizatorului:', {
      count: allUserArtworks.length,
      categories: [...new Set(allUserArtworks.map((a) => a.category))],
      usernames: [...new Set(allUserArtworks.map((a) => a.artist))],
    });

    // Normalizăm categoria pentru căutare
    const normalizedCategory = category
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    console.log('Căutare cu categoria normalizată:', normalizedCategory);

    const artworks = await this.artworksRepository.find({
      where: {
        artist: username,
        category: normalizedCategory,
        isVisible: true,
      },
      order: {
        datePosted: 'DESC',
      },
    });

    console.log('Rezultate finale:', {
      found: artworks.length,
      searchCriteria: {
        artist: username,
        category: normalizedCategory,
        isVisible: true,
      },
    });

    return artworks;
  }

  async findArtworkById(id: number): Promise<Artwork> {
    const artwork = await this.artworksRepository.findOneBy({ id });
    if (!artwork) {
      throw new NotFoundException('Artwork not found');
    }
    return artwork;
  }

  async updateArtwork(
    id: number,
    userId: number,
    updateData: Partial<Artwork>,
  ): Promise<Artwork> {
    const artwork = await this.findArtworkById(id);
    if (artwork.userId !== userId) {
      throw new NotFoundException(
        'Artwork not found or you do not have permission to update it',
      );
    }
    Object.assign(artwork, updateData);
    return await this.artworksRepository.save(artwork);
  }

  async deleteArtwork(id: number, userId: number): Promise<void> {
    const artwork = await this.findArtworkById(id);
    if (artwork.userId !== userId) {
      throw new NotFoundException(
        'Artwork not found or you do not have permission to delete it',
      );
    }
    const deleteResult = await this.artworksRepository.delete(id);
    if (deleteResult.affected === 0) {
      throw new NotFoundException('Artwork not found');
    }
  }

  async getUserArtworks(userId: number): Promise<Artwork[]> {
    return await this.artworksRepository.find({
      where: { userId },
      order: { datePosted: 'DESC' },
    });
  }

  async getUserArtworksByCategory(
    userId: number,
    category: string,
  ): Promise<Artwork[]> {
    return this.artworksRepository.find({
      where: { userId, category },
      order: { datePosted: 'DESC' },
    });
  }

  // Redenumim metoda din updateArtworkVisibility în updateVisibility
  async updateVisibility(
    id: number,
    userId: number,
    isVisible: boolean,
  ): Promise<Artwork> {
    console.log('Service: Updating visibility', { id, userId, isVisible });

    const artwork = await this.artworksRepository.findOne({
      where: { id },
    });

    if (!artwork) {
      throw new NotFoundException(`Artwork #${id} not found`);
    }

    if (artwork.userId !== userId) {
      throw new UnauthorizedException(
        'Nu aveți permisiunea să modificați acest artwork',
      );
    }

    artwork.isVisible = isVisible;

    try {
      const updatedArtwork = await this.artworksRepository.save(artwork);
      console.log('Artwork updated successfully:', updatedArtwork);
      return updatedArtwork;
    } catch (error) {
      console.error('Error saving artwork:', error);
      throw error;
    }
  }
}
