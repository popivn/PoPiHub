/**
 * PromptBuilder - Fluent builder pattern for composing structured prompts.
 *
 * Each module adds a labeled section to the final prompt:
 * Identity → State → Memory → Task → Output Format
 *
 * Usage:
 *   const { system, user } = new PromptBuilder()
 *     .use(identityModule)
 *     .use(memoryModule)
 *     .use(taskModule)
 *     .build();
 */

export class PromptBuilder {
  constructor() {
    this._systemSections = [];
    this._userSections = [];
  }

  /**
   * Register a module. Each module is an object with:
   * - system(context) → string (contributes to SYSTEM prompt)
   * - user(context)   → string (contributes to USER prompt)
   * Context is shared across all modules.
   *
   * @param {object} module - A module with system() and/or user() methods
   * @param {object} context - Context data passed to the module
   * @returns {PromptBuilder}
   */
  use(module, context = {}) {
    if (module.system) {
      const section = module.system(context);
      if (section) this._systemSections.push(section.trim());
    }
    if (module.user) {
      const section = module.user(context);
      if (section) this._userSections.push(section.trim());
    }
    return this;
  }

  /**
   * Build the final prompt object.
   * @returns {{ system: string, user: string }}
   */
  build() {
    return {
      system: this._systemSections.join('\n\n---\n\n'),
      user: this._userSections.join('\n\n')
    };
  }
}
