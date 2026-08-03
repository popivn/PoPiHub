import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RoutesModule } from './routes/routes.module';
import { SidebarModule } from './sidebar/sidebar.module';
import { BannerModule } from './banner/banner.module';
import { LandModule } from './land/land.module';

@Module({
  imports: [AuthModule, RoutesModule, SidebarModule, BannerModule, LandModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
