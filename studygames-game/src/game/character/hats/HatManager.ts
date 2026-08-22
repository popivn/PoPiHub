import type { Hat } from './Hat';
import { HAT_FACTORIES } from './index';

// Owns the currently equipped hat and mounts/unmounts it onto the slime's
// hat container. Switching is O(1) DOM: remove old element, append new one.
export class HatManager {
  private container: HTMLElement;
  private current: Hat | null = null;
  private currentId: string = 'none';

  constructor(container: HTMLElement) {
    this.container = container;
  }

  get equippedId(): string {
    return this.currentId;
  }

  equip(id: string): boolean {
    if (id === this.currentId) return true;
    const factory = HAT_FACTORIES.find((f) => f.id === id);
    if (!factory) return false;

    // Remove old hat element if any.
    if (this.current && this.current.el.parentElement === this.container) {
      this.container.removeChild(this.current.el);
    }

    this.current = factory.create();
    this.currentId = id;
    // NoHat has an empty element — skip appending so it renders nothing.
    if (id !== 'none') {
      this.container.appendChild(this.current.el);
    }
    return true;
  }

  clear() {
    this.equip('none');
  }
}
