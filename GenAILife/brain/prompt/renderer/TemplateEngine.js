/**
 * TemplateEngine - Renders prompt templates with variable substitution.
 * Supports {{ variable }} or {{ nested.object }} syntax.
 *
 * Usage:
 *   const result = TemplateEngine.render("Hello {{name}}", { name: "Alice" });
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.join(__dirname, '../templates');

export class TemplateEngine {
  /**
   * Load a prompt template file from disk.
   * @param {string} templatePath - e.g. "dialogue/npc.system"
   * @returns {string} Raw template string
   */
  static load(templatePath) {
    const filePath = path.join(TEMPLATES_ROOT, `${templatePath}.txt`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`[TemplateEngine] Prompt template not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Render a template string with variable substitution.
   * Supports {{ variable }} and {{ nested.key }} syntax.
   * @param {string} template - Raw template string
   * @param {object} vars - Variables to inject
   * @returns {string} Rendered prompt string
   */
  static render(template, vars = {}) {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
      const keys = key.split('.');
      let val = vars;
      for (const k of keys) {
        val = val?.[k];
      }
      if (val === undefined || val === null) return match;
      if (Array.isArray(val)) return val.map(v => `- ${v}`).join('\n');
      if (typeof val === 'object') return JSON.stringify(val, null, 2);
      return String(val);
    });
  }

  /**
   * Load and render a template in one step.
   * @param {string} templatePath - e.g. "dialogue/npc.system"
   * @param {object} vars - Variables to inject
   * @returns {string}
   */
  static loadAndRender(templatePath, vars = {}) {
    const template = this.load(templatePath);
    return this.render(template, vars);
  }
}
