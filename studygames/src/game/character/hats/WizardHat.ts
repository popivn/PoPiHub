import type { Hat } from './Hat';
import { el } from './Hat';

// A wizard hat: tall cone with a brim and a star buckle.
export class WizardHat implements Hat {
  readonly id = 'wizard';
  readonly label = 'Wizard';
  readonly el: HTMLElement;

  constructor() {
    const root = el('hat hat-wizard');
    const brim = el('hat-wizard-brim');
    const cone = el('hat-wizard-cone');
    const star = el('hat-wizard-star');
    cone.appendChild(star);
    root.appendChild(brim);
    root.appendChild(cone);
    this.el = root;
  }
}
