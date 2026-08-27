import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SettingsService } from './settings.service';
import { TopicsController } from './topics.controller';
import { TopicsAdminController } from './topics-admin.controller';

@Module({
  imports: [AuthModule],
  controllers: [TopicsController, TopicsAdminController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
