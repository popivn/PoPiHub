/**
 * TaskModule - Injects a specific task instruction into the system and user prompt.
 *
 * ctx.task:
 *   string | { instruction: string, constraints: string[] }
 *
 * System output:
 *   TASK
 *   Reply naturally to the player's message in 1-2 sentences.
 *
 * User output:
 *   {{playerName}} said: "{{message}}"
 */
export const TaskModule = {
  system(ctx) {
    const task = ctx.task;
    if (!task) return '';

    if (typeof task === 'string') {
      return `TASK\n${task}`;
    }

    const lines = ['TASK'];
    if (task.instruction) lines.push(task.instruction);
    if (task.constraints?.length) {
      lines.push('\nConstraints:');
      task.constraints.forEach(c => lines.push(`- ${c}`));
    }
    return lines.join('\n');
  },
  user(ctx) {
    const msg = ctx.message;
    const sender = ctx.senderName || 'Player';
    if (!msg) return '';
    return `${sender} said to you: "${msg}"`;
  }
};
