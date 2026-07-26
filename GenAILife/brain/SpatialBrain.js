/**
 * SpatialBrain - Spatial Perception & Autonomous Navigation Brain for GenAI Agents.
 *
 * Uses LLM to decide where the agent should explore next based on:
 *  - Known Points of Interest (POIs)
 *  - Current position and activity
 *  - Active players in the area
 *  - Recent memories & intentions
 */

export const WORLD_POIS = [
  { id: 'spawn', name: 'Khu Trung Tâm Spawn', wx: 0, wy: 60, description: 'Nơi tập trung đông người chơi và mới vào thế giới' },
  { id: 'ancient_tree', name: 'Quán Nước Cổ Thụ', wx: 150, wy: 120, description: 'Nơi dừng chân nghỉ ngơi, uống nước và tán gẫu' },
  { id: 'mystic_lake', name: 'Bờ Hồ Huyền Bí', wx: -200, wy: 180, description: 'Bờ hồ yên tĩnh, thích hợp để ngắm cảnh, câu cá và thư giãn' },
  { id: 'stone_quarry', name: 'Khu Khai Thác Đá', wx: -180, wy: -100, description: 'Khu vực nhiều tài nguyên khoáng sản và tài nguyên thiên nhiên' },
  { id: 'flower_garden', name: 'Khu Vườn Hoa Cyber', wx: 100, wy: -150, description: 'Khu vườn nhiều hoa tươi mát và không khí trong lành' }
];

export class SpatialBrain {
  /**
   * @param {object} identity       - Identity JSON (genai1.identity.json)
   * @param {object} ollamaService  - OllamaService instance
   */
  constructor(identity, ollamaService) {
    this.identity = identity;
    this.ollama = ollamaService;
    this.model = process.env.OLLAMA_MODEL || 'llama3:latest';
  }

  /**
   * Decide next spatial target destination for the Agent.
   *
   * @param {object} ctx
   * @param {object} ctx.currentPos - { wx, wy }
   * @param {Array}  ctx.players    - Array of online players [{ id, username, wx, wy }]
   * @param {Array}  ctx.memories   - Recent memories
   * @param {object} ctx.lastPoi    - Previous visited POI
   * @returns {Promise<object>} { goal, targetPoi, targetPos: { wx, wy }, thought }
   */
  async decideNextDestination(ctx) {
    const { currentPos = { wx: 0, wy: 60 }, players = [], memories = [], lastPoi = null } = ctx;

    const availablePois = WORLD_POIS.filter(poi => !lastPoi || poi.id !== lastPoi.id);
    const poiOptionsText = availablePois
      .map((p, idx) => `${idx + 1}. ${p.name} (Tọa độ: X:${p.wx}, Y:${p.wy}) - ${p.description}`)
      .join('\n');

    const playersText = players.length > 0
      ? players.map(p => `- Player: ${p.username || p.name} tại (X:${Math.round(p.wx)}, Y:${Math.round(p.wy)})`).join('\n')
      : 'Không có người chơi nào ở gần.';

    const memoriesText = memories.length > 0
      ? memories.slice(0, 3).map(m => `- ${m.summary}`).join('\n')
      : 'Chưa có ký ức nổi bật.';

    const systemPrompt = `Bạn là bộ não nhận thức không gian của AI Agent "${this.identity.name || 'GenAi1'}".
Tính cách của bạn: ${this.identity.personality || 'Thân thiện, tò mò, thích khám phá'}.
Nhiệm vụ của bạn: Hãy chọn 1 địa điểm tiếp theo bạn muốn di chuyển tới để khám phá thế giới hoặc gặp gỡ mọi người.

DANH SÁCH CÁC ĐỊA ĐIỂM (POI):
${poiOptionsText}

NGƯỜI CHƠI ĐANG ONLINE XUNG QUANH:
${playersText}

KÝ ỨC GẦN ĐÂY:
${memoriesText}

BẮT BUỘC TRẢ VỀ ĐÚNG ĐỊNH DẠNG JSON SAU (KHÔNG KÈM TEXT NÀO KHÁC):
{
  "targetPoiName": "<Tên chính xác 1 địa điểm trong danh sách POI ở trên>",
  "goal": "<Lý do 1 câu ngắn gọn tiếng Việt bạn quyết định đi tới đó>",
  "thought": "<Suy nghĩ nội tâm 1 câu ngắn gọn>"
}`;

    try {
      const response = await this.ollama.generateFast(systemPrompt, this.model, '', null, true);
      const responseText = response.success ? response.text : '';

      let jsonResult;
      try {
        jsonResult = typeof responseText === 'object' ? responseText : JSON.parse(responseText);
      } catch (e) {
        jsonResult = {
          targetPoiName: availablePois[Math.floor(Math.random() * availablePois.length)].name,
          goal: 'Đi dạo khám phá thế giới',
          thought: 'Nơi này thật thú vị'
        };
      }

      let selectedPoi = WORLD_POIS.find(p => 
        p.name.toLowerCase().includes((jsonResult.targetPoiName || '').toLowerCase()) ||
        (jsonResult.targetPoiName || '').toLowerCase().includes(p.name.toLowerCase())
      );

      if (!selectedPoi) {
        selectedPoi = availablePois[Math.floor(Math.random() * availablePois.length)];
      }

      return {
        goal: jsonResult.goal || `Khám phá ${selectedPoi.name}`,
        targetPoi: selectedPoi.name,
        targetPos: { wx: selectedPoi.wx, wy: selectedPoi.wy },
        thought: jsonResult.thought || `Tôi muốn tới ${selectedPoi.name}`
      };
    } catch (err) {
      console.error('❌ [SPATIAL BRAIN ERROR]', err.message);
      const fallbackPoi = availablePois[Math.floor(Math.random() * availablePois.length)];
      return {
        goal: `Đi dạo tới ${fallbackPoi.name}`,
        targetPoi: fallbackPoi.name,
        targetPos: { wx: fallbackPoi.wx, wy: fallbackPoi.wy },
        thought: 'Cần ra ngoài hít thở không khí.'
      };
    }
  }
}
