import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
    console.log(
      '🔑 [JwtStrategy] Inițializat cu secret:',
      configService.get<string>('JWT_SECRET') ? 'Present' : 'Missing',
    );
  }

  async validate(payload: any): Promise<JwtPayload> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Token invalid');
    }

    if (!payload || !payload.sub) {
      console.error('❌ [JwtStrategy] Payload invalid:', payload);
      throw new UnauthorizedException('Token invalid');
    }

    console.log('✅ [JwtStrategy] Payload valid pentru user:', payload.email);
    return {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      bio: payload.bio || null,
      profileImage: payload.profileImage || null,
      website: payload.website || null,
      phone: payload.phone || null,
      contactMessage: payload.contactMessage || null,
    };
  }
}
