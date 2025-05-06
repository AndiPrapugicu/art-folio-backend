import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Logging îmbunătățit pentru debugging
    console.log('Request details:', {
      path: request.url,
      method: request.method,
      headers: {
        authorization: request.headers.authorization ? 'Present' : 'Missing',
        contentType: request.headers['content-type'],
      },
    });

    if (!request.headers.authorization) {
      throw new UnauthorizedException('Lipsește header-ul de autorizare');
    }

    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    // Logging îmbunătățit pentru debugging
    console.log('JWT Guard Authentication attempt:', {
      success: !!user,
      error: err
        ? {
            message: err.message,
            name: err.name,
          }
        : null,
      userPresent: !!user,
      info: info
        ? {
            message: info.message,
            name: info.name,
          }
        : null,
    });

    if (err) {
      console.error('JWT Guard Error:', {
        message: err.message,
        stack: err.stack,
      });
      throw err;
    }

    if (!user) {
      console.error('JWT Guard: No user found', {
        info: info ? info.message : 'No additional info',
      });
      throw new UnauthorizedException(
        info ? info.message : 'Autentificare eșuată',
      );
    }

    // Logging pentru user autentificat cu succes
    console.log('JWT Guard: Authentication successful', {
      userId: user.id,
      username: user.username,
    });

    return user;
  }
}
