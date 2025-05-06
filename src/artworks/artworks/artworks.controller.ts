import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Query,
  NotFoundException,
  UnauthorizedException,
  Patch,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { ArtworksService } from './artworks.service';
import { Artwork } from '../artwork.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../users/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { join } from 'path';
import * as fs from 'fs';

@ApiTags('artworks')
@Controller('artworks')
export class ArtworksController {
  constructor(
    private readonly artworksService: ArtworksService,
    private configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createArtwork(@Request() req, @Body() artworkData: Partial<Artwork>) {
    return await this.artworksService.createArtwork(req.user.id, artworkData);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/:category')
  async getUserArtworksByCategory(
    @Request() req,
    @Param('category') category: string,
  ) {
    console.log('getUserArtworksByCategory called with:', {
      userId: req.user.id,
      category,
      user: req.user,
    });

    // Folosim metoda pentru user autentificat
    const artworks = await this.artworksService.findByUserAndCategoryAuth(
      req.user.id,
      category,
    );

    console.log(`Returning ${artworks.length} artworks`);
    return artworks;
  }

  @Get('filter')
  async getArtworks(
    @Query('username') username: string,
    @Query('category') category: string,
  ) {
    return this.artworksService.findByUsernameAndCategory(username, category);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:username/:category')
  async getUserArtworksByUsernameAndCategory(
    @Param('username') username: string,
    @Param('category') category: string,
    @Request() req,
  ) {
    console.log('Cerere autentificată pentru:', { username, category });
    return await this.artworksService.findByUserAndCategory(
      req.user.id,
      category,
    );
  }

  @Get(':username/:category')
  async getArtworksByUsernameAndCategory(
    @Param('username') username: string,
    @Param('category') category: string,
  ) {
    console.log('getArtworksByUsernameAndCategory called with:', {
      username,
      category,
    });

    const artworks = await this.artworksService.findByUserAndCategory(
      username,
      category,
    );

    return artworks;
  }

  @Get()
  async findAllArtworks() {
    console.log('Cerere primită pentru toate artworks');
    return await this.artworksService.findAllArtworks();
  }

  @Get('seed')
  async seedData() {
    return await this.artworksService.seedArtworks();
  }

  @Get(':id')
  async findArtworkById(@Param('id', ParseIntPipe) id: number) {
    return await this.artworksService.findArtworkById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateArtwork(
    @Request() req,
    @Param('id') id: number,
    @Body() updateData: Partial<Artwork>,
  ) {
    return await this.artworksService.updateArtwork(
      id,
      req.user.id,
      updateData,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/artworks')
  async getUserArtworks(@Request() req) {
    console.log('Cerere primită pentru getUserArtworks');
    console.log('User ID:', req.user.id);
    const artworks = await this.artworksService.getUserArtworks(req.user.id);
    console.log('Artworks găsite:', artworks.length);
    return artworks;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteArtwork(@Request() req, @Param('id') id: number) {
    return await this.artworksService.deleteArtwork(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/artworks',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return callback(
            new HttpException(
              'Doar imaginile sunt permise!',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() artworkData: Partial<Artwork>,
  ) {
    try {
      console.log('Date primite la upload:', {
        user: req.user,
        artworkData,
        file: file ? file.filename : null,
      });

      if (!file) {
        throw new HttpException(
          'Nicio imagine încărcată.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Procesăm categoria în același mod ca la căutare
      const processedCategory = artworkData.category
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const imageUrl = `/uploads/artworks/${file.filename}`;

      if (!artworkData.title || !artworkData.category) {
        throw new HttpException(
          'Titlul și categoria sunt obligatorii',
          HttpStatus.BAD_REQUEST,
        );
      }

      const newArtwork = await this.artworksService.createArtwork(req.user.id, {
        title: artworkData.title,
        description: artworkData.description || '',
        category: artworkData.category,
        imageUrl,
        datePosted: new Date().toISOString(),
        artist: req.user.username,
        userId: req.user.id,
        isVisible: true,
      });

      console.log('Artwork nou creat:', newArtwork);

      return {
        success: true,
        artwork: {
          ...newArtwork,
          imageUrl: `http://localhost:3000${imageUrl}`,
        },
        message: 'Artwork încărcat cu succes',
      };
    } catch (error) {
      console.error('Error in uploadFile:', error);
      throw new HttpException(
        error instanceof Error
          ? error.message
          : 'Eroare la încărcarea artwork-ului',
        error instanceof Error && typeof (error as any).status === 'number'
          ? (error as any).status
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Actualizează vizibilitatea unui artwork' })
  @ApiResponse({
    status: 200,
    description: 'Vizibilitatea a fost actualizată cu succes',
    type: Artwork,
  })
  @ApiResponse({ status: 401, description: 'Neautorizat' })
  @ApiResponse({
    status: 403,
    description: 'Interzis - Nu aveți permisiunea necesară',
  })
  @ApiResponse({ status: 404, description: 'Artwork-ul nu a fost găsit' })
  @ApiBody({
    type: UpdateVisibilityDto,
    description: 'Date pentru actualizarea vizibilității',
  })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/visibility')
  async updateVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVisibilityDto: UpdateVisibilityDto,
    @Request() req,
  ) {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedException('User not authenticated');
      }

      console.log('Debug - Request:', {
        artworkId: id,
        userId: req.user.id,
        isVisible: updateVisibilityDto.isVisible,
      });

      const result = await this.artworksService.updateVisibility(
        id,
        req.user.id,
        updateVisibilityDto.isVisible,
      );

      return result;
    } catch (error) {
      console.error('Error in updateVisibility:', error);
      throw error;
    }
  }

  @Get('image/:filename')
  async serveImage(@Param('filename') filename: string, @Res() res) {
    const path = join(__dirname, '..', '..', 'uploads', 'artworks', filename);

    try {
      if (fs.existsSync(path)) {
        return res.sendFile(path);
      } else {
        throw new NotFoundException('Imaginea nu a fost găsită');
      }
    } catch (error) {
      console.error('Eroare la servirea imaginii:', error);
      throw new NotFoundException('Eroare la încărcarea imaginii');
    }
  }

  private async checkArtworkOwnership(
    artworkId: number,
    userId: number,
  ): Promise<boolean> {
    const artwork = await this.artworksService.findArtworkById(artworkId);
    return artwork.userId === userId;
  }
}
