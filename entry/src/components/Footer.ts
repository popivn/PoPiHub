import { portfolio } from '../data/portfolio'

export function renderFooter(): string {
  const year = new Date().getFullYear()
  return `
  <footer class="py-10 px-6 bg-black border-t border-white/10">
    <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <img src="${portfolio.logo}" alt="PoPi" class="w-8 h-8 rounded-full" />
        <span class="text-gray-400 text-sm">© ${year} ${portfolio.fullName}. All rights reserved.</span>
      </div>
      <div class="flex items-center gap-6">
        ${portfolio.socials.map(s => `<a href="${s.url}" target="_blank" rel="noopener" class="flex items-center gap-1.5 text-gray-500 hover:text-fuchsia-400 text-sm transition"><i class="${s.icon}"></i>${s.label}</a>`).join('')}
      </div>
    </div>
  </footer>`
}
