import { portfolio } from '../data/portfolio'

export function renderContact(): string {
  return `
  <section id="contact" class="relative py-24 px-6 bg-gradient-to-b from-black to-zinc-900">
    <div class="max-w-3xl mx-auto text-center">
      <div class="mb-12">
        <h2 class="text-4xl md:text-5xl font-black text-white mb-3">Get in <span class="bg-gradient-to-r from-fuchsia-400 to-orange-400 bg-clip-text text-transparent">Touch</span></h2>
        <div class="w-20 h-1 bg-gradient-to-r from-fuchsia-500 to-orange-500 mx-auto rounded-full"></div>
        <p class="text-gray-400 mt-4">Have a project in mind? Let's build something great together.</p>
      </div>

      <a href="mailto:${portfolio.email}" class="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white font-bold text-lg hover:scale-105 hover:shadow-xl hover:shadow-fuchsia-500/40 transition-all mb-10">
        <i class="fa-solid fa-envelope"></i>
        ${portfolio.email}
      </a>

      <div class="flex flex-wrap items-center justify-center gap-4 mt-8">
        ${portfolio.socials.map(s => `
          <a href="${s.url}" target="_blank" rel="noopener" class="group flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-fuchsia-500/40 hover:bg-white/8 transition-all">
            <i class="${s.icon} text-gray-400 group-hover:text-fuchsia-400 transition"></i>
            <span class="text-gray-300 group-hover:text-white font-medium text-sm">${s.label}</span>
          </a>`).join('')}
      </div>
    </div>
  </section>`
}
