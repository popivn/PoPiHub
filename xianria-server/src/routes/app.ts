import type { RouteInfo } from './route-registry';

export const appRoutes: RouteInfo[] = [
  { name: 'home', method: 'GET', path: '/', description: 'Dashboard' },
  { name: 'api.routes', method: 'GET', path: '/api/routes', description: 'Danh sách routes' },
  { name: 'api.sidebar', method: 'GET', path: '/api/sidebar', description: 'Danh sách sidebar items' },
  { name: 'api.banners', method: 'GET', path: '/api/banners', description: 'Danh sách banner' },
  { name: 'api.banners.latest', method: 'GET', path: '/api/banners/latest', description: 'Banner mới nhất' },
  { name: 'api.banners.upload', method: 'POST', path: '/api/banners/upload', description: 'Upload banner' },
  { name: 'api.land', method: 'GET', path: '/api/land', description: 'Danh sách đất' },
  { name: 'api.land.mine', method: 'GET', path: '/api/land/mine', description: 'Đất của user' },
  { name: 'api.land.buy', method: 'POST', path: '/api/land/buy', description: 'Mua đất' },
];
