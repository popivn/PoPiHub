import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlayersService, type CreatePlayerDto } from './players.service';

@UseGuards(JwtAuthGuard)
@Controller('players')
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  private getUid(req: any): string {
    return req.user?.sub;
  }

  @Get()
  list(@Req() req: any) {
    return this.players.list(this.getUid(req));
  }

  @Post()
  create(@Req() req: any, @Body() body: CreatePlayerDto) {
    return this.players.create(this.getUid(req), body);
  }

  @Get('selected')
  selected(@Req() req: any) {
    return this.players.selectedPlayer(this.getUid(req));
  }

  @Post(':id/select')
  select(@Req() req: any, @Param('id') id: string) {
    return this.players.select(this.getUid(req), id);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.players.remove(this.getUid(req), id);
  }
}
