import type { Hat } from './Hat';
import { el } from './Hat';

// A royal crown: gold band with jewel-tipped spikes.
export class CrownHat implements Hat {
  readonly id = 'crown';
  readonly label = 'Crown';
  readonly el: HTMLElement;

  constructor() {
    const root = el('hat hat-crown');
    const band = el('hat-crown-band');
    // Five spikes; middle one tallest.
    const spikes = el('hat-crown-spikes');
    const heights = [14, 20, 26, 20, 14];
    for (const h of heights) {
      const spike = el('hat-crown-spike');
      spike.style.height = `${h}px`;
      const jewel = el('hat-crown-jewel');
      spike.appendChild(jewel);
      spikes.appendChild(spike);
    }
    root.appendChild(spikes);
    root.appendChild(band);
    this.el = root;
  }
}
