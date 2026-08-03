import { Injectable } from '@nestjs/common';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { DashboardApp, DASHBOARD_SCRIPT } from './dashboard/DashboardApp.js';
import { SidebarService } from './sidebar/sidebar.service.js';

@Injectable()
export class AppService {
  constructor(private readonly sidebarService: SidebarService) {}

  async getHello(): Promise<string> {
    const sidebarItems = await this.sidebarService.getAll().catch(() => []);
    const appHtml = renderToString(createElement(DashboardApp, { sidebarItems }));
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Xianria Server Dashboard</title>
  <link rel="stylesheet" href="/css/tailwind.css" />
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body class="min-h-screen bg-kh-bg text-kh-text font-sans">
  <div id="root">${appHtml}</div>
  <script>${DASHBOARD_SCRIPT}</script>
</body>
</html>`;
  }
}
