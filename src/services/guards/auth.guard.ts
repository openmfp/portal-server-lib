import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CookiesService } from '../cookies.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private cookiesService: CookiesService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authCookie = this.cookiesService.getAuthCookie(request);

    if (!authCookie) {
      throw new HttpException('User is not logged in.', HttpStatus.BAD_REQUEST);
    }

    return true;
  }
}
