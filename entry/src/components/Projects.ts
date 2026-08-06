import { portfolio, type Project, type ProjectCategory } from '../data/portfolio'

const categoryConfig: Record<ProjectCategory, { label: string; icon: string; accent: string }> = {
  school: { label: 'School Projects', icon: 'fa-solid fa-graduation-cap', accent: 'from-blue-500 to-cyan-500' },
  work: { label: 'Work Projects', icon: 'fa-solid fa-briefcase', accent: 'from-fuchsia-500 to-orange-500' },
  personal: { label: 'Personal Projects', icon: 'fa-solid fa-user-astronaut', accent: 'from-purple-500 to-pink-500' },
}

function renderProjectCard(p: Project): string {
  return `
  <div class="group relative rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/10 hover:border-fuchsia-500/50 transition-all duration-300 overflow-hidden ${p.highlight ? 'ring-1 ring-fuchsia-500/20' : ''}">
    ${p.highlight ? '<div class="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-fuchsia-600 to-orange-500 text-white text-xs font-bold rounded-bl-xl"><i class="fa-solid fa-star mr-1"></i>HIGHLIGHT</div>' : ''}

    <div class="p-6">
      <div class="flex items-start justify-between mb-3">
        <h3 class="text-xl font-bold text-white group-hover:text-fuchsia-300 transition">${p.title}</h3>
      </div>
      <p class="text-gray-400 text-sm leading-relaxed mb-4 min-h-[80px]">${p.description}</p>

      <div class="flex flex-wrap gap-2 mb-4">
        ${p.tech.map(t => `<span class="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 text-xs font-medium">${t}</span>`).join('')}
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-white/10">
        <span class="text-gray-500 text-xs font-medium">${p.date}</span>
        ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener" class="flex items-center gap-1.5 text-fuchsia-400 hover:text-fuchsia-300 text-sm font-bold transition group-hover:gap-2.5">
          Visit
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
        </a>` : ''}
      </div>
    </div>
  </div>`
}

export function renderProjects(): string {
  const categories: ProjectCategory[] = ['school', 'work', 'personal']

  return `
  <section id="projects" class="relative py-24 px-6 bg-gradient-to-b from-zinc-900 to-black">
    <div class="max-w-6xl mx-auto">
      <div class="mb-12 text-center">
        <h2 class="text-4xl md:text-5xl font-black text-white mb-3">Featured <span class="bg-gradient-to-r from-fuchsia-400 to-orange-400 bg-clip-text text-transparent">Projects</span></h2>
        <div class="w-20 h-1 bg-gradient-to-r from-fuchsia-500 to-orange-500 mx-auto rounded-full"></div>
        <p class="text-gray-400 mt-4 max-w-2xl mx-auto">A mix of professional work, freelance projects, and personal builds</p>
      </div>

      ${categories.map(cat => {
        const cfg = categoryConfig[cat]
        const projects = portfolio.projects.filter((p: Project) => p.category === cat)
        if (projects.length === 0) return ''

        return `
        <div class="mb-16">
          <div class="flex items-center gap-3 mb-6">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r ${cfg.accent}">
              <i class="${cfg.icon} text-white text-lg"></i>
            </div>
            <h3 class="text-2xl font-bold text-white">${cfg.label}</h3>
            <span class="text-gray-500 text-sm font-medium">(${projects.length})</span>
            <div class="flex-1 h-px bg-white/10 ml-2"></div>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${projects.map(renderProjectCard).join('')}
          </div>
        </div>`
      }).join('')}
    </div>
  </section>`
}
