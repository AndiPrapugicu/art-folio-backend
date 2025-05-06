import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from '../user.entity';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../jwt-payload.interface';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(user);
  }

  async register(createUserDto: CreateUserDto) {
    const userExists = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (userExists) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    await this.usersRepository.save(user);
    return { message: 'User registered successfully' };
  }

  async login(loginUserDto: LoginUserDto) {
    console.log(
      '🔍 [UsersService] Start login process pentru:',
      loginUserDto.email,
    );

    try {
      // Verificăm datele de intrare
      console.log('📝 [UsersService] Verificare date intrare:', {
        hasEmail: !!loginUserDto.email,
        hasPassword: !!loginUserDto.password,
      });

      const user = await this.usersRepository.findOne({
        where: { email: loginUserDto.email },
        select: [
          'id',
          'email',
          'password',
          'username',
          'bio',
          'profileImage',
          'website',
          'phone',
          'contactMessage',
        ],
      });

      console.log('👤 [UsersService] User găsit:', {
        exists: !!user,
        email: loginUserDto.email,
      });

      if (!user) {
        console.log(
          '❌ [UsersService] User negăsit pentru email:',
          loginUserDto.email,
        );
        throw new UnauthorizedException('Credențiale invalide');
      }

      // 2. Verificăm parola
      console.log(
        '🔐 [UsersService] Verificare parolă pentru:',
        loginUserDto.email,
      );
      console.log('Debug parole:', {
        input: loginUserDto.password,
        stored: user.password.substring(0, 10) + '...', // Afișăm doar primele 10 caractere
      });

      const isPasswordValid = await bcrypt.compare(
        loginUserDto.password,
        user.password,
      );

      console.log('🔑 [UsersService] Rezultat verificare parolă:', {
        isValid: isPasswordValid,
        email: loginUserDto.email,
      });

      if (!isPasswordValid) {
        console.log(
          '❌ [UsersService] Parolă invalidă pentru:',
          loginUserDto.email,
        );
        throw new UnauthorizedException('Credențiale invalide');
      }

      console.log('✅ [UsersService] Parolă validă, generare token');

      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        profileImage: user.profileImage,
        website: user.website,
        phone: user.phone,
        contactMessage: user.contactMessage,
      };

      const token = this.jwtService.sign(payload);
      console.log(
        '✅ [UsersService] Token generat cu succes pentru:',
        user.email,
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          bio: user.bio,
          profileImage: user.profileImage,
          website: user.website,
          phone: user.phone,
          contactMessage: user.contactMessage,
        },
      };
    } catch (error) {
      console.error('❌ [UsersService] Eroare completă:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        email: loginUserDto.email,
      });
      throw error;
    }
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException(`User with username ${username} not found`);
    }
    return user;
  }

  async updateProfileImage(userId: number, imageUrl: string) {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.profileImage = imageUrl;
      const updatedUser = await this.usersRepository.save(user);

      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        profileImage: user.profileImage,
        website: user.website,
        phone: user.phone,
        contactMessage: user.contactMessage,
      };

      const token = this.jwtService.sign(payload);

      return {
        success: true,
        user: updatedUser,
        token,
      };
    } catch (error) {
      console.error('Error updating profile image:', error);
      throw error;
    }
  }

  async updateBio(userId: number, bio: string) {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.bio = bio;
      const updatedUser = await this.usersRepository.save(user);

      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        profileImage: user.profileImage,
        website: user.website,
        phone: user.phone,
        contactMessage: user.contactMessage,
      };

      const token = this.jwtService.sign(payload);

      return {
        success: true,
        user: updatedUser,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateContactInfo(
    userId: number,
    updateContactDto: UpdateContactDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (updateContactDto.email !== undefined) {
      const emailExists = await this.usersRepository.findOne({
        where: {
          email: updateContactDto.email,
          id: Not(userId),
        },
      });

      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
      user.email = updateContactDto.email;
    }

    if (updateContactDto.phone !== undefined) {
      user.phone = updateContactDto.phone;
    }

    if (updateContactDto.contactMessage !== undefined) {
      user.contactMessage = updateContactDto.contactMessage;
    }

    return await this.usersRepository.save(user);
  }

  async updateWebsite(userId: number, website: string) {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.website = website;
      const updatedUser = await this.usersRepository.save(user);

      const payload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        profileImage: user.profileImage,
        website: user.website,
        phone: user.phone,
        contactMessage: user.contactMessage,
      };

      const token = this.jwtService.sign(payload);

      return {
        success: true,
        user: updatedUser,
        token,
        website: updatedUser.website,
      };
    } catch (error) {
      console.error('Error updating website:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verify(refreshToken);
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('Utilizator negăsit');
      }
      const newAccessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        profileImage: user.profileImage,
        website: user.website,
        phone: user.phone,
        contactMessage: user.contactMessage,
      });

      return {
        token: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          bio: user.bio,
          profileImage: user.profileImage,
          website: user.website,
          phone: user.phone,
          contactMessage: user.contactMessage,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Token de reîmprospătare invalid');
    }
  }
}
