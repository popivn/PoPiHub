import type { Hat } from './Hat';
import { PartyHat } from './PartyHat';
import { CrownHat } from './CrownHat';
import { WizardHat } from './WizardHat';

export { type Hat };
export { PartyHat } from './PartyHat';
export { CrownHat } from './CrownHat';
export { WizardHat } from './WizardHat';

// Registry of all available hats, in selector order.
export const HAT_FACTORIES: { id: string; label: string; create: () => Hat }[] = [
  { id: 'none', label: 'None', create: () => new NoHat() },
  { id: 'party', label: 'Party', create: () => new PartyHat() },
  { id: 'crown', label: 'Crown', create: () => new CrownHat() },
  { id: 'wizard', label: 'Wizard', create: () => new WizardHat() },
];

// "No hat" sentinel so the selector always has a clear-state option.
class NoHat implements Hat {
  readonly id = 'none';
  readonly label = 'None';
  readonly el = document.createElement('div');
}
