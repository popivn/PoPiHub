import { Sidebar } from './Sidebar.js';
import { DashboardPanel } from './panels/DashboardPanel.js';
import { ContentPanel } from './panels/ContentPanel.js';
import type { SidebarItem } from '../sidebar/sidebar.service.js';

export function DashboardApp({ sidebarItems }: { sidebarItems: SidebarItem[] }) {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar items={sidebarItems} />
      <main className="flex-1 p-6 lg:p-8 overflow-x-auto">
        <div className="mb-6">
          <h1 id="page-title" className="text-2xl font-bold text-white">Dashboard</h1>
          <p id="page-subtitle" className="text-kh-text-dim text-sm mt-1">Tổng quan hệ thống</p>
        </div>
        <DashboardPanel />
        <ContentPanel />
      </main>
    </div>
  );
}

export const DASHBOARD_SCRIPT = `
    fetch('/api/sidebar')
      .then(r => r.json())
      .then(items => {
        const nav = document.getElementById('sidebar-nav');
        if (!items.length) {
          nav.innerHTML = '<div className="text-kh-muted text-xs px-3 py-2">Chưa có sidebar items</div>';
          return;
        }
        nav.innerHTML = items.map(item =>
          '<button class="sidebar-item flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-kh-text-dim text-sm cursor-pointer transition-colors duration-150 border-none bg-transparent text-left w-full hover:bg-kh-accent/10 hover:text-kh-text" data-id="' + item.id + '" data-label="' + item.label + '">' +
          '<span class="w-5 h-5 flex items-center justify-center shrink-0">' + getIcon(item.icon) + '</span>' +
          item.label + '</button>'
        ).join('');
        wireSidebarEvents();
        restoreFromUrl();
      })
      .catch(() => {
        document.getElementById('sidebar-nav').innerHTML =
          '<div class="text-kh-red text-xs px-3 py-2">Không thể tải sidebar</div>';
      });

    function getIcon(name) {
      const icons = {
        dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
        content: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>',
      };
      return icons[name] || icons.dashboard;
    }

    function wireSidebarEvents() {
      document.querySelectorAll('.sidebar-item').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.sidebar-item').forEach(b => {
            b.classList.remove('bg-kh-accent/15', 'text-kh-accent');
            b.classList.add('text-kh-text-dim');
          });
          btn.classList.add('bg-kh-accent/15', 'text-kh-accent');
          btn.classList.remove('text-kh-text-dim');
          const id = btn.dataset.id;
          const label = btn.dataset.label;
          document.getElementById('page-title').textContent = label;
          document.querySelectorAll('#panel-dashboard, #panel-content').forEach(p => {
            p.classList.add('hidden');
            p.classList.remove('block');
          });
          const panel = document.getElementById('panel-' + id);
          if (panel) { panel.classList.remove('hidden'); panel.classList.add('block'); }
          const url = new URL(window.location.href);
          url.searchParams.set('page', id);
          window.history.pushState({}, '', url.toString());
        });
      });
    }

    function restoreFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const pageId = params.get('page');
      if (pageId) {
        const btn = document.querySelector('.sidebar-item[data-id="' + pageId + '"]');
        if (btn) { btn.click(); return; }
      }
      const first = document.querySelector('.sidebar-item');
      if (first) first.click();
    }

    fetch('/api/routes')
      .then(r => r.json())
      .then(routesMap => {
        const tbody = document.getElementById('routes-body');
        const routes = Object.values(routesMap);
        if (!routes.length) {
          tbody.innerHTML = '<tr><td colspan="4" class="text-kh-muted italic py-4 text-center">Chưa có endpoint nào</td></tr>';
          return;
        }
        tbody.innerHTML = routes.map(r =>
          '<tr>' +
          '<td class="py-2.5 px-3 border-b border-white/5 text-kh-accent font-mono text-xs">' + r.name + '</td>' +
          '<td class="py-2.5 px-3 border-b border-white/5 text-kh-green font-mono">' + (r.method || 'GET') + '</td>' +
          '<td class="py-2.5 px-3 border-b border-white/5 text-kh-text">' + r.path + '</td>' +
          '<td class="py-2.5 px-3 border-b border-white/5 text-kh-text-dim text-xs">' + (r.description || '') + '</td>' +
          '</tr>'
        ).join('');
      })
      .catch(() => {
        document.getElementById('routes-body').innerHTML =
          '<tr><td colspan="4" class="text-kh-muted italic py-4 text-center">Không thể tải danh sách endpoint</td></tr>';
      });

    // === Banner upload ===
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      customClass: { popup: '!bg-kh-surface !text-kh-text !border !border-kh-border' },
    });

    function loadBanners() {
      fetch('/api/banners')
        .then(r => r.json())
        .then(banners => {
          const list = document.getElementById('banner-list');
          if (!banners.length) {
            list.innerHTML = '<div class="text-kh-muted italic text-sm">Chưa có banner nào</div>';
            return;
          }
          list.innerHTML = banners.map(b =>
            '<div class="bg-kh-surface-light rounded-xl overflow-hidden border border-kh-border">' +
            '<img src="' + b.url + '" alt="' + (b.title || '') + '" class="w-full h-32 object-cover" />' +
            '<div class="p-3"><div class="text-sm text-kh-text font-medium">' + (b.title || 'Untitled') + '</div>' +
            '<div class="text-xs text-kh-text-dim mt-1">' + new Date(b.createdAt).toLocaleString('vi-VN') + '</div></div>' +
            '</div>'
          ).join('');
        })
        .catch(() => {
          document.getElementById('banner-list').innerHTML =
            '<div class="text-kh-red text-sm">Không thể tải danh sách banner</div>';
        });
    }

    document.getElementById('banner-upload-btn')?.addEventListener('click', () => {
      const title = document.getElementById('banner-title')?.value?.trim() || '';
      const fileInput = document.getElementById('banner-file');
      const file = fileInput?.files?.[0];
      if (!file) {
        Toast.fire({ icon: 'warning', title: 'Vui lòng chọn file ảnh' });
        return;
      }
      Swal.fire({
        title: 'Đang upload...',
        text: 'Vui lòng đợi',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
        customClass: { popup: '!bg-kh-surface !text-kh-text !border !border-kh-border' },
      });
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        try {
          const res = await fetch('/api/banners/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, base64, mimeType: file.type }),
          });
          if (!res.ok) throw new Error('Upload failed');
          Swal.close();
          if (fileInput) fileInput.value = '';
          const titleInput = document.getElementById('banner-title');
          if (titleInput) titleInput.value = '';
          Toast.fire({ icon: 'success', title: 'Upload banner thành công!' });
          loadBanners();
        } catch (err) {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Lỗi upload',
            text: err.message || 'Không thể upload banner',
            customClass: { popup: '!bg-kh-surface !text-kh-text !border !border-kh-border' },
          });
        }
      };
      reader.readAsDataURL(file);
    });

    loadBanners();
`;
