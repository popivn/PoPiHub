import { WebSocketServer, WebSocket } from 'ws';
import pg from 'pg';
import { createRequire } from 'module';
import ollamaService from '../llm/OllamaService.js';
import { DialogueBrain } from '../brain/DialogueBrain.js';
import { SpatialBrain, WORLD_POIS } from '../brain/SpatialBrain.js';
import { AgentBrainRepository } from '../brain/AgentBrainRepository.js';
import { RelationshipEngine } from '../brain/RelationshipEngine.js';

// Load GenAi1 identity from brain database JSON
const require = createRequire(import.meta.url);
const genAi1Identity = require('../brain/identity/genai1.identity.json');
const genAi1Brain = new DialogueBrain(genAi1Identity, ollamaService);
const spatialBrain = new SpatialBrain(genAi1Identity, ollamaService);
const relEngine   = new RelationshipEngine(ollamaService);

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'popihub_db',
  password: process.env.DB_PASSWORD || 'postgrespassword',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// Agent Brain Repository for GenAi1 (DB read/write for all brain tables)
const genAi1Repo = new AgentBrainRepository(pool, 'genai1');

export class GameSocketServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.players = new Map(); // socket -> player data

    this.spatialState = {
      currentPos: { wx: 0, wy: 60 },
      targetPoi: 'Khu Trung Tâm Spawn',
      targetPos: { wx: 0, wy: 60 },
      intentGoal: 'Đứng quan sát tại Khu Spawn',
      isMoving: false,
      lastPoi: null
    };

    // 🤖 Start Autonomous Agent Spatial Perception Loop (~25s)
    this.startSpatialLoop();

    this.wss.on('connection', (ws) => {
      console.log('⚡ [WebSocket] Client connected');

      // Send initial Agent Spatial Target to newly connected client
      ws.send(JSON.stringify({
        type: 'AGENT_SET_TARGET',
        agentId: '00000000-0000-0000-0000-0000000000b1',
        agentName: 'GenAi1',
        targetPos: this.spatialState.targetPos,
        targetPoi: this.spatialState.targetPoi,
        goal: this.spatialState.intentGoal
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (err) {
          console.error('WS Parse Error:', err);
        }
      });

      ws.on('close', () => {
        const player = this.players.get(ws);
        if (player) {
          console.log(`❌ [WebSocket] Player left: ${player.username}`);
          this.players.delete(ws);
          // Broadcast player disconnect
          this.broadcast({
            type: 'PLAYER_LEFT',
            playerId: player.id
          }, ws);
        }
      });
    });
  }

  /**
   * Autonomous Spatial Loop - Every 25 seconds LLM evaluates environment and picks new target
   */
  startSpatialLoop() {
    const runLoop = async () => {
      try {
        if (this.spatialState.isMoving) return; // Do not recalculate if currently en route

        const onlinePlayers = Array.from(this.players.values());
        const recentMemories = await genAi1Repo.getRecentMemories(3).catch(() => []);

        console.log(`🧠 [SPATIAL BRAIN] GenAi1 evaluating spatial environment...`);
        const decision = await spatialBrain.decideNextDestination({
          currentPos: this.spatialState.currentPos,
          players: onlinePlayers,
          memories: recentMemories,
          lastPoi: this.spatialState.lastPoi
        });

        this.spatialState.targetPos = decision.targetPos;
        this.spatialState.targetPoi = decision.targetPoi;
        this.spatialState.intentGoal = decision.goal;
        this.spatialState.isMoving = true;

        console.log(`🗺️ [SPATIAL INTENT] GenAi1 heading to: ${decision.targetPoi} | Goal: "${decision.goal}"`);

        // Save Intent to DB
        const intentId = await genAi1Repo.createIntent({
          goal: decision.goal,
          target: decision.targetPoi,
          priority: 0.8,
          reason: decision.thought
        }).catch((err) => console.error('[DB ERROR] createIntent:', err.message));

        // Update Agent State in DB
        await genAi1Repo.updateState({
          current_action: 'walking',
          current_intent: decision.goal,
          current_target: decision.targetPoi
        }).catch((err) => console.error('[DB ERROR] updateState:', err.message));

        // Log Action
        await genAi1Repo.logAction({
          action: 'move_intent',
          target: decision.targetPoi,
          result: `Goal: ${decision.goal}`,
          success: true
        }).catch((err) => console.error('[DB ERROR] logAction:', err.message));

        // Broadcast new target destination to all connected clients
        this.broadcast({
          type: 'AGENT_SET_TARGET',
          agentId: '00000000-0000-0000-0000-0000000000b1',
          agentName: 'GenAi1',
          targetPos: decision.targetPos,
          targetPoi: decision.targetPoi,
          goal: decision.goal,
          thought: decision.thought
        });
      } catch (err) {
        console.error('❌ [SPATIAL LOOP ERROR]', err.message);
      }
    };

    // Trigger initial run after 3s, then repeat every 10s
    setTimeout(runLoop, 3000);
    setInterval(runLoop, 10000);
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'JOIN_GAME': {
        const userId = (data.user && data.user.id) ? data.user.id : `user_${Date.now()}`;
        const playerInfo = {
          id: (data.player && data.player.id) ? data.player.id : userId,
          userId: userId,
          username: (data.user && data.user.username) ? data.user.username : 'Hero',
          name: (data.player && data.player.name) ? data.player.name : (data.user ? data.user.username : 'Hero'),
          wx: (data.player && typeof data.player.wx === 'number') ? data.player.wx : (Math.random() - 0.5) * 60,
          wy: (data.player && typeof data.player.wy === 'number') ? data.player.wy : (Math.random() - 0.5) * 60,
          config: (data.player && (data.player.config_json || data.player.config)) || {},
          anim: 'idle'
        };

        this.players.set(ws, playerInfo);
        console.log(`🎮 [Online Player Joined] Username: ${playerInfo.username} | ID: ${playerInfo.id}`);

        // Send existing online players to new player
        const otherPlayers = Array.from(this.players.values()).filter(p => p.id !== playerInfo.id);
        ws.send(JSON.stringify({
          type: 'CURRENT_PLAYERS',
          players: otherPlayers
        }));

        // Broadcast new player to everyone else
        this.broadcast({
          type: 'PLAYER_JOINED',
          player: playerInfo
        }, ws);
        break;
      }

      case 'UPDATE_POSITION': {
        const player = this.players.get(ws);
        if (player) {
          player.wx = data.wx;
          player.wy = data.wy;
          player.anim = data.anim;
          player.scaleX = data.scaleX;

          // Broadcast position update to all other players
          this.broadcast({
            type: 'PLAYER_MOVED',
            playerId: player.id,
            wx: player.wx,
            wy: player.wy,
            anim: player.anim,
            scaleX: player.scaleX
          }, ws);
        }
        break;
      }

      case 'ATTACK_ACTION': {
        const player = this.players.get(ws);
        if (player) {
          this.broadcast({
            type: 'PLAYER_ATTACKED',
            playerId: player.id
          }, ws);
        }
        break;
      }

      case 'AGENT_ARRIVED': {
        const { agentId, poiName, wx, wy } = data;
        if (agentId === '00000000-0000-0000-0000-0000000000b1' || agentId === 'genai1') {
          this.spatialState.isMoving = false;
          this.spatialState.currentPos = { wx, wy };
          this.spatialState.lastPoi = { id: poiName, name: poiName, wx, wy };

          console.log(`📍 [AGENT ARRIVED] GenAi1 has reached destination: ${poiName} (wx:${wx}, wy:${wy})`);

          // 🗄️ Save Episodic Spatial Memory into agent_memories
          genAi1Repo.saveMemory({
            type: 'observation',
            summary: `Tôi đã hoàn thành di chuyển và đến địa điểm ${poiName} để khám phá.`,
            importance: 0.6,
            emotion: { joy: 0.7, curiosity: 0.8 },
            location: { wx, wy, zone: poiName },
            participants: ['agent:genai1'],
            source_event: 'spatial_navigation'
          }).catch(err => console.error('[SPATIAL MEMORY ERROR]', err.message));

          // Update Agent State
          genAi1Repo.updateState({
            location_x: wx,
            location_y: wy,
            current_action: 'idle_observing',
            current_intent: `Observing at ${poiName}`
          }).catch(err => console.error('[SPATIAL STATE UPDATE ERROR]', err.message));
        }
        break;
      }

      case 'CHAT_MESSAGE': {
        const sender = this.players.get(ws);
        const { text, targetId, targetName } = data;

        if (sender && text) {
          const t0 = performance.now();
          console.log(`💬 [CHAT] ${sender.name || sender.username} → ${targetName || 'All'}: "${text}"`);

          // Broadcast player message to all clients immediately
          this.broadcast({
            type: 'PLAYER_CHAT',
            senderId: sender.id,
            senderName: sender.name || sender.username,
            targetId: targetId || null,
            targetName: targetName || null,
            text: text,
            timestamp: Date.now()
          });

          // ⚡ Save player message to DB — fire and forget, does NOT block LLM
          const tDb1 = performance.now();
          pool.query(
            `INSERT INTO chat_histories (sender_id, sender_name, receiver_id, receiver_name, message, channel)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [sender.id, sender.name || sender.username, targetId || null, targetName || null, text, targetId ? 'whisper' : 'global']
          ).then(() => {
            console.log(`💾 [DB] Player message saved (${(performance.now() - tDb1).toFixed(0)}ms)`);
          }).catch(err => console.error('[DB ERROR]', err.message));

          // 🤖 GenAi1 AI Agent — ⚡ 1 SINGLE UNIFIED LLM CALL -> { reply, emotion, relationship }
          if (targetId === 'npc_genai1' || targetId === '00000000-0000-0000-0000-0000000000b1' || targetName === 'GenAi1') {
            (async () => {
              const tLlm = performance.now();
              console.log(`🧠 [BRAIN UNIFIED] ${genAi1Identity.dialogueModel} thinking...`);

              const senderName = sender.name || sender.username;
              const targetTag = `player:${senderName}`;
              const existingRel = await genAi1Repo.getRelationship(targetTag).catch(() => null);
              const accumulatedMemories = await genAi1Repo.getMemoriesForTarget(senderName, 5).catch(() => []);

              // ⚡ Single Unified LLM Call
              const brainResult = await genAi1Brain.reply({
                senderName,
                message: text,
                existingRel,
                memories: accumulatedMemories
              });

              const elapsed = (performance.now() - tLlm).toFixed(0);
              console.log(`✨ [UNIFIED REPLY] GenAi1 (${elapsed}ms) emotion:${brainResult.emotion} → "${brainResult.reply.slice(0, 80)}"`);

              // ✅ Broadcast reply immediately — user gets response right away
              this.broadcast({
                type: 'PLAYER_CHAT',
                senderId: '00000000-0000-0000-0000-0000000000b1',
                senderName: 'GenAi1',
                targetId: sender.id,
                targetName: senderName,
                text: brainResult.reply,
                emotion: brainResult.emotion,
                timestamp: Date.now()
              });

              // 🗄️ Background: Save chat history, memory, and updated relationship scores (Zero extra LLM calls)
              setImmediate(async () => {
                // Save chat history
                await pool.query(
                  `INSERT INTO chat_histories (sender_id, sender_name, receiver_id, receiver_name, message, channel)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                  ['00000000-0000-0000-0000-0000000000b1', 'GenAi1', sender.id, senderName, brainResult.reply, 'whisper']
                ).catch(err => console.error('[DB ERROR] chat_histories:', err.message));

                // Save Episodic Memory
                await genAi1Repo.saveMemory({
                  type: 'dialogue',
                  summary: `${senderName} nhắn: "${text}". GenAi1 trả lời: "${brainResult.reply.slice(0, 100)}"`,
                  importance: 0.5,
                  emotion: { current: brainResult.emotion },
                  location: { x: 0, y: 60, zone: 'Spawn Point' },
                  participants: [`player:${sender.id}`, `player:${senderName}`, 'agent:genai1'],
                  source_event: `chat:${sender.id}`
                }).catch(err => console.error('[BRAIN ERROR] saveMemory:', err.message));

                // Save updated relationship scores directly from the unified LLM call
                if (brainResult.relationship) {
                  await genAi1Repo.saveRelationshipEvaluation(targetTag, {
                    relationship: brainResult.relationship,
                    reasons: [],
                    reflection: ''
                  }).catch(err => console.error('[BRAIN ERROR] saveRelationship:', err.message));
                  console.log(`🤝 [UNIFIED RELATIONSHIP SAVED] Target: ${targetTag} | Trust: ${brainResult.relationship.trust}`);
                }

                // Always log action
                await genAi1Repo.logAction({
                  action: 'dialogue',
                  target: senderName,
                  result: brainResult.reply.slice(0, 200),
                  duration_ms: Math.round(performance.now() - tLlm),
                  success: true
                }).catch(err => console.error('[BRAIN ERROR] logAction:', err.message));
              });
            })();
          }
        }
        break;
      }
    }
  }

  broadcast(data, excludeWs = null) {
    const payload = JSON.stringify(data);
    for (const [clientWs] of this.players) {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(payload);
      }
    }
  }
}
