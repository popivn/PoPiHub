/**
 * DialogueBrain - NPC Dialogue with single LLM call returning JSON.
 *
 * One call → { reply, emotion, save_memory }
 *
 * Model strategy:
 *  - dialogueModel (fast): gemma3:1b / qwen2.5:0.5b  → for chat (<1s target)
 *  - reflectionModel (slow): qwen3:1.7b+              → for reflection (background)
 */

import { PromptBuilder } from './prompt/builder/PromptBuilder.js';
import { IdentityModule } from './prompt/modules/IdentityModule.js';
import { StateModule } from './prompt/modules/StateModule.js';
import { MemoryModule } from './prompt/modules/MemoryModule.js';
import { EmotionModule } from './prompt/modules/EmotionModule.js';
import { TemplateEngine } from './prompt/renderer/TemplateEngine.js';

// JSON schema GenAi1 must return on every dialogue call
const DIALOGUE_OUTPUT_SCHEMA = {
  reply: "Trái lời câu chát của người chơi bằng tiếng Việt (1-2 câu ngắn gọn)",
  emotion: "calm",
  save_memory: false
};

export class DialogueBrain {
  /**
   * @param {object} identity       - Identity JSON (brain/identity/*.json)
   * @param {object} ollamaService  - OllamaService instance
   */
  constructor(identity, ollamaService) {
    this.identity  = identity;
    this.ollama    = ollamaService;
    // Dialogue: use fast model from identity, fallback to gemma3:1b
    this.dialogueModel    = identity.dialogueModel    || identity.model || 'gemma3:1b';
    // Reflection: use model from identity, fallback to gemma3:1b
    this.reflectionModel  = identity.reflectionModel  || identity.model || 'gemma3:1b';
    this.dialogueRules    = TemplateEngine.load('dialogue/npc.system');
  }

  /**
   * Build layered system prompt from identity + context.
   */
  _buildSystem(ctx) {
    const relBaseline = ctx.existingRel ? {
      trust: ctx.existingRel.trust ?? 0.5,
      friendship: ctx.existingRel.friendship ?? 0.5,
      respect: ctx.existingRel.respect ?? 0.5,
      curiosity: ctx.existingRel.curiosity ?? 0.5,
      anger: ctx.existingRel.hatred ?? 0.0
    } : { trust: 0.5, friendship: 0.5, respect: 0.5, curiosity: 0.5, anger: 0.0 };

    ctx.identity = this.identity;

    const builder = new PromptBuilder()
      .use({
        system: () => this.dialogueRules || ''
      }, ctx)
      .use(IdentityModule, ctx);

    if (ctx.memories && ctx.memories.length > 0) {
      builder.use(MemoryModule, ctx);
    }

    builder.use({
      system: () => `OUTPUT FORMAT
Return ONLY a valid JSON object matching the schema below. Do not wrap response in markdown code blocks. Do not write explanation.

Output Schema:
{
  "reply": "Your character's dialogue response in Vietnamese. (1-2 sentences)",
  "emotion": "A string describing your emotion (e.g. calm, angry, scared, friendly, surprised, sad)",
  "relationship": {
    "trust": ${relBaseline.trust},
    "friendship": ${relBaseline.friendship},
    "respect": ${relBaseline.respect},
    "curiosity": ${relBaseline.curiosity},
    "anger": ${relBaseline.anger}
  }
}`
    }, ctx);

    const { system } = builder.build();
    return system;
  }

  /**
   * 🚀 Single Unified LLM call → Chat Reply + Emotion + Relationship Metrics!
   *
   * @param {object} ctx
   * @param {string}   ctx.senderName   - Player name
   * @param {string}   ctx.message      - Player message
   * @param {object}   [ctx.existingRel]- Current relationship state
   * @param {string[]} [ctx.memories]   - Relevant memory strings
   * @param {object}   [ctx.state]
   * @param {object}   [ctx.emotion]
   *
   * @returns {Promise<{ reply: string, emotion: string, save_memory: boolean, relationship: object }>}
   */
  async reply(ctx) {
    const tBuild = performance.now();
    const system = this._buildSystem(ctx);
    const user   = `${ctx.senderName} said to you: "${ctx.message}"`;

    console.log(`📐 [PROMPT BUILD] ${(performance.now() - tBuild).toFixed(1)}ms | system: ${system.length} chars | user: ${user.length} chars`);

    // Single fast LLM call for both reply and relationship evaluation
    const result = await this.ollama.generateFast(user, this.dialogueModel, system, null, true);
    const raw    = result.text || '';

    console.log(`🔍 [UNIFIED LLM OUTPUT] length=${raw.length} text="${raw.slice(0, 120)}..."`);

    // 1. Try parsing full JSON response
    const parsed = this._parseJson(raw);
    const defaultRel = ctx.existingRel || { trust: 0.5, friendship: 0.5, respect: 0.5, fear: 0.0, gratitude: 0.0, curiosity: 0.5, anger: 0.0 };

    if (parsed && parsed.reply && parsed.reply !== '...' && parsed.reply.length > 1) {
      const cleanReply = this._cleanReplyText(parsed.reply);
      if (cleanReply && !cleanReply.includes('Viết câu trả lời')) {
        return {
          reply:       cleanReply,
          emotion:     parsed.emotion     || 'calm',
          save_memory: parsed.save_memory ?? false,
          relationship: parsed.relationship || defaultRel
        };
      }
    }

    // 2. Try regex extracting "reply": "..." if JSON was partial/malformed
    const matchReply = raw.match(/"reply"\s*:\s*"([^"]+)"/);
    if (matchReply && matchReply[1] && matchReply[1] !== '...' && !matchReply[1].includes('Viết câu trả lời')) {
      return {
        reply: this._cleanReplyText(matchReply[1]),
        emotion: 'calm',
        save_memory: false,
        relationship: defaultRel
      };
    }

    // 3. Fallback: treat clean raw text as reply if it's natural text
    const cleanText = this._cleanReplyText(raw);
    if (cleanText && cleanText.length > 1 && !cleanText.includes('Viết câu trả lời')) {
      return {
        reply: cleanText,
        emotion: 'calm',
        save_memory: false,
        relationship: defaultRel
      };
    }

    console.warn(`⚠️ [BRAIN] JSON parse failed or empty, using friendly fallback reply`);
    return {
      reply: `Tôi vẫn nhớ chứ ${ctx.senderName}! Rất vui vì bạn lại trò chuyện cùng tôi.`,
      emotion: 'happy',
      save_memory: false,
      relationship: defaultRel
    };
  }

  /**
   * Remove LLM metadata artifacts (emotion:, save_memory:, quotes) from reply string.
   */
  _cleanReplyText(text) {
    if (!text) return '';
    let cleaned = String(text)
      .replace(/```json|```/g, '')
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/Viết câu trả lời trực tiếp của bạn bằng tiếng Việt vào đây/g, '')
      .replace(/emotion\s*:\s*\w+/gi, '')
      .replace(/save_memory\s*:\s*\w+/gi, '')
      .replace(/"reply"\s*:\s*/gi, '')
      .replace(/"emotion"\s*:\s*"[^"]*"/gi, '')
      .replace(/"save_memory"\s*:\s*(true|false)/gi, '')
      .replace(/[\{\}\[\]]/g, '')
      .trim();

    // Strip leading and trailing quotes
    while (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length > 1) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    return cleaned;
  }

  /**
   * Safely extract JSON from LLM response (handles markdown code blocks).
   */
  _parseJson(raw) {
    try {
      // Strip markdown fences if present
      const cleaned = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      // Try to extract first JSON object substring
      const match = raw.match(/\{[\s\S]*?\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch { return null; }
      }
      return null;
    }
  }
}
