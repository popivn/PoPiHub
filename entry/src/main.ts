import './style.css'
import { renderNavbar } from './components/Navbar.ts'
import { renderHero } from './components/Hero.ts'
import { renderAbout } from './components/About.ts'
import { renderSkills } from './components/Skills.ts'
import { renderProjects } from './components/Projects.ts'
import { renderTimeline } from './components/Timeline.ts'
import { renderContact } from './components/Contact.ts'
import { renderFooter } from './components/Footer.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  ${renderNavbar()}
  <main>
    ${renderHero()}
    ${renderAbout()}
    ${renderSkills()}
    ${renderProjects()}
    ${renderTimeline()}
    ${renderContact()}
  </main>
  ${renderFooter()}
`
