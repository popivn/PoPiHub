// A hat is a self-contained HTML/CSS asset. Each hat builds its own DOM
// (no images) and exposes a single root element to mount onto the slime.
export interface Hat {
  readonly id: string;
  readonly label: string;
  readonly el: HTMLElement;
}

// Tiny helper for creating a styled div with classes.
export function el(className: string): HTMLElement {
  const d = document.createElement('div');
  d.className = className;
  return d;
}
