import { Injectable, Global, OnModuleInit } from '@nestjs/common';
import type { RouteInfo } from './route-registry';
import { allRoutes } from './index';

@Injectable()
@Global()
export class RoutesService implements OnModuleInit {
  private routes = new Map<string, RouteInfo>();

  onModuleInit() {
    for (const route of allRoutes) {
      this.routes.set(route.name, route);
    }
  }

  register(info: RouteInfo): void {
    this.routes.set(info.name, info);
  }

  getAll(): RouteInfo[] {
    return Array.from(this.routes.values());
  }

  getByName(name: string): RouteInfo | undefined {
    return this.routes.get(name);
  }

  toMap(): Record<string, RouteInfo> {
    const result: Record<string, RouteInfo> = {};
    for (const [name, info] of this.routes) {
      result[name] = info;
    }
    return result;
  }
}
