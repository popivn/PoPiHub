import type { RouteInfo } from './route-registry';

export const authRoutes: RouteInfo[] = [
  { name: 'auth.register', method: 'POST', path: '/auth/register', description: 'Đăng ký tài khoản' },
  { name: 'auth.login', method: 'POST', path: '/auth/login', description: 'Đăng nhập' },
  { name: 'auth.guest', method: 'POST', path: '/auth/guest', description: 'Vào game jako khách' },
  { name: 'auth.verify', method: 'GET', path: '/auth/verify', description: 'Verify JWT token' },
];
