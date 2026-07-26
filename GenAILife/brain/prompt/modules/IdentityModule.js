/**
 * IdentityModule - Injects the NPC's full identity into the system prompt.
 * Identity is treated as a living being, not a service role.
 *
 * Outputs:
 *   You are GenAi1. Age: 23.
 *   Occupation: Wanderer & Explorer.
 *
 *   Personality:
 *   - Curious about the world...
 *
 *   Beliefs:
 *   - Existing is already meaningful...
 *
 *   Fears:
 *   - Being forgotten
 */
export const IdentityModule = {
  system(ctx) {
    const id = ctx.identity;
    if (!id) return '';

    const lines = [];

    const agePart = id.age ? `. Age: ${id.age}` : '';
    lines.push(`You are ${id.name}${agePart}.`);

    if (id.occupation) lines.push(`Occupation: ${id.occupation}.`);

    if (id.personality?.length) {
      lines.push(`\nPersonality:\n${id.personality.map(p => `- ${p}`).join('\n')}`);
    }
    if (id.beliefs?.length) {
      lines.push(`\nBeliefs:\n${id.beliefs.map(b => `- ${b}`).join('\n')}`);
    }
    if (id.skills?.length) {
      lines.push(`\nSkills:\n${id.skills.map(s => `- ${s}`).join('\n')}`);
    }
    if (id.goals?.length) {
      lines.push(`\nGoals:\n${id.goals.map(g => `- ${g}`).join('\n')}`);
    }
    if (id.fears?.length) {
      lines.push(`\nFears:\n${id.fears.map(f => `- ${f}`).join('\n')}`);
    }

    return lines.join('\n');
  },
  user(_ctx) { return ''; }
};
