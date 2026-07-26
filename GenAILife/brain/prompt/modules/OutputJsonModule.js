/**
 * OutputJsonModule - Instructs the LLM to return a structured JSON response.
 *
 * ctx.outputSchema: object describing the expected JSON shape
 *
 * Outputs:
 *   OUTPUT FORMAT
 *   Return ONLY valid JSON matching this schema:
 *   { "reply": "string" }
 *
 * Also exposes a static parse() helper for safe JSON extraction.
 */
export const OutputJsonModule = {
  system(ctx) {
    const schema = ctx.outputSchema || { reply: 'string' };
    return `OUTPUT FORMAT\nReturn ONLY valid JSON. No markdown. No explanation.\nSchema:\n${JSON.stringify(schema, null, 2)}`;
  },
  user(_ctx) { return ''; },

  /**
   * Safely extract a JSON object from an LLM string response.
   * Handles cases where the model wraps with markdown code blocks.
   * @param {string} raw - Raw LLM response string
   * @returns {object|null}
   */
  parse(raw) {
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      // Try to extract JSON substring
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { return null; }
      }
      return null;
    }
  }
};
