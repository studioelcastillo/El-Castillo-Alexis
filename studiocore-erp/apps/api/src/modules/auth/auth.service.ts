import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CurrentUserContext } from '../../common/interfaces/current-user.interface';
import {
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from '../../common/utils/security';
import { PasswordResetToken } from '../../database/entities/password-reset-token.entity';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  async login(email: string, password: string, requestedBranchId?: number | null, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const user = await this.usersService.findByEmailWithSecurityContext(email);
    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.usersService.touchLastLogin(user.id);
    const currentUser = await this.usersService.getCurrentUserContext(user.id, requestedBranchId);
    const tokens = await this.issueTokenPair(currentUser);

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'auth',
      action: 'login',
      entityType: 'user',
      entityId: String(currentUser.id),
      afterData: { email: currentUser.email },
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return {
      user: currentUser,
      tokens,
    };
  }

  async refresh(refreshToken: string, requestedBranchId?: number | null, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    let payload: { sub: number; email: string; type: 'refresh' };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change_me_refresh'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = hashOpaqueToken(refreshToken);
    const tokenRecord = await this.refreshTokenRepository.findOne({ where: { tokenHash } });
    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    tokenRecord.revokedAt = new Date();
    await this.refreshTokenRepository.save(tokenRecord);

    const currentUser = await this.usersService.getCurrentUserContext(payload.sub, requestedBranchId);
    const tokens = await this.issueTokenPair(currentUser);

    await this.auditLogsService.record({
      companyId: currentUser.companyId,
      branchId: currentUser.activeBranchId,
      userId: currentUser.id,
      module: 'auth',
      action: 'refresh',
      entityType: 'refresh_token',
      entityId: String(tokenRecord.id),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return {
      user: currentUser,
      tokens,
    };
  }

  async logout(refreshToken: string, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const tokenHash = hashOpaqueToken(refreshToken);
    const tokenRecord = await this.refreshTokenRepository.findOne({ where: { tokenHash } });

    if (!tokenRecord) {
      return { success: true };
    }

    tokenRecord.revokedAt = new Date();
    await this.refreshTokenRepository.save(tokenRecord);

    const user = await this.usersService.findByIdWithSecurityContext(tokenRecord.userId);
    await this.auditLogsService.record({
      companyId: user?.companyId || null,
      branchId: user?.defaultBranchId || null,
      userId: user?.id || null,
      module: 'auth',
      action: 'logout',
      entityType: 'refresh_token',
      entityId: String(tokenRecord.id),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { success: true };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const user = await this.usersService.findByIdWithSecurityContext(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const valid = await verifyPassword(oldPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);
    await this.usersService.updatePassword(user.id, passwordHash, false);
    await this.refreshTokenRepository.update({ userId: user.id, revokedAt: IsNull() }, { revokedAt: new Date() });

    await this.auditLogsService.record({
      companyId: user.companyId,
      branchId: user.defaultBranchId,
      userId: user.id,
      module: 'auth',
      action: 'change_password',
      entityType: 'user',
      entityId: String(user.id),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { success: true };
  }

  async forgotPassword(email: string, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const user = await this.usersService.findByEmailWithSecurityContext(email);
    if (!user || user.deletedAt) {
      return {
        success: true,
        message: 'If the account exists, a password recovery process has been started.',
      };
    }

    const rawToken = generateOpaqueToken(24);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
    await this.passwordResetTokenRepository.update({ userId: user.id, consumedAt: IsNull() }, { consumedAt: new Date() });
    await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        userId: user.id,
        tokenHash: hashOpaqueToken(rawToken),
        expiresAt,
      }),
    );

    await this.auditLogsService.record({
      companyId: user.companyId,
      branchId: user.defaultBranchId,
      userId: user.id,
      module: 'auth',
      action: 'forgot_password',
      entityType: 'user',
      entityId: String(user.id),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return {
      success: true,
      message: 'Password recovery requested successfully.',
      ...(process.env.NODE_ENV !== 'production'
        ? {
            devPreviewToken: rawToken,
            expiresAt: expiresAt.toISOString(),
          }
        : {}),
    };
  }

  async resetPassword(token: string, newPassword: string, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
    const tokenRecord = await this.passwordResetTokenRepository.findOne({
      where: { tokenHash: hashOpaqueToken(token) },
    });

    if (!tokenRecord || tokenRecord.consumedAt || tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.usersService.findByIdWithSecurityContext(tokenRecord.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    tokenRecord.consumedAt = new Date();
    await this.passwordResetTokenRepository.save(tokenRecord);
    await this.usersService.updatePassword(user.id, await hashPassword(newPassword), false);
    await this.refreshTokenRepository.update({ userId: user.id, revokedAt: IsNull() }, { revokedAt: new Date() });

    await this.auditLogsService.record({
      companyId: user.companyId,
      branchId: user.defaultBranchId,
      userId: user.id,
      module: 'auth',
      action: 'reset_password',
      entityType: 'user',
      entityId: String(user.id),
      ipAddress: requestMeta?.ipAddress || null,
      userAgent: requestMeta?.userAgent || null,
    });

    return { success: true };
  }

  private async issueTokenPair(user: CurrentUserContext) {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'access' },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'change_me_access'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '15m') as any,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'refresh', nonce: generateOpaqueToken(8) },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'change_me_refresh'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TTL', '7d') as any,
      },
    );

    const refreshTtl = this.configService.get<string>('JWT_REFRESH_TTL', '7d');
    const expiresAt = new Date(Date.now() + this.parseDurationToMs(refreshTtl));

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash: hashOpaqueToken(refreshToken),
        expiresAt,
      }),
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresAt: expiresAt.toISOString(),
    };
  }

  private parseDurationToMs(value: string) {
    const normalized = String(value || '7d').trim();
    const match = normalized.match(/^(\d+)([smhd])$/i);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const factors: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * (factors[unit] || factors.d);
  }
}
