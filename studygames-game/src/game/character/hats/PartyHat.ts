import type { Hat } from './Hat';
import { el } from './Hat';

// A simple golden party cone with a pom-pom and stripe.
export class PartyHat implements Hat {
  readonly id = 'party';
  readonly label = 'Party';
  readonly el: HTMLElement;

  constructor() {
    const root = el('hat hat-party');
    const stripe = el('hat-party-stripe');
    const pom = el('hat-party-pom');
    root.appendChild(stripe);
    root.appendChild(pom);
    this.el = root;
  }
}
