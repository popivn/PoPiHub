import { Controller, Get, Post, Body } from '@nestjs/common';
import { SettingsService, TopicItem } from './settings.service';

@Controller('bo')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettingsHtml(): string {
    return `<!DOCTYPE html>
<html lang="vi" class="h-full bg-slate-950">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SliStudy BackOffice — Quản Lý Chủ Đề & Khóa Học</title>
  <link rel="icon" href="https://fav.farm/" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="h-full flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-teal-500 selection:text-slate-950">

  <!-- BACKOFFICE HEADER -->
  <header class="sticky top-0 z-50 h-16 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-6 flex items-center justify-between shadow-lg shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-teal-500/20">
        <svg class="w-5 h-5 fill-slate-950" viewBox="0 0 24 24"><path d="M13 2L3 14h7v8l10-12h-7z"/></svg>
      </div>
      <div>
        <h1 class="text-sm font-extrabold tracking-wide text-slate-100 flex items-center gap-2">
          <span>SliStudy BackOffice</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-teal-400/10 text-teal-400 border border-teal-500/30 font-bold">ADMIN BO</span>
        </h1>
        <p class="text-[11px] text-slate-400">Hệ Thống Quản Trị Server (/bo)</p>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <div class="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="font-mono text-[11px] text-emerald-400">Server Running (Port 3000)</span>
      </div>

      <a href="https://xianria-4f68a.web.app" target="_blank" rel="noopener noreferrer" class="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/35 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
        <span>Mở Trang Client</span>
        <svg class="w-3.5 h-3.5 fill-slate-950" viewBox="0 0 24 24"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3zM5 5h6v2H5v12h12v-6h2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>
      </a>
    </div>
  </header>

  <!-- MAIN WRAPPER -->
  <div class="flex-1 flex overflow-hidden">
    
    <!-- LEFT SIDEBAR -->
    <aside class="w-64 bg-slate-900/60 border-r border-slate-800/80 flex flex-col justify-between shrink-0 hidden md:flex">
      <div class="p-4 space-y-6">
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2 px-3">Quản Lý Hệ Thống</p>
          <nav class="space-y-1">
            <button onclick="showTopicList()" class="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-teal-400/15 to-cyan-500/15 text-teal-300 border border-teal-500/30 font-bold text-xs shadow-sm cursor-pointer hover:bg-teal-500/20 transition-all">
              <svg class="w-4 h-4 fill-teal-400" viewBox="0 0 24 24"><path d="M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
              <span>Quản Lý Chủ Đề Học</span>
            </button>
            <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-semibold text-xs transition-colors opacity-60 cursor-not-allowed">
              <svg class="w-4 h-4 fill-slate-400" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              <span>Quản Lý Players</span>
            </a>
            <a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 font-semibold text-xs transition-colors opacity-60 cursor-not-allowed">
              <svg class="w-4 h-4 fill-slate-400" viewBox="0 0 24 24"><path d="M7 14a5 5 0 100-10 5 5 0 000 10zm-3 2v6h4v-2h2v-2h2v-2h-3.17A6.98 6.98 0 014 16z"/></svg>
              <span>Secret Keys & Access</span>
            </a>
          </nav>
        </div>
      </div>

      <div class="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5 fill-teal-400" viewBox="0 0 24 24"><path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1zM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1zM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg> NestJS v10</span>
        <span class="px-2 py-0.5 bg-slate-800 rounded font-mono text-[10px]">v1.2.0</span>
      </div>
    </aside>

    <!-- MAIN CONTENT AREA -->
    <main class="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
      
      <!-- TOAST ALERT -->
      <div id="status-toast" class="hidden p-4 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-300 text-xs font-bold shadow-lg shadow-teal-500/10 flex items-center justify-between animate-fade">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5 fill-teal-400" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          <span id="toast-message">Đã lưu cấu hình thành công!</span>
        </div>
      </div>

      <!-- LEVEL 1: TOPIC LIST VIEW -->
      <div id="topic-list-view" class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div class="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>BackOffice</span>
              <span>/</span>
              <span class="text-teal-400 font-bold">Danh Sách Chủ Đề Học</span>
            </div>
            <h2 class="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <svg class="w-6 h-6 fill-teal-400" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
              <span>Quản Lý Chủ Đề Học</span>
            </h2>
            <p class="text-xs text-slate-400 mt-1">Mỗi Chủ Đề Học (Topic) sẽ sinh ra 1 thẻ Legend Div ở section "BẠN MUỐN HỌC GÌ?" trên Client. Bên trong mỗi chủ đề có thể có nhiều Khóa Học (Courses).</p>
          </div>

          <button onclick="openCreateTopicModal()" type="button" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto">
            <svg class="w-4 h-4 fill-slate-950" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            <span>+ Tạo Chủ Đề Học Mới</span>
          </button>
        </div>

        <div id="topics-container" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Dynamic Topics Rendered via JS -->
        </div>
      </div>

      <!-- LEVEL 2: TOPIC COURSES LIST VIEW -->
      <div id="topic-courses-view" class="hidden space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div class="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <button onclick="showTopicList()" class="hover:text-teal-400 transition-colors cursor-pointer flex items-center gap-1">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                <span>Danh Sách Chủ Đề</span>
              </button>
              <span>/</span>
              <span id="topic-courses-breadcrumb" class="text-teal-400 font-bold">Chủ Đề: Tiếng Trung</span>
            </div>
            <h2 id="topic-courses-heading" class="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <svg class="w-6 h-6 fill-teal-400" viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM3.97 9L12 4.63 20.03 9 12 13.37 3.97 9z"/></svg>
              <span>Danh Sách Khóa Học Trong Chủ Đề: Tiếng Trung</span>
            </h2>
            <p class="text-xs text-slate-400 mt-1">Các khóa học bên trong chủ đề này</p>
          </div>

          <div class="flex items-center gap-3">
            <button onclick="showTopicList()" type="button" class="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              <span>Quay Lại Chủ Đề</span>
            </button>
            <button onclick="openEditTopicModal(selectedTopicId)" type="button" class="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-teal-300 font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 fill-teal-400" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              <span>Sửa Tên Chủ Đề</span>
            </button>
            <button onclick="deleteCurrentTopic()" type="button" class="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs hover:bg-rose-500/20 transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 fill-rose-400" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              <span>Xóa Chủ Đề Này</span>
            </button>
            <button onclick="createNewCourseInTopic()" type="button" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 fill-slate-950" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
              <span>+ Thêm Khóa Học Vào Chủ Đề</span>
            </button>
          </div>
        </div>

        <div id="courses-container" class="space-y-4">
          <!-- Dynamic Courses Inside Selected Topic Rendered via JS -->
        </div>
      </div>

      <!-- LEVEL 3: COURSE FORM EDIT / CREATE VIEW -->
      <div id="course-form-view" class="hidden space-y-6">
        <div class="flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div>
            <div class="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <button onclick="openTopicCoursesView(selectedTopicId)" class="hover:text-teal-400 transition-colors cursor-pointer flex items-center gap-1">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                <span>Danh Sách Khóa Học</span>
              </button>
              <span>/</span>
              <span id="course-form-breadcrumb" class="text-teal-400 font-bold">Học Mặt Chữ Tiếng Trung</span>
            </div>
            <h2 id="course-form-title" class="text-2xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <svg class="w-6 h-6 fill-teal-400" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
              <span>Cấu Hình Thông Tin Khóa Học</span>
            </h2>
          </div>

          <div class="flex items-center gap-3">
            <button onclick="openTopicCoursesView(selectedTopicId)" type="button" class="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
              <span>Hủy</span>
            </button>
            <button id="save-course-btn" type="button" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
              <svg class="w-4 h-4 fill-slate-950" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H6V5h9v4z"/></svg>
              <span>Lưu Khóa Học Này</span>
            </button>
          </div>
        </div>

        <!-- COURSE FORM CARD -->
        <div class="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
          <div class="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 class="text-base font-extrabold text-slate-100">Cấu Hình Item Khóa Học</h3>
              <p class="text-xs text-slate-400 mt-1">Thông tin khóa học hiển thị bên trong thẻ Legend Div của chủ đề trên Client</p>
            </div>
            
            <label class="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
              <input id="course-active-toggle" type="checkbox" class="sr-only peer" checked />
              <div class="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-400 relative"></div>
              <span class="text-xs font-bold text-teal-300">Active</span>
            </label>
          </div>

          <form id="course-details-form" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">Tên Khóa Học (Tiếng Việt)</label>
                <input id="course-title" type="text" placeholder="Học Mặt Chữ Tiếng Trung" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-bold focus:outline-none focus:border-teal-400 transition-colors" />
              </div>

              <div>
                <label class="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">Tên Khóa Học (Tiếng Anh)</label>
                <input id="course-titleEn" type="text" placeholder="Chinese Learning Hub" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-semibold focus:outline-none focus:border-teal-400 transition-colors" />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">Mô Tả Khóa Học (Tiếng Việt)</label>
                <textarea id="course-description" rows="3" placeholder="Ghi nhớ bộ thủ, phát âm, pinyin và nhận diện mặt chữ Hán..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-teal-400 transition-colors resize-none leading-relaxed"></textarea>
              </div>

              <div>
                <label class="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">Mô Tả Khóa Học (Tiếng Anh)</label>
                <textarea id="course-descriptionEn" rows="3" placeholder="Memorize radicals, pronunciation, pinyin and recognize Chinese characters..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-teal-400 transition-colors resize-none leading-relaxed"></textarea>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">Hình Ảnh Bìa Khóa Học (Cover Image)</label>
                
                <!-- FILE UPLOADER & URL INPUT -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
                  <label class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs border border-slate-700 cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0 shadow-sm">
                    <svg class="w-4 h-4 fill-teal-400" viewBox="0 0 24 24"><path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-3.86 2.14 2.57 3-3.86L17 19H5z"/></svg>
                    <span>📂 Chọn File Ảnh Từ Máy...</span>
                    <input id="course-image-file-input" type="file" accept="image/*" onchange="handleImageFileUpload(event)" class="hidden" />
                  </label>
                  <span class="text-xs text-slate-400 font-medium text-center sm:text-left">hoặc nhập URL ảnh:</span>
                </div>

                <input id="course-image" type="text" placeholder="/chinese_course_thumb.jpg hoặc https://..." oninput="updateCourseImagePreview(this.value)" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-teal-300 font-mono focus:outline-none focus:border-teal-400 transition-colors" />
                
                <!-- LIVE COVER IMAGE PREVIEW -->
                <div class="mt-3 p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex items-center gap-4">
                  <div class="w-24 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 relative flex items-center justify-center text-xl text-teal-400 font-bold">
                    <img id="course-image-preview" src="/chinese_course_thumb.jpg" alt="Cover Preview" class="w-full h-full object-cover" onerror="this.style.display='none'; document.getElementById('course-image-fallback').style.display='flex';" onload="this.style.display='block'; document.getElementById('course-image-fallback').style.display='none';" />
                    <div id="course-image-fallback" class="hidden w-full h-full bg-teal-500/10 flex flex-col items-center justify-center gap-0.5 text-slate-400 text-[10px] font-bold">
                      <span class="text-base">🇨🇳</span>
                      <span>No Image</span>
                    </div>
                  </div>
                  <div class="space-y-1 text-xs">
                    <span class="font-bold text-slate-200 block">Xem Trước Ảnh Bìa (Preview)</span>
                    <span id="course-image-preview-url" class="text-[11px] text-teal-400 font-mono break-all line-clamp-1">/chinese_course_thumb.jpg</span>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">Đường Dẫn Bắt Đầu Học (Link)</label>
                <input id="course-link" type="text" placeholder="/learn/chinese" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-teal-300 font-mono focus:outline-none focus:border-teal-400 transition-colors" />
              </div>
            </div>

            <div class="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button type="submit" class="px-8 py-3 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2">
                <svg class="w-5 h-5 fill-slate-950" viewBox="0 0 24 24"><path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                <span>Lưu Khóa Học Này 💾</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </main>
  </div>

  <!-- TOPIC CREATE / EDIT MODAL -->
  <div id="topic-modal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 hidden">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
            <svg class="w-5 h-5 fill-teal-400" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </div>
          <div>
            <h3 id="topic-modal-title" class="text-lg font-extrabold text-slate-100">Tạo Chủ Đề Học Mới</h3>
            <p class="text-xs text-slate-400">Tạo thẻ Legend Div hiển thị trên Client</p>
          </div>
        </div>
        <button onclick="closeTopicModal()" type="button" class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors cursor-pointer">
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </div>

      <form id="topic-modal-form" onsubmit="handleTopicModalSubmit(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">Tên Chủ Đề (Tiếng Việt) <span class="text-rose-400">*</span></label>
          <input id="topic-input-name" type="text" required placeholder="Ví dụ: Tiếng Trung, Tiếng Anh, Lập Trình IT..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 font-bold focus:outline-none focus:border-teal-400 transition-colors" />
        </div>

        <div>
          <label class="block text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-2">Tên Chủ Đề (Tiếng Anh)</label>
          <input id="topic-input-nameEn" type="text" placeholder="Ví dụ: Chinese, English, Web Development..." class="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 font-semibold focus:outline-none focus:border-teal-400 transition-colors" />
        </div>

        <div class="flex items-center justify-between pt-2">
          <span class="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Trạng Thái Active</span>
          <label class="flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
            <input id="topic-input-active" type="checkbox" class="sr-only peer" checked />
            <div class="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-400 relative"></div>
            <span class="text-xs font-bold text-teal-300">Active</span>
          </label>
        </div>

        <div class="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
          <button type="button" onclick="closeTopicModal()" class="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer">
            Hủy
          </button>
          <button type="submit" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
            <svg class="w-4 h-4 fill-slate-950" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>Lưu Chủ Đề</span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- BACKOFFICE FOOTER -->
  <footer class="h-12 bg-slate-950 border-t border-slate-800/80 px-6 flex items-center justify-between text-xs text-slate-400 shrink-0">
    <p>© 2026 SliStudy BackOffice Management System. NestJS Engine + Tailwind CSS.</p>
    <p class="font-mono text-[11px] flex items-center gap-1.5">
      <svg class="w-3.5 h-3.5 fill-teal-400" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
      <span>Server Port 3000 • Authenticated Session</span>
    </p>
  </footer>

  <script>
    var currentTopics = [];
    var selectedTopicId = null;
    var selectedCourseId = null;
    var isCreatingCourse = false;
    var editingTopicId = null;

    function openCreateTopicModal() {
      editingTopicId = null;
      document.getElementById('topic-modal-title').innerText = 'Tạo Chủ Đề Học Mới';
      document.getElementById('topic-input-name').value = '';
      document.getElementById('topic-input-nameEn').value = '';
      document.getElementById('topic-input-active').checked = true;
      document.getElementById('topic-modal').classList.remove('hidden');
      setTimeout(function() {
        document.getElementById('topic-input-name').focus();
      }, 100);
    }

    function openEditTopicModal(topicId) {
      var topic = currentTopics.find(function(t) { return t.id === topicId; });
      if (!topic) return;
      editingTopicId = topicId;
      document.getElementById('topic-modal-title').innerText = 'Chỉnh Sửa Chủ Đề: ' + topic.name;
      document.getElementById('topic-input-name').value = topic.name || '';
      document.getElementById('topic-input-nameEn').value = topic.nameEn || '';
      document.getElementById('topic-input-active').checked = topic.active !== false;
      document.getElementById('topic-modal').classList.remove('hidden');
      setTimeout(function() {
        document.getElementById('topic-input-name').focus();
      }, 100);
    }

    function closeTopicModal() {
      document.getElementById('topic-modal').classList.add('hidden');
      editingTopicId = null;
    }

    async function handleTopicModalSubmit(e) {
      if (e) e.preventDefault();
      const name = document.getElementById('topic-input-name').value.trim();
      const nameEn = document.getElementById('topic-input-nameEn').value.trim();
      const active = document.getElementById('topic-input-active').checked;

      if (!name) return;

      if (editingTopicId) {
        var topic = currentTopics.find(function(t) { return t.id === editingTopicId; });
        if (topic) {
          topic.name = name;
          topic.nameEn = nameEn || name;
          topic.active = active;
          await saveTopicsToApi('Đã cập nhật chủ đề "' + topic.name + '" thành công!');
        }
      } else {
        const newTopic = {
          id: 'topic_' + Date.now(),
          name: name,
          nameEn: nameEn || name,
          active: active,
          courses: []
        };
        currentTopics.push(newTopic);
        await saveTopicsToApi('Đã tạo Chủ Đề Học mới "' + newTopic.name + '" thành công!');
      }

      closeTopicModal();
      renderTopicList();
      if (selectedTopicId && editingTopicId === selectedTopicId) {
        openTopicCoursesView(selectedTopicId);
      }
    }

    function promptCreateTopic() {
      openCreateTopicModal();
    }

    async function loadTopics() {
      try {
        const res = await fetch('/bo/courses');
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0 && !data[0].courses) {
          currentTopics = [{
            id: 'topic_chinese',
            name: 'Tiếng Trung',
            nameEn: 'Chinese',
            active: true,
            courses: data
          }];
        } else if (Array.isArray(data) && data.length > 0) {
          currentTopics = data;
        } else {
          currentTopics = [{
            id: 'topic_chinese',
            name: 'Tiếng Trung',
            nameEn: 'Chinese',
            active: true,
            courses: [{
              id: 'chinese_hub',
              title: 'Học Mặt Chữ Tiếng Trung',
              titleEn: 'Chinese Learning Hub',
              description: 'Ghi nhớ bộ thủ, phát âm, pinyin và nhận diện mặt chữ Hán qua các bài lướt thẻ 3D & trò chơi Slime Quiz tương tác thú vị.',
              descriptionEn: 'Memorize radicals, pronunciation, pinyin and recognize Chinese characters through interactive 3D flashcards & Slime Quiz games.',
              image: '/chinese_course_thumb.jpg',
              link: '/learn/chinese',
              active: true
            }]
          }];
        }
        renderTopicList();
      } catch(e) {
        console.error(e);
      }
    }

    function renderTopicList() {
      const container = document.getElementById('topics-container');
      if (!container) return;
      container.innerHTML = '';

      if (!currentTopics || currentTopics.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400 col-span-2 text-center py-8">Chưa có chủ đề học nào. Nhấn "+ Tạo Chủ Đề Học Mới" để tạo chủ đề đầu tiên.</p>';
        return;
      }

      currentTopics.forEach(function(topic) {
        const card = document.createElement('div');
        card.className = 'bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:border-teal-400/50 transition-all duration-300 cursor-pointer group shadow-xl relative overflow-hidden flex flex-col justify-between gap-4';
        
        card.onclick = function() {
          openTopicCoursesView(topic.id);
        };

        const courseCount = Array.isArray(topic.courses) ? topic.courses.length : 0;
        const isAct = topic.active !== false;
        const actText = isAct ? 'Active' : 'Inactive';
        const actClass = isAct ? 'bg-teal-400/10 text-teal-400 border border-teal-500/30' : 'bg-rose-400/10 text-rose-400 border border-rose-500/30';

        var inner = '<div class="space-y-3">' +
            '<div class="flex items-center justify-between">' +
              '<span class="px-3.5 py-1 bg-slate-950 border border-teal-500/40 text-teal-300 rounded-full text-xs font-extrabold flex items-center gap-1.5">' +
                '<span>📚</span>' +
                '<span>' + topic.name + '</span>' +
              '</span>' +
              '<div class="flex items-center gap-2">' +
                '<button type="button" class="edit-topic-btn px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-teal-300 font-bold text-xs hover:border-teal-400 transition-colors cursor-pointer">Sửa</button>' +
                '<span class="text-xs font-bold px-2.5 py-0.5 rounded-full ' + actClass + '">' + actText + '</span>' +
              '</div>' +
            '</div>' +
            '<div>' +
              '<h3 class="text-xl font-extrabold text-slate-100 group-hover:text-teal-300 transition-colors">Chủ Đề: ' + topic.name + '</h3>' +
              '<p class="text-xs text-slate-400 mt-1">Bao gồm ' + courseCount + ' khóa học bên trong Legend Div này</p>' +
            '</div>' +
          '</div>' +
          '<div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">' +
            '<span class="text-slate-400 font-mono">Mã: <strong class="text-teal-400">' + topic.id + '</strong></span>' +
            '<span class="text-teal-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">' +
              '<span>Quản lý ' + courseCount + ' khóa học inside</span>' +
              '<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>' +
            '</span>' +
          '</div>';
        
        card.innerHTML = inner;
        const editBtn = card.querySelector('.edit-topic-btn');
        if (editBtn) {
          editBtn.onclick = function(e) {
            e.stopPropagation();
            openEditTopicModal(topic.id);
          };
        }
        container.appendChild(card);
      });
    }

    function showTopicList() {
      document.getElementById('topic-list-view').classList.remove('hidden');
      document.getElementById('topic-courses-view').classList.add('hidden');
      document.getElementById('course-form-view').classList.add('hidden');
      selectedTopicId = null;
      selectedCourseId = null;
    }

    function openTopicCoursesView(topicId) {
      var topic = currentTopics.find(function(t) { return t.id === topicId; });
      if (!topic) return;

      selectedTopicId = topicId;
      document.getElementById('topic-courses-breadcrumb').innerText = 'Chủ Đề: ' + topic.name;
      document.getElementById('topic-courses-heading').innerText = 'Danh Sách Khóa Học Trong Chủ Đề: ' + topic.name;

      const container = document.getElementById('courses-container');
      container.innerHTML = '';

      if (!Array.isArray(topic.courses) || topic.courses.length === 0) {
        container.innerHTML = '<p class="text-xs text-slate-400 text-center py-8">Chủ đề này chưa có khóa học nào. Nhấn "+ Thêm Khóa Học Vào Chủ Đề" để tạo khóa học đầu tiên.</p>';
      } else {
        topic.courses.forEach(function(course) {
          const item = document.createElement('div');
          item.className = 'bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-teal-400/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group';

          item.innerHTML = '<div class="flex items-center gap-4">' +
              '<div class="w-20 h-16 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center text-2xl font-bold text-teal-400 select-none">' +
                '<img src="' + (course.image || '/chinese_course_thumb.jpg') + '" alt="' + course.title + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform" onerror="this.onerror=null; this.remove();" />' +
                '<span>🇨🇳</span>' +
              '</div>' +
              '<div>' +
                '<h4 class="text-base font-bold text-slate-100 group-hover:text-teal-300 transition-colors">' + course.title + (course.titleEn ? (' <span class="text-xs font-semibold text-teal-400">(' + course.titleEn + ')</span>') : '') + '</h4>' +
                '<p class="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">' + (course.description || '') + (course.descriptionEn ? (' <span class="text-slate-500 font-mono">[' + course.descriptionEn + ']</span>') : '') + '</p>' +
              '</div>' +
            '</div>' +
            '<div class="flex items-center gap-2 self-end md:self-auto shrink-0">' +
              '<button class="edit-btn px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-teal-300 font-bold text-xs hover:border-teal-400 transition-colors cursor-pointer">' +
                'Chỉnh Sửa' +
              '</button>' +
              '<button class="del-btn px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 font-bold text-xs hover:bg-rose-500/20 transition-colors cursor-pointer">' +
                'Xóa' +
              '</button>' +
            '</div>';

          item.querySelector('.edit-btn').onclick = function(e) {
            e.stopPropagation();
            openCourseForm(course.id);
          };
          item.querySelector('.del-btn').onclick = function(e) {
            e.stopPropagation();
            deleteCourse(course.id);
          };

          container.appendChild(item);
        });
      }

      document.getElementById('topic-list-view').classList.add('hidden');
      document.getElementById('topic-courses-view').classList.remove('hidden');
      document.getElementById('course-form-view').classList.add('hidden');
    }

    async function deleteCurrentTopic() {
      if (!selectedTopicId) return;
      if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ chủ đề này cùng tất cả khóa học bên trong?')) return;

      currentTopics = currentTopics.filter(function(t) { return t.id !== selectedTopicId; });
      await saveTopicsToApi('Đã xóa chủ đề học thành công!');
      showTopicList();
    }

    function handleImageFileUpload(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const dataUrl = evt.target.result;
        document.getElementById('course-image').value = dataUrl;
        updateCourseImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }

    function updateCourseImagePreview(url) {
      const img = document.getElementById('course-image-preview');
      const fallback = document.getElementById('course-image-fallback');
      const urlLabel = document.getElementById('course-image-preview-url');
      if (!img || !urlLabel) return;

      const src = url && url.trim() ? url.trim() : '/chinese_course_thumb.jpg';
      urlLabel.innerText = src.length > 80 ? src.substring(0, 80) + '...' : src;

      img.onerror = function() {
        img.style.display = 'none';
        if (fallback) fallback.style.display = 'flex';
      };
      img.onload = function() {
        img.style.display = 'block';
        if (fallback) fallback.style.display = 'none';
      };
      img.src = src;
    }

    function createNewCourseInTopic() {
      isCreatingCourse = true;
      selectedCourseId = 'course_' + Date.now();

      document.getElementById('course-form-breadcrumb').innerText = 'Tạo Khóa Học Mới';
      document.getElementById('course-form-title').innerText = 'Thêm Khóa Học Mới Vào Chủ Đề';

      document.getElementById('course-title').value = '';
      document.getElementById('course-titleEn').value = '';
      document.getElementById('course-description').value = '';
      document.getElementById('course-descriptionEn').value = '';
      document.getElementById('course-image').value = '/chinese_course_thumb.jpg';
      document.getElementById('course-link').value = '/learn/chinese';
      document.getElementById('course-active-toggle').checked = true;

      updateCourseImagePreview('/chinese_course_thumb.jpg');

      document.getElementById('topic-courses-view').classList.add('hidden');
      document.getElementById('course-form-view').classList.remove('hidden');
    }

    function openCourseForm(courseId) {
      var topic = currentTopics.find(function(t) { return t.id === selectedTopicId; });
      if (!topic || !Array.isArray(topic.courses)) return;

      var course = topic.courses.find(function(c) { return c.id === courseId; });
      if (!course) return;

      isCreatingCourse = false;
      selectedCourseId = courseId;

      document.getElementById('course-form-breadcrumb').innerText = course.title;
      document.getElementById('course-form-title').innerText = 'Chỉnh Sửa: ' + course.title;

      document.getElementById('course-title').value = course.title || '';
      document.getElementById('course-titleEn').value = course.titleEn || '';
      document.getElementById('course-description').value = course.description || '';
      document.getElementById('course-descriptionEn').value = course.descriptionEn || '';
      const imgVal = course.image || '/chinese_course_thumb.jpg';
      document.getElementById('course-image').value = imgVal;
      document.getElementById('course-link').value = course.link || '/learn/chinese';
      document.getElementById('course-active-toggle').checked = course.active !== false;

      updateCourseImagePreview(imgVal);

      document.getElementById('topic-courses-view').classList.add('hidden');
      document.getElementById('course-form-view').classList.remove('hidden');
    }

    async function deleteCourse(courseId) {
      var topic = currentTopics.find(function(t) { return t.id === selectedTopicId; });
      if (!topic || !Array.isArray(topic.courses)) return;
      if (!confirm('Bạn có chắc chắn muốn xóa khóa học này?')) return;

      topic.courses = topic.courses.filter(function(c) { return c.id !== courseId; });
      await saveTopicsToApi('Đã xóa khóa học thành công!');
      openTopicCoursesView(selectedTopicId);
    }

    async function saveCourseForm() {
      var topicIndex = currentTopics.findIndex(function(t) { return t.id === selectedTopicId; });
      if (topicIndex === -1) return;

      if (!Array.isArray(currentTopics[topicIndex].courses)) {
        currentTopics[topicIndex].courses = [];
      }

      const courseData = {
        id: selectedCourseId || 'course_' + Date.now(),
        title: document.getElementById('course-title').value || 'Khóa Học Mới',
        titleEn: document.getElementById('course-titleEn').value || '',
        description: document.getElementById('course-description').value || '',
        descriptionEn: document.getElementById('course-descriptionEn').value || '',
        image: document.getElementById('course-image').value || '/chinese_course_thumb.jpg',
        link: document.getElementById('course-link').value || '/learn/chinese',
        active: document.getElementById('course-active-toggle').checked
      };

      if (isCreatingCourse) {
        currentTopics[topicIndex].courses.push(courseData);
      } else {
        var cIndex = currentTopics[topicIndex].courses.findIndex(function(c) { return c.id === selectedCourseId; });
        if (cIndex !== -1) {
          currentTopics[topicIndex].courses[cIndex] = courseData;
        } else {
          currentTopics[topicIndex].courses.push(courseData);
        }
      }

      await saveTopicsToApi('Đã lưu khóa học thành công!');
      openTopicCoursesView(selectedTopicId);
    }

    async function saveTopicsToApi(msg) {
      await fetch('/bo/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentTopics)
      });

      const toast = document.getElementById('status-toast');
      document.getElementById('toast-message').innerText = msg;
      toast.classList.remove('hidden');
      setTimeout(function() { toast.classList.add('hidden'); }, 4000);
    }

    document.getElementById('course-details-form').addEventListener('submit', function(e) {
      e.preventDefault();
      saveCourseForm();
    });
    document.getElementById('save-course-btn').addEventListener('click', function() {
      saveCourseForm();
    });

    window.onload = loadTopics;
    loadTopics();
  </script>
</body>
</html>`;
  }

  @Get('courses')
  async getTopics(): Promise<TopicItem[]> {
    return this.settingsService.getTopics();
  }

  @Post('courses')
  async updateTopics(@Body() body: any): Promise<TopicItem[]> {
    const topics = Array.isArray(body) ? body : body?.topics ?? [];
    return this.settingsService.updateTopics(topics);
  }
}
