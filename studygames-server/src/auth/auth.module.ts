import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { BoAuthGuard } from './bo-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      // Trong production: đặt JWT_SECRET mạnh (>= 32 ký tự random)
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, BoAuthGuard],
  exports: [AuthService, JwtAuthGuard, BoAuthGuard, JwtModule],
})
export class AuthModule {}
