/**
 * OllamaService - Integration with local Ollama LLM server.
 *
 * Key Design Decisions:
 *  - generateFast()  → streaming, token-by-token callback, low latency for NPC chat
 *  - generateText()  → non-streaming, for background tasks (memory eval, reflection)
 *  - keep_alive: 30m → model stays loaded in RAM between requests
 */
export class OllamaService {
  constructor(options = {}) {
    this.baseUrl = process.env.OLLAMA_HOST || process.env.OLLAMA_URL || options.baseUrl || 'http://localhost:11434';
    this.defaultModel = options.defaultModel || 'qwen3:1.7b';
  }

  /**
   * Check if local Ollama service is running and list available models
   */
  async checkStatus() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        online: true,
        models: data.models ? data.models.map(m => m.name) : []
      };
    } catch (err) {
      return { online: false, error: err.message, models: [] };
    }
  }

  /**
   * 🚀 FAST Streaming generation for realtime NPC dialogue.
   * Calls onToken(chunk) as each token arrives, no waiting for full response.
   *
   * @param {string}   prompt
   * @param {string}   model
   * @param {string}   system
   * @param {function} onToken - Called with each text chunk as it streams
   * @returns {Promise<string>} - Full concatenated response text
   */
  async generateFast(prompt, model = this.defaultModel, system = '', onToken = null, forceJson = false) {
    const t0 = performance.now();

    try {
      const body = {
        model,
        prompt,
        system,
        stream: true,
        keep_alive: '60m',
        options: {
          temperature: 0.7,
          num_predict: 120,
          num_ctx: 1024,
          num_thread: 4,
          top_k: 20,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      };

      // format:'json' forces Ollama to guarantee valid JSON output regardless of model
      // Works with gemma3, llama3, qwen series — most reliable way for small models
      if (forceJson) body.format = 'json';

      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawText = '';          // All tokens including <think>...</think>
      let firstTokenTime = null;
      let buffer = '';

      // Collect full raw stream with proper line buffering
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const chunk = JSON.parse(line);
            if (chunk.response) {
              if (!firstTokenTime) {
                firstTokenTime = performance.now();
                console.log(`⚡ [FIRST TOKEN] ${(firstTokenTime - t0).toFixed(0)}ms`);
              }
              rawText += chunk.response;
            }
          } catch { /* skip malformed line */ }
        }
      }

      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer);
          if (chunk.response) rawText += chunk.response;
        } catch {}
      }

      // Strip <think>...</think> block — keep only the actual reply after </think>
      let replyText = rawText;
      const thinkEnd = rawText.lastIndexOf('</think>');
      if (thinkEnd !== -1) {
        replyText = rawText.slice(thinkEnd + '</think>'.length).trim();
      } else if (rawText.includes('<think>')) {
        // If <think> opened but never closed, strip everything inside <think>
        replyText = rawText.replace(/<think>[\s\S]*?$/g, '').trim();
      }

      const total = (performance.now() - t0).toFixed(0);
      console.log(`✅ [LLM DONE] ${total}ms | reply: ${replyText.length} chars`);
      return { success: true, text: replyText.trim(), model };

    } catch (err) {
      console.warn(`⚠️ [OLLAMA ERROR] ${err.message}`);
      return { success: false, text: '', error: err.message };
    }
  }

  /**
   * Non-streaming generation for background Brain tasks (memory, reflection, intent).
   * Slower but simpler — user does not wait for this.
   *
   * @param {string} prompt
   * @param {string} model
   * @param {string} system
   */
  async generateText(prompt, model = this.defaultModel, system = '') {
    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          system,
          stream: false,
          keep_alive: '30m',
          options: {
            temperature: 0.6,
            num_predict: 64,
            num_ctx: 512,
            top_k: 20,
            top_p: 0.9
          }
        })
      });

      if (!res.ok) throw new Error(`Ollama Error HTTP ${res.status}`);
      const data = await res.json();
      return { success: true, text: data.response, model: data.model };

    } catch (err) {
      console.warn(`⚠️ Ollama Generation Fallback (${err.message})`);
      return { success: false, text: '', error: err.message };
    }
  }

  /**
   * Chat conversation API with system role and message history (background use)
   */
  async chat(messages, model = this.defaultModel) {
    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: false, keep_alive: '30m' })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export default new OllamaService();
