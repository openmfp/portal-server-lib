import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class RequestCodeParamGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const { code, state } = request.query;

    if (!code) {
      throw new HttpException(
        "No 'code' was provided in the query.",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!state) {
      throw new HttpException(
        "No 'state' was provided in the query.",
        HttpStatus.BAD_REQUEST,
      );
    }

    return true;
  }
}
