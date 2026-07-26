/**
 * Ollama LLM Connection & Configuration
 */
export const OllamaConfig = Object.freeze({
  baseUrl: 'http://localhost:11434',
  defaultModel: 'llama3:latest',
  temperature: 0.7,
  maxTokens: 512
});

export class OllamaClient {
  constructor(config = OllamaConfig) {
    this.config = config;
  }

  async generatePrompt(prompt) {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.defaultModel,
          prompt: prompt,
          stream: false
        })
      });
      return await response.json();
    } catch (err) {
      console.warn('⚠️ Ollama server unreachable on http://localhost:11434');
      return { response: '[Offline Fallback Prompt Response]' };
    }
  }
}
