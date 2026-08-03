import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LandController } from './land.controller';
import { LandService } from './land.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'xianria-dev-secret-change-me';

@Module({
  imports: [
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '100y' },
    }),
  ],
  controllers: [LandController],
  providers: [LandService],
})
export class LandModule {}
