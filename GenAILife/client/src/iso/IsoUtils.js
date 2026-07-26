// Isometric Math Helpers
export function toIso(x, y) {
  return {
    x: (x - y),
    y: (x + y) * 0.5
  };
}

export function fromIso(screenX, screenY) {
  return {
    x: 0.5 * screenX + screenY,
    y: screenY - 0.5 * screenX
  };
}

export function drawIsoTile(graphics, x, y, width, height, fillColor = 0x1e293b, strokeColor = 0x00f2fe, alpha = 1) {
  const halfW = width / 2;
  const halfH = height / 2;

  graphics.poly([
    x, y - halfH,          // Top vertex
    x + halfW, y,          // Right vertex
    x, y + halfH,          // Bottom vertex
    x - halfW, y           // Left vertex
  ]);

  if (fillColor !== undefined) {
    graphics.fill({ color: fillColor, alpha });
  }

  if (strokeColor !== undefined) {
    graphics.stroke({ width: 1.5, color: strokeColor, alpha });
  }
}
