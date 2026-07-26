/**
 * Migration: Create Agent Brain Tables
 *
 * Tables:
 *  - agent_states        : Current live state (HP, hunger, energy, emotion...)
 *  - agent_memories      : Long-term memory events with importance scoring
 *  - agent_knowledge     : Derived facts from Reflection (subject-predicate-object)
 *  - agent_beliefs       : Subjective beliefs (may be wrong)
 *  - agent_intents       : Short-lived goal intentions
 *  - agent_plans         : Step-by-step plans derived from intents
 *  - agent_action_logs   : Record of every action taken and its outcome
 *  - agent_relationships : Social stats between two agents
 */

export async function up(client) {

  // ─────────────────────────────────────────────────────
  // 2. Agent State — Live, mutable, updated every tick
  // ─────────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_states (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id        VARCHAR(100) NOT NULL UNIQUE,
      agent_name      VARCHAR(100),

      -- Biology
      hp              FLOAT DEFAULT 100,
      hunger          FLOAT DEFAULT 0,
      thirst          FLOAT DEFAULT 0,
      energy          FLOAT DEFAULT 100,
      sleepiness      FLOAT DEFAULT 0,
      body_temp       FLOAT DEFAULT 37,

      -- Psychology
      stress          FLOAT DEFAULT 0,
      fear            FLOAT DEFAULT 0,
      joy             FLOAT DEFAULT 0.5,
      anger           FLOAT DEFAULT 0,
      loneliness      FLOAT DEFAULT 0,
      curiosity       FLOAT DEFAULT 0.8,
      confidence      FLOAT DEFAULT 0.7,

      -- Capabilities
      fishing         FLOAT DEFAULT 0,
      cooking         FLOAT DEFAULT 0,
      farming         FLOAT DEFAULT 0,
      mining          FLOAT DEFAULT 0,
      crafting        FLOAT DEFAULT 0,
      trading         FLOAT DEFAULT 0,

      -- World Position
      location_x      FLOAT DEFAULT 0,
      location_y      FLOAT DEFAULT 0,
      direction       VARCHAR(20) DEFAULT 'south',

      -- Current activity
      current_action  VARCHAR(100),
      current_intent  VARCHAR(200),
      current_target  VARCHAR(100),

      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // ─────────────────────────────────────────────────────
  // 3. Memory — One row = one episodic memory event
  // ─────────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_memories (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id        VARCHAR(100) NOT NULL,
      type            VARCHAR(50)  DEFAULT 'event',  -- event | observation | dialogue | reflection
      summary         TEXT         NOT NULL,
      importance      FLOAT        DEFAULT 0.5,      -- 0.0 to 1.0 (LLM evaluated)
      emotion         JSONB,                         -- { "joy": 0.8, "surprise": 0.3 }
      location        JSONB,                         -- { "x": 10, "y": 60, "zone": "Spawn" }
      participants    JSONB,                         -- ["player:admin", "npc:genai1"]
      source_event    VARCHAR(200),                  -- e.g. "chat:31bd25b7"
      created_at      TIMESTAMPTZ  DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_memories_agent    ON agent_memories(agent_id);
    CREATE INDEX IF NOT EXISTS idx_memories_type     ON agent_memories(type);
    CREATE INDEX IF NOT EXISTS idx_memories_importance ON agent_memories(importance DESC);
  `);

  // ─────────────────────────────────────────────────────
  // 4. Knowledge — Derived facts from Reflection
  //    Memory  →  Reflection LLM  →  Knowledge
  // ─────────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_knowledge (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id         VARCHAR(100) NOT NULL,
      subject          VARCHAR(200) NOT NULL,   -- "Bob"
      predicate        VARCHAR(200) NOT NULL,   -- "is"
      object           VARCHAR(200) NOT NULL,   -- "trustworthy"
      confidence       FLOAT DEFAULT 0.7,       -- 0.0 to 1.0
      source_memories  JSONB,                   -- UUIDs of memories that led to this
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(agent_id, subject, predicate, object)
    );
    CREATE INDEX IF NOT EXISTS idx_knowledge_agent   ON agent_knowledge(agent_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_subject ON agent_knowledge(subject);
  `);

  // ─────────────────────────────────────────────────────
  // 5. Beliefs — Subjective, may be wrong
  // ─────────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_beliefs (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id     VARCHAR(100) NOT NULL,
      belief       TEXT         NOT NULL,      -- "Tom is dangerous"
      confidence   FLOAT DEFAULT 0.5,          -- how strongly held
      updated_at   TIMESTAMPTZ DEFAULT NOW(),
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_beliefs_agent ON agent_beliefs(agent_id);
  `);

  // ─────────────────────────────────────────────────────
  // 6. Intent — Short-lived goal (minutes to hours)
  // ─────────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_intents (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id     VARCHAR(100) NOT NULL,
      goal         TEXT         NOT NULL,      -- "Visit Bob"
      target       VARCHAR(200),               -- who/what/where
      priority     FLOAT DEFAULT 0.5,          -- 0.0 to 1.0
      status       VARCHAR(30)  DEFAULT 'pending', -- pending | active | completed | failed | cancelled
      reason       TEXT,                       -- why this intent was formed
      created_at   TIMESTAMPTZ  DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_intents_agent  ON agent_intents(agent_id);
    CREATE INDEX IF NOT EXISTS idx_intents_status ON agent_intents(status);
  `);

  // ─────────────────────────────────────────────────────
  // 7. Plan — Ordered steps from Intent
  //    Intent  →  Planner LLM  →  Plan Steps
  // ─────────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_plans (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      intent_id    UUID         REFERENCES agent_intents(id) ON DELETE CASCADE,
      agent_id     VARCHAR(100) NOT NULL,
      step_order   INT          NOT NULL,      -- 1, 2, 3...
      action       VARCHAR(200) NOT NULL,      -- "Walk East"
      target       VARCHAR(200),
      status       VARCHAR(30)  DEFAULT 'pending', -- pending | doing | done | failed
      created_at   TIMESTAMPTZ  DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_plans_intent ON agent_plans(intent_id);
    CREATE INDEX IF NOT EXISTS idx_plans_agent  ON agent_plans(agent_id);
  `);

  // ─────────────────────────────────────────────────────
  // 8. Action Log — Every action the agent took
  // ─────────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_action_logs (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id     VARCHAR(100) NOT NULL,
      action       VARCHAR(200) NOT NULL,      -- "Walk", "Talk", "Attack"
      target       VARCHAR(200),
      result       TEXT,                       -- what happened
      duration_ms  INT,                        -- how long it took
      success      BOOLEAN DEFAULT TRUE,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_action_logs_agent ON agent_action_logs(agent_id);
    CREATE INDEX IF NOT EXISTS idx_action_logs_time  ON agent_action_logs(created_at DESC);
  `);

  // ─────────────────────────────────────────────────────
  // Social Relationships — Between agents (directional)
  // ─────────────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS agent_relationships (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      from_agent_id   VARCHAR(100) NOT NULL,
      to_agent_id     VARCHAR(100) NOT NULL,
      trust           FLOAT DEFAULT 0.5,       -- 0.0 to 1.0
      respect         FLOAT DEFAULT 0.5,
      friendship      FLOAT DEFAULT 0.5,
      love            FLOAT DEFAULT 0,
      hatred          FLOAT DEFAULT 0,
      fear            FLOAT DEFAULT 0,
      gratitude       FLOAT DEFAULT 0,
      curiosity       FLOAT DEFAULT 0.5,
      romance         FLOAT DEFAULT 0,
      reputation      FLOAT DEFAULT 0.5,
      reasons         JSONB DEFAULT '[]',      -- LLM evaluated human-readable justifications
      changes         JSONB DEFAULT '[]',      -- LLM change history tracking
      interaction_count INT DEFAULT 0,
      last_interaction TIMESTAMPTZ,
      updated_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(from_agent_id, to_agent_id)
    );
    CREATE INDEX IF NOT EXISTS idx_relationships_from ON agent_relationships(from_agent_id);
    CREATE INDEX IF NOT EXISTS idx_relationships_to   ON agent_relationships(to_agent_id);

    -- Ensure existing tables gain new columns if migration ran previously
    ALTER TABLE agent_relationships ADD COLUMN IF NOT EXISTS fear FLOAT DEFAULT 0;
    ALTER TABLE agent_relationships ADD COLUMN IF NOT EXISTS gratitude FLOAT DEFAULT 0;
    ALTER TABLE agent_relationships ADD COLUMN IF NOT EXISTS curiosity FLOAT DEFAULT 0.5;
    ALTER TABLE agent_relationships ADD COLUMN IF NOT EXISTS romance FLOAT DEFAULT 0;
    ALTER TABLE agent_relationships ADD COLUMN IF NOT EXISTS reflection TEXT DEFAULT '';
    ALTER TABLE agent_relationships ADD COLUMN IF NOT EXISTS reasons JSONB DEFAULT '[]';
    ALTER TABLE agent_relationships ADD COLUMN IF NOT EXISTS changes JSONB DEFAULT '[]';
  `);

  console.log('   🧠 Agent Brain tables created: agent_states, agent_memories, agent_knowledge, agent_beliefs, agent_intents, agent_plans, agent_action_logs, agent_relationships');
}

export async function down(client) {
  await client.query(`
    DROP TABLE IF EXISTS agent_relationships CASCADE;
    DROP TABLE IF EXISTS agent_action_logs CASCADE;
    DROP TABLE IF EXISTS agent_plans CASCADE;
    DROP TABLE IF EXISTS agent_intents CASCADE;
    DROP TABLE IF EXISTS agent_beliefs CASCADE;
    DROP TABLE IF EXISTS agent_knowledge CASCADE;
    DROP TABLE IF EXISTS agent_memories CASCADE;
    DROP TABLE IF EXISTS agent_states CASCADE;
  `);
}
