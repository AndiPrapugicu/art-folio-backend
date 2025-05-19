import {
  Body,
  Controller,
  Post,
  Get,
  Req,
  UseGuards,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Express } from 'express';
import { JwtPayload } from '../jwt-payload.interface';
import { existsSync, mkdirSync } from 'fs';
import { UpdateBioDto } from './dto/update-bio.dto';
import { UpdateWebsiteDto } from './dto/update-website.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

// Adăugăm o interfață extinsă pentru Request
interface RequestWithUser extends Request {
  user: JwtPayload;
}

// Controller pentru autentificare
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    // Creăm directorul pentru upload dacă nu există
    const uploadPath = join(__dirname, '..', '..', '..', 'uploads', 'profiles');
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true, mode: 0o755 });
    }
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Autentificare utilizator' })
  @ApiResponse({
    status: 200,
    description: 'Autentificare reușită',
    schema: {
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            username: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credențiale invalide' })
  async login(@Body() loginUserDto: LoginUserDto) {
    console.log('📦 [AuthController] Request body primit:', {
      email: loginUserDto.email,
      password: loginUserDto.password ? '***' : 'missing',
      rawBody: loginUserDto,
    });

    try {
      console.log('Încercare de autentificare pentru:', loginUserDto.email);

      const result = await this.usersService.login(loginUserDto);

      console.log(
        '✅ [AuthController] Login reușit pentru:',
        loginUserDto.email,
      );

      return {
        token: result.token,
        user: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          bio: result.user.bio,
          profileImage: result.user.profileImage,
          website: result.user.website,
          phone: result.user.phone,
          contactMessage: result.user.contactMessage,
        },
      };
    } catch (error) {
      console.error('❌ [AuthController] Eroare login:', error);
      throw new UnauthorizedException('Credențiale invalide');
    }
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: RequestWithUser) {
    console.log('Current user data:', req.user);
    return {
      id: req.user.sub,
      email: req.user.email,
      username: req.user.username,
      bio: req.user.bio,
      profileImage: req.user.profileImage,
      website: req.user.website,
      phone: req.user.phone,
      contactMessage: req.user.contactMessage,
    };
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Reînnoiește token-ul de acces' })
  @ApiResponse({ status: 200, description: 'Token reînnoit cu succes' })
  @ApiResponse({ status: 401, description: 'Token de reîmprospătare invalid' })
  async refreshToken(@Body() refreshTokenDto: { refreshToken: string }) {
    try {
      const result = await this.usersService.refreshToken(
        refreshTokenDto.refreshToken,
      );
      return result;
    } catch (error) {
      throw new UnauthorizedException('Token de reîmprospătare invalid');
    }
  }

  @Patch('profile-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Folosim process.cwd() în loc de __dirname
          const uploadPath = join(process.cwd(), 'uploads', 'profiles');

          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          console.log('Upload path:', uploadPath);
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, uniqueSuffix + ext);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new BadRequestException('Doar imagini sunt permise!'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    try {
      if (!file) {
        throw new HttpException(
          'Niciun fișier nu a fost încărcat',
          HttpStatus.BAD_REQUEST,
        );
      }

      const baseUrl =
        process.env.API_URL || 'https://art-folio-backend.onrender.com/api';
      // Modificăm construirea URL-ului pentru imagine
      const imageUrl = `/uploads/profiles/${file.filename}`; // Salvăm calea relativă

      const updatedUser = await this.usersService.updateProfileImage(
        req.user.sub,
        imageUrl, // Salvăm calea relativă în baza de date
      );

      return {
        success: true,
        imageUrl: `${baseUrl}${imageUrl}`, // Returnăm URL-ul complet
        message: 'Profile image updated successfully',
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new HttpException(
        error instanceof Error
          ? error.message
          : 'Eroare la încărcarea imaginii',
        error instanceof Error && typeof (error as any).status === 'number'
          ? (error as any).status
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('update-bio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user bio' })
  @ApiResponse({ status: 200, description: 'Bio updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateBio(
    @Req() req: RequestWithUser,
    @Body() updateBioDto: UpdateBioDto,
  ) {
    try {
      console.log('Updating bio for user:', req.user.sub);
      console.log('New bio:', updateBioDto.bio);

      const result = await this.usersService.updateBio(
        req.user.sub,
        updateBioDto.bio,
      );

      console.log('Update result:', result);

      return result;
    } catch (error) {
      console.error('Error in updateBio:', error);
      throw new HttpException(
        error instanceof Error ? error.message : 'Error updating bio',
        error instanceof Error && typeof (error as any).status === 'number'
          ? (error as any).status
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('update-website')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user website' })
  @ApiResponse({ status: 200, description: 'Website updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateWebsite(
    @Req() req: RequestWithUser,
    @Body() updateWebsiteDto: UpdateWebsiteDto,
  ) {
    try {
      const result = await this.usersService.updateWebsite(
        req.user.sub,
        updateWebsiteDto.website,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Error updating website',
        error instanceof Error && typeof (error as any).status === 'number'
          ? (error as any).status
          : HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('update-contact')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user contact information',
    description:
      'Actualizează informațiile de contact ale utilizatorului autentificat',
  })
  @ApiResponse({
    status: 200,
    description: 'Informațiile de contact au fost actualizate cu succes',
    schema: {
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        user: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              example: 'user@example.com',
            },
            phone: {
              type: 'string',
              example: '0712345678',
            },
            contactMessage: {
              type: 'string',
              example: 'Hi, you can find me and my art here',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async updateContactInfo(
    @Req() req: RequestWithUser,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    try {
      const updatedUser = await this.usersService.updateContactInfo(
        req.user.sub,
        updateContactDto,
      );

      return {
        success: true,
        user: {
          ...updatedUser,
          password: undefined,
        },
      };
    } catch (error) {
      throw new HttpException(
        error instanceof Error
          ? error.message
          : 'Could not update contact information',
        error instanceof Error && typeof (error as any).status === 'number'
          ? (error as any).status
          : HttpStatus.BAD_REQUEST,
      );
    }
  }
}

// Controller pentru operații specifice utilizatorilor - în afara clasei AuthController
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
}
