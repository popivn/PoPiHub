import type { RouteInfo } from './route-registry';
import { authRoutes } from './auth';
import { appRoutes } from './app';

export const allRoutes: RouteInfo[] = [
  ...appRoutes,
  ...authRoutes,
];
