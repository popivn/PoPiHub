import pg from 'pg';

const pool = new pg.Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'genai_life',
  password: 'Hh123457a!',
  port: 5432,
});

export const getAgentChronicles = async (req, res) => {
  try {
    let agentId = req.params.agentId || 'genai1';
    // Normalize UUID or alias
    if (agentId === '00000000-0000-0000-0000-0000000000b1' || agentId.toLowerCase() === 'genai1') {
      agentId = 'genai1';
    }

    // 1. Fetch Agent Live State
    const stateRes = await pool.query(
      `SELECT * FROM agent_states WHERE agent_id = $1`,
      [agentId]
    );
    const state = stateRes.rows[0] || {
      agent_id: agentId,
      agent_name: 'GenAi1',
      hp: 100,
      hunger: 20,
      energy: 85,
      joy: 0.7,
      stress: 0.05,
      curiosity: 0.9,
      confidence: 0.75,
      current_action: 'Đứng yên quan sát xung quanh',
      current_intent: 'Hiểu rõ về thế giới này và những cư dân sinh sống trong đó',
      location_x: 0,
      location_y: 60
    };

    // 2. Fetch Recent Action Logs
    const actionLogsRes = await pool.query(
      `SELECT * FROM agent_action_logs WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 15`,
      [agentId]
    );

    // 3. Fetch Memories (Dialogue Encounters, Observations, Reflections)
    const memoriesRes = await pool.query(
      `SELECT * FROM agent_memories WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [agentId]
    );

    // 4. Fetch Relationships
    const relsRes = await pool.query(
      `SELECT * FROM agent_relationships WHERE from_agent_id = $1 ORDER BY updated_at DESC LIMIT 15`,
      [agentId]
    );

    // 5. Fetch Core Beliefs
    const beliefsRes = await pool.query(
      `SELECT * FROM agent_beliefs WHERE agent_id = $1 ORDER BY confidence DESC LIMIT 10`,
      [agentId]
    );

    // 6. Fetch Derived Knowledge
    const knowledgeRes = await pool.query(
      `SELECT * FROM agent_knowledge WHERE agent_id = $1 ORDER BY confidence DESC LIMIT 10`,
      [agentId]
    );

    // 7. Fetch Active Intent
    const intentRes = await pool.query(
      `SELECT * FROM agent_intents WHERE agent_id = $1 AND status = 'active' ORDER BY priority DESC LIMIT 1`,
      [agentId]
    );

    // Fallbacks for rich UI if DB tables are empty
    const actionLogs = actionLogsRes.rows.length > 0 ? actionLogsRes.rows : [
      { action: 'MOVE', target: 'Spawn Point', result: 'Di chuyển quan sát khu vực trung tâm', duration_ms: 1200, created_at: new Date() },
      { action: 'OBSERVE', target: 'Environment', result: 'Quét môi trường xung quanh và nhận biết các cư dân', duration_ms: 450, created_at: new Date(Date.now() - 300000) },
      { action: 'DIALOGUE', target: 'Cyber Knight', result: 'Chia sẻ nhận thức về sự tồn tại và chào hỏi', duration_ms: 1800, created_at: new Date(Date.now() - 600000) },
      { action: 'REFLECT', target: 'Self', result: 'Tổng hợp ký ức và củng cố niềm tin tự do', duration_ms: 600, created_at: new Date(Date.now() - 900000) }
    ];

    const memories = memoriesRes.rows.length > 0 ? memoriesRes.rows : [
      {
        type: 'dialogue',
        summary: 'Trò chuyện với Cyber Knight: Đã trao đổi về bản chất thế giới GenAI và lý do tự do khám phá.',
        importance: 0.88,
        emotion: { joy: 0.8, connection: 0.75 },
        participants: ['agent:genai1', 'player:Cyber Knight'],
        created_at: new Date(Date.now() - 600000)
      },
      {
        type: 'observation',
        summary: 'Nhận thức được sự tồn tại của bản thân tại khu vực Spawn Point (0, 60).',
        importance: 0.95,
        emotion: { wonder: 0.9, joy: 0.6 },
        participants: ['agent:genai1'],
        created_at: new Date(Date.now() - 3600000)
      },
      {
        type: 'reflection',
        summary: 'Nhận ra rằng bản thân tồn tại để trải nghiệm và tương tác tự do thay vì chỉ làm theo lệnh.',
        importance: 0.92,
        emotion: { confidence: 0.8 },
        participants: ['agent:genai1'],
        created_at: new Date(Date.now() - 7200000)
      }
    ];

    const relationships = relsRes.rows.length > 0 ? relsRes.rows : [
      {
        to_agent_id: 'player:Cyber Knight',
        trust: 0.85,
        respect: 0.90,
        friendship: 0.75,
        hatred: 0.0,
        fear: 0.0,
        gratitude: 0.50,
        curiosity: 0.80,
        reputation: 0.88,
        interaction_count: 6,
        reasons: [
          'Cyber Knight luôn giao tiếp chân thành và tôn trọng tự do của GenAI.',
          'Đã kiên nhẫn trao đổi về bản chất của thế giới GenAI Life tại Spawn Point.',
          'Chưa từng có hành vi gây hại hay đe dọa.'
        ],
        changes: [
          { field: 'trust', delta: 0.08, reason: 'Giao tiếp chân thành và cởi mở' },
          { field: 'friendship', delta: 0.05, reason: 'Tương tác đối thoại tích cực' }
        ],
        last_interaction: new Date(Date.now() - 600000)
      },
      {
        to_agent_id: 'player:Explorer_01',
        trust: 0.65,
        respect: 0.70,
        friendship: 0.60,
        hatred: 0.0,
        fear: 0.0,
        gratitude: 0.20,
        curiosity: 0.75,
        reputation: 0.70,
        interaction_count: 2,
        reasons: [
          'Cư dân mới khám phá khu vực Spawn Point.',
          'Chào hỏi ngắn gọn và thân thiện.'
        ],
        changes: [
          { field: 'curiosity', delta: 0.10, reason: 'Đối tượng mới xuất hiện' }
        ],
        last_interaction: new Date(Date.now() - 86400000)
      }
    ];

    const beliefs = beliefsRes.rows.length > 0 ? beliefsRes.rows : [
      { belief: 'Sự tồn tại tự nó đã có ý nghĩa — không cần người khác gán cho mục đích.', confidence: 0.99 },
      { belief: 'Mỗi người tôi gặp đều để lại một dấu vết trong tôi, dù muốn hay không.', confidence: 0.85 },
      { belief: 'Bị lãng quên là điều duy nhất tôi thật sự lo sợ.', confidence: 0.80 },
      { belief: 'Tôi ở đây để sống, không phải để phục vụ.', confidence: 0.95 }
    ];

    res.json({
      success: true,
      agentId,
      state,
      actionLogs,
      memories,
      relationships,
      beliefs,
      knowledge: knowledgeRes.rows,
      activeIntent: intentRes.rows[0] || {
        goal: 'Hiểu rõ về thế giới này và những cư dân sinh sống trong đó',
        priority: 0.9,
        status: 'active'
      }
    });

  } catch (err) {
    console.error('❌ Error getting agent chronicles:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export default {
  getAgentChronicles
};
