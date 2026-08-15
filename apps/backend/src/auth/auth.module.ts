// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminService } from './services/admin.service';
import { JwtAdminGuard } from './guards/jwt-admin.guard';
import { JwtAdminRefreshGuard } from './guards/jwt-admin-refresh.guard';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { GoogleAdminStrategy } from './strategies/google-admin.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // 空配置，因為我們在 TokenService 中手動處理
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [
    AuthService,
    TokenService,
    GoogleStrategy,
    GoogleAdminStrategy,
    JwtAccessGuard,
    JwtRefreshGuard,
    JwtAdminGuard,
    JwtAdminRefreshGuard,
    AdminService,
    AdminAuthService,
  ],
  exports: [AuthService, TokenService, AdminService],
})
export class AuthModule {}
