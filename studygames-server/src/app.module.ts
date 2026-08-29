import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { LearnModule } from './learn/learn.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './bo/settings.module';
import { FeaturesModule } from './bo/features.module';
import { UploadsModule } from './bo/uploads.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, UsersModule, PlayersModule, LearnModule, SettingsModule, FeaturesModule, UploadsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
