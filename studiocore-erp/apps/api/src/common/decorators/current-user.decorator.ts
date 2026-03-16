import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserContext } from '../interfaces/current-user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserContext | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as CurrentUserContext | undefined;
  },
);
