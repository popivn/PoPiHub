/**
 * AgentBrainRepository
 *
 * Data access layer for all Agent Brain tables.
 * One class handles: state, memory, knowledge, beliefs, intents, plans, action logs, relationships.
 *
 * Usage:
 *   const brain = new AgentBrainRepository(pool, 'genai1');
 *   await brain.getState();
 *   await brain.saveMemory({ summary, importance, emotion });
 *   await brain.getRecentMemories(10);
 */

export class AgentBrainRepository {
  /**
   * @param {pg.Pool} pool - PostgreSQL connection pool
   * @param {string}  agentId - e.g. 'genai1'
   */
  constructor(pool, agentId) {
    this.pool    = pool;
    this.agentId = agentId;
  }

  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────

  /** Get current agent state */
  async getState() {
    const res = await this.pool.query(
      `SELECT * FROM agent_states WHERE agent_id = $1`,
      [this.agentId]
    );
    return res.rows[0] || null;
  }

  /** Update specific state fields */
  async updateState(fields = {}) {
    const keys   = Object.keys(fields);
    const values = Object.values(fields);
    if (keys.length === 0) return;

    const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    await this.pool.query(
      `UPDATE agent_states SET ${setClauses}, updated_at = NOW() WHERE agent_id = $1`,
      [this.agentId, ...values]
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MEMORY
  // ─────────────────────────────────────────────────────────────

  /**
   * Save a new memory.
   * @param {object} mem - { summary, importance, type, emotion, location, participants, source_event }
   */
  async saveMemory(mem) {
    const res = await this.pool.query(
      `INSERT INTO agent_memories
         (agent_id, type, summary, importance, emotion, location, participants, source_event)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        this.agentId,
        mem.type        || 'event',
        mem.summary,
        mem.importance  ?? 0.5,
        JSON.stringify(mem.emotion      || {}),
        JSON.stringify(mem.location     || {}),
        JSON.stringify(mem.participants || []),
        mem.source_event || null
      ]
    );
    return res.rows[0]?.id;
  }

  /**
   * Get most recent N memories.
   * @param {number} limit
   */
  async getRecentMemories(limit = 10) {
    const res = await this.pool.query(
      `SELECT * FROM agent_memories WHERE agent_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [this.agentId, limit]
    );
    return res.rows;
  }

  /**
   * Get top N most important memories (for prompt injection).
   * @param {number} limit
   */
  async getImportantMemories(limit = 5) {
    const res = await this.pool.query(
      `SELECT * FROM agent_memories WHERE agent_id = $1 ORDER BY importance DESC, created_at DESC LIMIT $2`,
      [this.agentId, limit]
    );
    return res.rows;
  }

  /**
   * Get recent memories involving a specific target entity (player or agent).
   * @param {string} targetName - e.g. "Cyber Knight"
   * @param {number} limit
   */
  async getMemoriesForTarget(targetName, limit = 10) {
    const cleanName = targetName.replace('player:', '').replace('agent:', '');
    const res = await this.pool.query(
      `SELECT * FROM agent_memories
       WHERE agent_id = $1
         AND (
           summary ILIKE $2
           OR participants::text ILIKE $2
         )
       ORDER BY created_at DESC LIMIT $3`,
      [this.agentId, `%${cleanName}%`, limit]
    );
    return res.rows;
  }

  // ─────────────────────────────────────────────────────────────
  // KNOWLEDGE
  // ─────────────────────────────────────────────────────────────

  /** Upsert a knowledge fact (subject-predicate-object) */
  async saveKnowledge({ subject, predicate, object, confidence = 0.7, source_memories = [] }) {
    await this.pool.query(
      `INSERT INTO agent_knowledge (agent_id, subject, predicate, object, confidence, source_memories)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (agent_id, subject, predicate, object)
       DO UPDATE SET confidence = $5, source_memories = $6, updated_at = NOW()`,
      [this.agentId, subject, predicate, object, confidence, JSON.stringify(source_memories)]
    );
  }

  /** Get all knowledge about a subject */
  async getKnowledgeAbout(subject) {
    const res = await this.pool.query(
      `SELECT * FROM agent_knowledge WHERE agent_id = $1 AND subject ILIKE $2 ORDER BY confidence DESC`,
      [this.agentId, `%${subject}%`]
    );
    return res.rows;
  }

  // ─────────────────────────────────────────────────────────────
  // BELIEFS
  // ─────────────────────────────────────────────────────────────

  /** Get all current beliefs */
  async getBeliefs() {
    const res = await this.pool.query(
      `SELECT * FROM agent_beliefs WHERE agent_id = $1 ORDER BY confidence DESC`,
      [this.agentId]
    );
    return res.rows;
  }

  /** Upsert a belief */
  async saveBelief({ belief, confidence = 0.5 }) {
    await this.pool.query(
      `INSERT INTO agent_beliefs (agent_id, belief, confidence)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [this.agentId, belief, confidence]
    );
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT
  // ─────────────────────────────────────────────────────────────

  /** Get the current active intent */
  async getActiveIntent() {
    const res = await this.pool.query(
      `SELECT * FROM agent_intents WHERE agent_id = $1 AND status = 'active' ORDER BY priority DESC LIMIT 1`,
      [this.agentId]
    );
    return res.rows[0] || null;
  }

  /** Create a new intent */
  async createIntent({ goal, target, priority = 0.5, reason }) {
    const res = await this.pool.query(
      `INSERT INTO agent_intents (agent_id, goal, target, priority, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
      [this.agentId, goal, target, priority, reason]
    );
    return res.rows[0]?.id;
  }

  /** Update intent status */
  async updateIntentStatus(intentId, status) {
    await this.pool.query(
      `UPDATE agent_intents SET status = $2, updated_at = NOW() WHERE id = $1`,
      [intentId, status]
    );
  }

  // ─────────────────────────────────────────────────────────────
  // ACTION LOG
  // ─────────────────────────────────────────────────────────────

  /** Log an action taken by the agent */
  async logAction({ action, target, result, duration_ms, success = true }) {
    await this.pool.query(
      `INSERT INTO agent_action_logs (agent_id, action, target, result, duration_ms, success)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [this.agentId, action, target || null, result || null, duration_ms || null, success]
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RELATIONSHIPS
  // ─────────────────────────────────────────────────────────────

  /**
   * Get relationship with another agent.
   * @param {string} toAgentId
   */
  async getRelationship(toAgentId) {
    const res = await this.pool.query(
      `SELECT * FROM agent_relationships WHERE from_agent_id = $1 AND to_agent_id = $2`,
      [this.agentId, toAgentId]
    );
    return res.rows[0] || null;
  }

  /**
   * Save complete LLM Relationship Evaluation (Generative Agent Reflection).
   * @param {string} toAgentId
   * @param {object} evalData - { relationship: { trust, respect, friendship, fear, gratitude, curiosity, ... }, reasons: [], changes: [] }
   */
  async saveRelationshipEvaluation(toAgentId, evalData = {}) {
    const rels = evalData.relationship || {};
    const reasons = evalData.reasons || [];
    const changes = evalData.changes || [];
    const reflection = evalData.reflection || '';

    await this.pool.query(
      `INSERT INTO agent_relationships (
         from_agent_id, to_agent_id,
         trust, respect, friendship, love, hatred, fear, gratitude, curiosity, romance,
         reflection, reasons, changes, interaction_count, last_interaction, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 1, NOW(), NOW())
       ON CONFLICT (from_agent_id, to_agent_id)
       DO UPDATE SET
         trust       = EXCLUDED.trust,
         respect     = EXCLUDED.respect,
         friendship  = EXCLUDED.friendship,
         love        = EXCLUDED.love,
         hatred      = EXCLUDED.hatred,
         fear        = EXCLUDED.fear,
         gratitude   = EXCLUDED.gratitude,
         curiosity   = EXCLUDED.curiosity,
         romance     = EXCLUDED.romance,
         reflection  = EXCLUDED.reflection,
         reasons     = EXCLUDED.reasons,
         changes     = EXCLUDED.changes,
         interaction_count = agent_relationships.interaction_count + 1,
         last_interaction  = NOW(),
         updated_at        = NOW()`,
      [
        this.agentId,
        toAgentId,
        rels.trust      ?? 0.5,
        rels.respect    ?? 0.5,
        rels.friendship ?? 0.5,
        rels.love       ?? 0.0,
        rels.hatred     ?? 0.0,
        rels.fear       ?? 0.0,
        rels.gratitude  ?? 0.0,
        rels.curiosity  ?? 0.5,
        rels.romance    ?? 0.0,
        reflection,
        JSON.stringify(reasons),
        JSON.stringify(changes)
      ]
    );
  }

  /**
   * Upsert relationship values (partial update).
   * @param {string} toAgentId
   * @param {object} updates - { trust, friendship, ... }
   */
  async updateRelationship(toAgentId, updates = {}) {
    const rel = await this.getRelationship(toAgentId);
    if (!rel) {
      await this.pool.query(
        `INSERT INTO agent_relationships (from_agent_id, to_agent_id, interaction_count, last_interaction)
         VALUES ($1, $2, 1, NOW())`,
        [this.agentId, toAgentId]
      );
    }
    const keys   = Object.keys(updates);
    const values = Object.values(updates);
    if (keys.length === 0) return;

    const setClauses = keys.map((k, i) => `${k} = $${i + 3}`).join(', ');
    await this.pool.query(
      `UPDATE agent_relationships SET ${setClauses}, interaction_count = interaction_count + 1, last_interaction = NOW(), updated_at = NOW()
       WHERE from_agent_id = $1 AND to_agent_id = $2`,
      [this.agentId, toAgentId, ...values]
    );
  }
}
