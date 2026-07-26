/**
 * StateModule - Injects the NPC's current state into the system prompt.
 *
 * ctx.state shape:
 *   { hunger: 0.8, energy: 0.2, location: "Farm", emotion: "Worried" }
 *
 * Outputs:
 *   CURRENT STATE
 *   Hunger: 0.8
 *   Energy: 0.2
 *   Location: Farm
 *   Emotion: Worried
 */
export const StateModule = {
  system(ctx) {
    const state = ctx.state;
    if (!state || Object.keys(state).length === 0) return '';

    const lines = ['CURRENT STATE'];
    for (const [key, val] of Object.entries(state)) {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      lines.push(`${label}: ${val}`);
    }
    return lines.join('\n');
  },
  user(_ctx) { return ''; }
};
