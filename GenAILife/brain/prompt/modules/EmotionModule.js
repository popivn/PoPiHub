/**
 * EmotionModule - Injects emotion state and behavioral modifiers.
 *
 * ctx.emotion shape:
 *   { current: "Happy", intensity: 0.7, recent: ["Surprised", "Curious"] }
 *
 * Outputs:
 *   EMOTIONAL STATE
 *   Current Emotion: Happy (intensity: 0.7)
 *   Recent Emotions: Surprised, Curious
 */
export const EmotionModule = {
  system(ctx) {
    const emotion = ctx.emotion;
    if (!emotion) return '';

    const lines = ['EMOTIONAL STATE'];
    if (emotion.current) {
      const intensity = emotion.intensity !== undefined ? ` (intensity: ${emotion.intensity})` : '';
      lines.push(`Current Emotion: ${emotion.current}${intensity}`);
    }
    if (emotion.recent?.length) {
      lines.push(`Recent Emotions: ${emotion.recent.join(', ')}`);
    }
    if (emotion.trigger) {
      lines.push(`Trigger: ${emotion.trigger}`);
    }
    return lines.join('\n');
  },
  user(_ctx) { return ''; }
};
