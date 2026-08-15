import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';

@Module({
  imports: [AuthModule],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
