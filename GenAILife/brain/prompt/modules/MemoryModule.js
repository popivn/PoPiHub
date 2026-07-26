/**
 * MemoryModule - Injects relevant memory facts into the system prompt.
 *
 * ctx.memories: string[] or { content: string }[]
 *
 * Outputs:
 *   RELEVANT MEMORY
 *   Bob gave you food yesterday.
 *   Tom stole your apple.
 */
export const MemoryModule = {
  system(ctx) {
    const memories = ctx.memories;
    if (!memories || memories.length === 0) return '';

    const lines = ['RELEVANT MEMORY'];
    for (const mem of memories.slice(0, 5)) {
      const summaryText = typeof mem === 'string' ? mem : (mem.summary || mem.content || '');
      if (summaryText) lines.push(`- ${summaryText}`);
    }
    return lines.join('\n');
  },
  user(_ctx) { return ''; }
};
