import { portfolio } from '../data/portfolio'

export function renderAbout(): string {
  return `
  <section id="about" class="relative py-24 px-6 bg-gradient-to-b from-black to-zinc-900">
    <div class="max-w-5xl mx-auto">
      <div class="mb-12 text-center">
        <h2 class="text-4xl md:text-5xl font-black text-white mb-3">About <span class="bg-gradient-to-r from-fuchsia-400 to-orange-400 bg-clip-text text-transparent">Me</span></h2>
        <div class="w-20 h-1 bg-gradient-to-r from-fuchsia-500 to-orange-500 mx-auto rounded-full"></div>
      </div>

      <div class="grid md:grid-cols-5 gap-10 items-start">
        <div class="md:col-span-2 flex flex-col items-center">
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-orange-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition"></div>
            <img src="${portfolio.logo}" alt="${portfolio.name}" class="relative w-full max-w-xs rounded-2xl shadow-2xl" />
          </div>
          <div class="mt-6 space-y-2 text-center">
            <p class="text-white font-bold text-xl">${portfolio.fullName}</p>
            <p class="text-gray-400 text-sm flex items-center justify-center gap-2">
              <i class="fa-solid fa-location-dot"></i>
              ${portfolio.location}
            </p>
          </div>
        </div>

        <div class="md:col-span-3 space-y-5">
          ${portfolio.about.map(p => `<p class="text-gray-300 text-lg leading-relaxed">${p}</p>`).join('')}
          <div class="flex flex-wrap gap-3 pt-4">
            <span class="px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-sm font-medium"><i class="fa-brands fa-laravel mr-1.5"></i>Laravel Expert</span>
            <span class="px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-sm font-medium"><i class="fa-brands fa-node-js mr-1.5"></i>Node.js Expert</span>
            <span class="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-medium"><i class="fa-solid fa-graduation-cap mr-1.5"></i>Learning .NET</span>
            <span class="px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-sm font-medium"><i class="fa-solid fa-robot mr-1.5"></i>AI-Assisted Dev</span>
          </div>
        </div>
      </div>
    </div>
  </section>`
}
