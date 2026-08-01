import './style.css'
import { AraController } from './modal/Character/Ara'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div id="kiem-hiep-scene">
  <div class="kh-moon"></div>
  <div class="kh-stars"></div>
  <div class="kh-mountains">
    <svg viewBox="0 0 1200 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,300 L0,180 L100,120 L200,160 L300,80 L400,140 L500,60 L600,130 L700,90 L800,150 L900,70 L1000,130 L1100,100 L1200,160 L1200,300 Z" fill="#1a1a3e" opacity="0.6"/>
      <path d="M0,300 L0,220 L150,160 L280,200 L400,140 L520,190 L640,150 L780,200 L900,160 L1050,190 L1200,170 L1200,300 Z" fill="#0d0d2a" opacity="0.8"/>
    </svg>
  </div>
  <div class="kh-clouds">
    <div class="kh-cloud kh-cloud-1"></div>
    <div class="kh-cloud kh-cloud-2"></div>
    <div class="kh-cloud kh-cloud-3"></div>
  </div>
  <div class="kh-ground"></div>

  <div class="kh-platform">
    <div class="kh-platform-ring"></div>
    <div class="kh-platform-glyph">Tiên</div>
  </div>

  <div id="ara-container"></div>

  <div class="kh-title">
    <h1>Tu Tiên Giới</h1>
    <p>Hành Trình Tu Luyện</p>
  </div>

  <button id="openAra" class="kh-open-modal-btn">Xem Nhân Vật</button>
</div>
`

// Mount Ara character
const ara = new AraController()
ara.mount(document.querySelector<HTMLDivElement>('#ara-container')!)

// Open modal button
document.querySelector<HTMLButtonElement>('#openAra')!.addEventListener('click', () => {
  alert('Modal Ara - coming soon')
})
