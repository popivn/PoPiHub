import { portfolio, type TimelineItem } from '../data/portfolio'

export function renderTimeline(): string {
  return `
  <section id="timeline" class="relative py-24 px-6 bg-black">
    <div class="max-w-4xl mx-auto">
      <div class="mb-12 text-center">
        <h2 class="text-4xl md:text-5xl font-black text-white mb-3">My <span class="bg-gradient-to-r from-fuchsia-400 to-orange-400 bg-clip-text text-transparent">Journey</span></h2>
        <div class="w-20 h-1 bg-gradient-to-r from-fuchsia-500 to-orange-500 mx-auto rounded-full"></div>
      </div>

      <div class="relative">
        <div class="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-fuchsia-500 via-orange-500 to-transparent md:-translate-x-1/2"></div>

        ${portfolio.timeline.map((item: TimelineItem, i: number) => `
          <div class="relative mb-12 ${i % 2 === 0 ? 'md:pr-1/2' : 'md:pl-1/2'} pl-12 md:pl-0">
            <div class="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-500 ring-4 ring-black md:-translate-x-1/2"></div>
            <div class="${i % 2 === 0 ? 'md:text-right md:pr-12' : 'md:pl-12'}">
              <div class="inline-block px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-bold mb-2">${item.date}</div>
              <h3 class="text-xl font-bold text-white mb-2">${item.title}</h3>
              <p class="text-gray-400 text-sm leading-relaxed">${item.description}</p>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </section>`
}
