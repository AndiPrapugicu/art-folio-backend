import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        console.log('🔐 [JwtAuthModule] Verificare secret JWT:', !!secret);

        if (!secret) {
          console.error('❌ [JwtAuthModule] JWT_SECRET lipsește din .env');
          throw new Error('JWT_SECRET nu este configurat în .env');
        }
        console.log(
          'JWT Module inițializat cu secret:',
          secret ? 'Prezent' : 'Lipsă',
        );
        return {
          secret,
          signOptions: { expiresIn: '24h' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [JwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class JwtAuthModule {}
