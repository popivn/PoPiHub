import { portfolio, type Skill } from '../data/portfolio'

const levelConfig: Record<Skill['level'], { label: string; color: string; bar: string }> = {
  expert: { label: 'Expert', color: 'text-fuchsia-300', bar: 'from-fuchsia-500 to-pink-500' },
  advanced: { label: 'Advanced', color: 'text-orange-300', bar: 'from-orange-500 to-amber-500' },
  learning: { label: 'Learning', color: 'text-purple-300', bar: 'from-purple-500 to-indigo-500' },
}

export function renderSkills(): string {
  return `
  <section id="skills" class="relative py-24 px-6 bg-zinc-900">
    <div class="max-w-5xl mx-auto">
      <div class="mb-12 text-center">
        <h2 class="text-4xl md:text-5xl font-black text-white mb-3">My <span class="bg-gradient-to-r from-fuchsia-400 to-orange-400 bg-clip-text text-transparent">Skills</span></h2>
        <div class="w-20 h-1 bg-gradient-to-r from-fuchsia-500 to-orange-500 mx-auto rounded-full"></div>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        ${portfolio.skills.map((skill: Skill) => {
          const cfg = levelConfig[skill.level]
          return `
          <div class="group relative p-5 rounded-xl bg-white/5 border border-white/10 hover:border-fuchsia-500/40 hover:bg-white/8 transition-all">
            <div class="flex items-center justify-between mb-3">
              <span class="text-white font-bold text-lg">${skill.name}</span>
              <span class="text-xs font-bold uppercase tracking-wider ${cfg.color}">${cfg.label}</span>
            </div>
            <div class="h-2 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r ${cfg.bar} ${skill.level === 'expert' ? 'w-full' : skill.level === 'advanced' ? 'w-3/4' : 'w-1/2'} group-hover:w-full transition-all duration-500"></div>
            </div>
          </div>`
        }).join('')}
      </div>
    </div>
  </section>`
}
