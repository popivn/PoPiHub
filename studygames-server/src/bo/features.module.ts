import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FeaturesService } from './features.service';
import { FeaturesController } from './features.controller';
import { FeaturesAdminController } from './features-admin.controller';

@Module({
  imports: [AuthModule],
  controllers: [FeaturesController, FeaturesAdminController],
  providers: [FeaturesService],
  exports: [FeaturesService],
})
export class FeaturesModule {}
