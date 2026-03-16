import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import { getRequestMeta } from '../../common/utils/request-meta';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto, @Req() req: Request) {
    return this.authService.login(
      body.email,
      body.password,
      body.branchId !== undefined ? body.branchId : undefined,
      getRequestMeta(req),
    );
  }

  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(
      body.refreshToken,
      body.branchId !== undefined ? body.branchId : undefined,
      getRequestMeta(req),
    );
  }

  @Post('logout')
  logout(@Body() body: RefreshTokenDto, @Req() req: Request) {
    return this.authService.logout(body.refreshToken, getRequestMeta(req));
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(body.email, getRequestMeta(req));
  }

  @Post('reset')
  resetPassword(@Body() body: ResetPasswordDto, @Req() req: Request) {
    return this.authService.resetPassword(body.token, body.newPassword, getRequestMeta(req));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: CurrentUserContext) {
    return { user };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(
    @CurrentUser() user: CurrentUserContext,
    @Body() body: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.changePassword(user.id, body.oldPassword, body.newPassword, getRequestMeta(req));
  }
}
