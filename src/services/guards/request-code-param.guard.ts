import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Injectable()
export class RequestCodeParamGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const code = request.query.code;

    if (!code) {
      throw new HttpException(
        "No 'code' was provided in the query.",
        HttpStatus.BAD_REQUEST
      );
    }

    return true;
  }
}
