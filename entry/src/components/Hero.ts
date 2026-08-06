import { portfolio } from '../data/portfolio'

export function renderHero(): string {
  return `
  <section id="hero" class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
    <div class="absolute inset-0 bg-gradient-to-br from-fuchsia-900 via-purple-900 to-orange-900"></div>
    <div class="absolute inset-0 opacity-30">
      <div class="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
      <div class="absolute top-40 right-10 w-72 h-72 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style="animation-delay: 1s"></div>
      <div class="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <div class="relative z-10 text-center px-6 max-w-4xl">
      <div class="mb-8 inline-block">
        <img src="${portfolio.logo}" alt="${portfolio.name}" class="w-32 h-32 rounded-full mx-auto ring-4 ring-white/20 shadow-2xl shadow-fuchsia-500/30" />
      </div>
      <div class="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm font-medium text-fuchsia-200">
        <i class="fa-solid fa-hand-wave"></i> Hi, I'm ${portfolio.name}
      </div>
      <h1 class="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-none">
        <span class="bg-gradient-to-r from-fuchsia-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">PoPi</span>Hub
      </h1>
      <p class="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed">
        ${portfolio.tagline}
      </p>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <a href="#projects" class="px-8 py-3.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white font-bold text-lg hover:scale-105 hover:shadow-xl hover:shadow-fuchsia-500/40 transition-all">
          View My Work
        </a>
        <a href="#contact" class="px-8 py-3.5 rounded-full bg-white/10 backdrop-blur border-2 border-white/30 text-white font-bold text-lg hover:bg-white/20 transition-all">
          Get in Touch
        </a>
      </div>
    </div>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
      <i class="fa-solid fa-chevron-down text-2xl"></i>
    </div>
  </section>`
}
