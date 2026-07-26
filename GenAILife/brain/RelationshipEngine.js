/**
 * RelationshipEngine.js
 *
 * Pure Reasoning-Based Generative Agent Social Reflection Engine.
 *
 * Flow:
 *  Accumulated Memories -> Inner Reflection Narrative -> Numeric Score Conversion -> Reasons & Changes
 *
 * Zero hardcoded rules (no "if hate then trust--").
 * The LLM acts as an autonomous individual reflecting naturally on experiences.
 */

export class RelationshipEngine {
  /**
   * @param {object} ollamaService - OllamaService instance
   */
  constructor(ollamaService) {
    this.ollama = ollamaService;
    this.reflectionModel = 'gemma3:1b'; // default reflection model
  }

  /**
   * 🧠 Generative Reflection: Reflect over accumulated memory timeline.
   *
   * @param {object} params
   * @param {string} params.agentName         - Self name (e.g. 'GenAi1')
   * @param {string} params.targetName        - Target entity name (e.g. 'Cyber Knight')
   * @param {object} [params.identity]        - Identity JSON
   * @param {object} [params.currentRel]      - Existing relationship row from DB
   * @param {array}  [params.memories]        - Accumulated episodic memories with target
   * @param {string} [params.currentMessage]  - Most recent message
   *
   * @returns {Promise<{ reflection: string, relationship: object, reasons: string[], changes: object[] }>}
   */
  async evaluate({ agentName = 'GenAi1', targetName, identity = {}, currentRel = null, memories = [], currentMessage = '' }) {
    const model = identity.reflectionModel || identity.model || this.reflectionModel;

    const existingState = currentRel ? {
      trust: currentRel.trust ?? 0.5,
      friendship: currentRel.friendship ?? 0.5,
      respect: currentRel.respect ?? 0.5,
      fear: currentRel.fear ?? 0.0,
      gratitude: currentRel.gratitude ?? 0.0,
      curiosity: currentRel.curiosity ?? 0.5,
      anger: currentRel.hatred ?? 0.0,
      reasons: currentRel.reasons || [],
      reflection: currentRel.reflection || ''
    } : {
      trust: 0.5, friendship: 0.5, respect: 0.5, fear: 0.0, gratitude: 0.0, curiosity: 0.5, anger: 0.0, reasons: [], reflection: ''
    };

    // Format accumulated memory timeline
    const memoryTimeline = memories.length > 0
      ? memories.map((m, i) => `${i + 1}. [${m.type || 'dialogue'}] ${m.summary}`).join('\n')
      : (currentMessage ? `- Latest interaction: ${targetName} said "${currentMessage}"` : '- Initial encounter, no prior history.');

    const systemPrompt = `You are the Social Relationship Radar Engine for AI Agent "${agentName}".
Evaluate numeric relationship metrics with "${targetName}" based on your memory timeline.

Current Baseline:
Trust: ${existingState.trust}, Friendship: ${existingState.friendship}, Respect: ${existingState.respect}, Fear: ${existingState.fear}, Curiosity: ${existingState.curiosity}, Anger: ${existingState.anger}

Memories:
${memoryTimeline}

INSTRUCTIONS:
1. Output ONLY valid JSON with numeric floats between 0.0 and 1.0.
2. Do NOT output any text reasons, explanations, or sentences. Output JSON ONLY.

JSON SCHEMA:
{
  "relationship": {
    "trust": 0.65,
    "friendship": 0.60,
    "respect": 0.55,
    "fear": 0.0,
    "gratitude": 0.30,
    "curiosity": 0.75,
    "anger": 0.0
  }
}`;

    const userPrompt = `Evaluate relationship metrics with ${targetName} based on memories and return updated numeric scores in JSON.`;

    try {
      const t0 = performance.now();
      // Pass forceJson = false to prevent Ollama format:json loop on qwen3
      const res = await this.ollama.generateFast(userPrompt, model, systemPrompt, null, false);
      const elapsed = (performance.now() - t0).toFixed(0);

      let parsed = this._parseJson(res.text);

      let relData = (parsed && parsed.relationship) ? parsed.relationship : (parsed && typeof parsed.trust === 'number' ? parsed : null);

      // Regex fallback if LLM outputted text containing key: float values
      if (!relData && res.text) {
        const extractField = (name, def) => {
          const m = res.text.match(new RegExp(`"${name}"\\s*:\\s*([0-9\\.]+)`)) || res.text.match(new RegExp(`${name}\\s*:\\s*([0-9\\.]+)`, 'i'));
          return m ? parseFloat(m[1]) : def;
        };
        relData = {
          trust: extractField('trust', existingState.trust),
          friendship: extractField('friendship', existingState.friendship),
          respect: extractField('respect', existingState.respect),
          fear: extractField('fear', existingState.fear),
          gratitude: extractField('gratitude', existingState.gratitude),
          curiosity: extractField('curiosity', existingState.curiosity),
          anger: extractField('anger', existingState.anger)
        };
      }

      if (relData && typeof relData.trust === 'number') {
        console.log(`🧠 [NUMERIC RADAR REFLECTION SUCCESS] (${elapsed}ms) Evaluated ${targetName}: Trust=${relData.trust}, Friendship=${relData.friendship}, Respect=${relData.respect}`);
        return {
          relationship: relData,
          reasons: [],
          reflection: ''
        };
      } else {
        console.warn(`⚠️ [RELATIONSHIP ENGINE JSON PARSE FAILED] Raw text: "${(res.text || '').slice(0, 150)}..."`);
      }
    } catch (err) {
      console.warn('⚠️ [RELATIONSHIP ENGINE ERROR]', err.message);
    }

    return {
      relationship: existingState,
      reasons: [],
      reflection: '',
      changes: []
    };
  }

  _parseJson(raw) {
    if (!raw) return null;
    try {
      // Strip markdown code fences
      let cleaned = raw.replace(/```json|```/g, '').trim();
      // Remove any think tags
      const thinkEnd = cleaned.lastIndexOf('</think>');
      if (thinkEnd !== -1) {
        cleaned = cleaned.slice(thinkEnd + 8).trim();
      }
      return JSON.parse(cleaned);
    } catch {
      // Try regex matching outer braces
      const match = raw.match(/\{[\s\S]*?\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return null;
        }
      }
      return null;
    }
  }
}
