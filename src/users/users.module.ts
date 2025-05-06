import { Module } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { AuthController } from './users/users.controller';
import { UsersController } from './users/users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthModule } from './jwt-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '533h' },
      }),
      inject: [ConfigService],
    }),
    JwtAuthModule,
  ],
  controllers: [AuthController, UsersController],
  providers: [UsersService, JwtStrategy],
  exports: [UsersService, JwtModule, JwtStrategy], // Exportăm UsersService dacă este necesar în alte module
})
export class UsersModule {}
