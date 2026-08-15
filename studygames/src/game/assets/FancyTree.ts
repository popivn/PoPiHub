/**
 * FancyTree — builds an animated SVG tree with swaying branches and falling leaves.
 * Returns an HTMLElement ready to be placed in the isometric world.
 *
 * The SVG is cropped to the tree content (viewBox 195 80 300 330) and rendered
 * at a fixed pixel size. The tree's base (trunk root) sits at the bottom-center
 * of the element so it aligns with the tile center.
 */

const SVG_CONTENT = `
  <svg width="120" height="132" viewBox="195 80 300 330" xmlns="http://www.w3.org/2000/svg" class="fancy-tree-svg" overflow="visible" style="overflow: visible">
    <!-- shadow under trunk -->
    <ellipse cx="340" cy="405" rx="120" ry="12" fill="#3E2C1E" opacity="0.12"/>

    <g class="fancy-tree-sway">
      <!-- trunk -->
      <path d="M305 400 C 300 385 308 375 306 360 C 304 330 315 300 324 265 C 328 235 327 210 332 190 L 348 190 C 353 210 352 235 356 265 C 365 300 376 330 374 360 C 372 375 380 385 375 400 C 365 393 355 397 340 397 C 325 397 315 393 305 400 Z" fill="#5B3A24"/>
      <!-- wood grain -->
      <path d="M312 398 C 310 360 316 320 322 285" stroke="#43291A" stroke-width="2.5" fill="none" opacity="0.55"/>
      <path d="M340 398 C 339 350 337 320 336 290" stroke="#43291A" stroke-width="2" fill="none" opacity="0.5"/>
      <path d="M368 398 C 370 360 364 320 358 285" stroke="#43291A" stroke-width="2.5" fill="none" opacity="0.55"/>

      <!-- branches -->
      <path d="M330 260 C 295 245 265 240 235 250" stroke="#5B3A24" stroke-width="11" fill="none" stroke-linecap="round" class="fancy-tree-branch"/>
      <path d="M350 240 C 390 220 420 215 455 225" stroke="#5B3A24" stroke-width="11" fill="none" stroke-linecap="round" class="fancy-tree-branch"/>
      <path d="M336 195 C 318 175 308 160 298 140" stroke="#5B3A24" stroke-width="7" fill="none" stroke-linecap="round" class="fancy-tree-branch"/>
      <path d="M344 195 C 362 175 377 160 390 140" stroke="#5B3A24" stroke-width="7" fill="none" stroke-linecap="round" class="fancy-tree-branch"/>

      <!-- left foliage -->
      <g class="fancy-tree-branch" style="transform-origin:340px 260px;">
        <circle cx="230" cy="240" r="52" fill="#3B6D11"/>
        <circle cx="200" cy="215" r="42" fill="#639922"/>
        <circle cx="260" cy="205" r="46" fill="#4B7D18"/>
        <circle cx="210" cy="260" r="38" fill="#639922"/>
      </g>
      <!-- right foliage -->
      <g class="fancy-tree-branch" style="transform-origin:340px 235px;">
        <circle cx="455" cy="220" r="54" fill="#3B6D11"/>
        <circle cx="480" cy="245" r="40" fill="#639922"/>
        <circle cx="425" cy="195" r="44" fill="#4B7D18"/>
        <circle cx="470" cy="190" r="36" fill="#639922"/>
      </g>
      <!-- crown -->
      <circle cx="340" cy="150" r="62" fill="#3B6D11"/>
      <circle cx="295" cy="130" r="50" fill="#4B7D18"/>
      <circle cx="385" cy="125" r="52" fill="#639922"/>
      <circle cx="340" cy="95" r="48" fill="#4B7D18"/>
      <circle cx="300" cy="175" r="40" fill="#639922"/>
      <circle cx="385" cy="175" r="42" fill="#3B6D11"/>
      <circle cx="345" cy="160" r="46" fill="#97C459"/>
      <!-- shadow dots -->
      <circle cx="270" cy="150" r="4" fill="#27500A" opacity="0.5"/>
      <circle cx="410" cy="160" r="4" fill="#27500A" opacity="0.5"/>
      <circle cx="330" cy="110" r="4" fill="#27500A" opacity="0.5"/>
    </g>
  </svg>
`;

interface LeafConfig {
  left: number;
  dx: string;
  rot: string;
  duration: string;
  delay: string;
  color: string;
  size: number;
}

const LEAVES: LeafConfig[] = [
  { left: 30, dx: '50px', rot: '200deg', duration: '6.5s', delay: '0s', color: '#BA7517', size: 14 },
  { left: 50, dx: '-35px', rot: '-160deg', duration: '7.2s', delay: '1.2s', color: '#EF9F27', size: 12 },
  { left: 65, dx: '42px', rot: '180deg', duration: '5.8s', delay: '2.4s', color: '#639922', size: 13 },
  { left: 75, dx: '-25px', rot: '-200deg', duration: '6.9s', delay: '0.6s', color: '#BA7517', size: 11 },
  { left: 40, dx: '30px', rot: '150deg', duration: '8s', delay: '3s', color: '#97C459', size: 13 },
  { left: 82, dx: '-38px', rot: '-170deg', duration: '6.2s', delay: '1.8s', color: '#EF9F27', size: 12 },
  { left: 58, dx: '18px', rot: '190deg', duration: '7.5s', delay: '4s', color: '#BA7517', size: 14 },
  { left: 25, dx: '48px', rot: '-190deg', duration: '6.7s', delay: '2.9s', color: '#639922', size: 11 },
];

export function createFancyTreeEl(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'fancy-tree-wrap';
  wrap.innerHTML = SVG_CONTENT;

  // Falling leaves — positioned relative to the tree wrapper.
  for (const cfg of LEAVES) {
    const leaf = document.createElement('div');
    leaf.className = 'fancy-tree-leaf';
    leaf.style.left = `${cfg.left}px`;
    leaf.style.setProperty('--dx', cfg.dx);
    leaf.style.setProperty('--rot', cfg.rot);
    leaf.style.animationDuration = cfg.duration;
    leaf.style.animationDelay = cfg.delay;
    leaf.innerHTML = `<svg width="${cfg.size}" height="${cfg.size}" viewBox="0 0 16 16"><path d="M8 0 C13 3 13 11 8 16 C3 11 3 3 8 0 Z" fill="${cfg.color}"/></svg>`;
    wrap.appendChild(leaf);
  }

  return wrap;
}
