/**
 * ChroniclesFeature.js
 *
 * Manages the "Bảng Kiến văn GenAI" (GenAI Life Agent Chronicles & Social Log) modal.
 * Displays agent actions, encounter summaries (NOT raw chat history), social relationships,
 * core beliefs, derived knowledge, and active intent.
 */

export class ChroniclesFeature {
  constructor(app, chatFeature = null) {
    this.app = app;
    this.chatFeature = chatFeature;
    this.currentAgent = null;
    this.activeTab = 'actions'; // 'actions' | 'encounters' | 'relationships' | 'beliefs'

    this.createChroniclesModalUI();
  }

  setChatFeature(chatFeature) {
    this.chatFeature = chatFeature;
  }

  createChroniclesModalUI() {
    if (document.getElementById('genai-chronicles-modal')) return;

    const modalHTML = `
      <div id="genai-chronicles-modal" class="hidden fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <div class="glass relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl overflow-hidden border border-cyan-500/40 shadow-[0_0_50px_rgba(0,242,254,0.15)] bg-slate-900/95 text-slate-100">
          
          <!-- Header -->
          <div class="relative px-6 py-4 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40">
            <div class="flex items-center gap-3.5">
              <div class="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                <i class="fa-solid fa-scroll text-xl text-cyan-400"></i>
                <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse"></span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h2 id="chronicles-agent-name" class="text-lg font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-cyan-400">GenAi1</h2>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">AI Lifer</span>
                </div>
                <p id="chronicles-agent-subtitle" class="text-xs text-slate-400 mt-0.5">Bảng Kiến văn · Trải nghiệm & Mối quan hệ xã hội</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button id="btn-chronicles-direct-chat" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 transition-all hover:scale-105 shadow-md shadow-cyan-500/20 cursor-pointer">
                <i class="fa-solid fa-comments"></i> Trò chuyện
              </button>
              <button id="btn-close-chronicles" class="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Vitals Bar -->
          <div id="chronicles-vitals-bar" class="px-6 py-2.5 bg-slate-950/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div class="flex items-center gap-4 text-slate-300 flex-wrap">
              <span id="vital-intent" class="flex items-center gap-1.5 text-cyan-300 font-semibold bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                <i class="fa-solid fa-compass text-cyan-400"></i> <span id="vital-intent-text">Đang tải...</span>
              </span>
              <span id="vital-mood" class="flex items-center gap-1">
                <i class="fa-solid fa-face-smile text-emerald-400"></i> Tâm trạng: <strong id="vital-mood-text" class="text-white">Vui vẻ</strong>
              </span>
              <span id="vital-energy" class="flex items-center gap-1">
                <i class="fa-solid fa-bolt text-amber-400"></i> Năng lượng: <strong id="vital-energy-text" class="text-white">85%</strong>
              </span>
            </div>
            <div class="text-slate-400 text-[11px] flex items-center gap-1">
              <i class="fa-solid fa-location-dot text-rose-400"></i> <span id="vital-location">Spawn Point (0, 60)</span>
            </div>
          </div>

          <!-- Navigation Tabs -->
          <div class="px-6 pt-3 flex items-center gap-2 border-b border-white/10 overflow-x-auto shrink-0 scrollbar-none">
            <button data-tab="actions" class="chronicles-tab-btn flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 border-cyan-400 text-cyan-300 bg-cyan-500/10 cursor-pointer">
              <i class="fa-solid fa-list-check text-cyan-400"></i> Nhật ký & Hành động
            </button>
            <button data-tab="encounters" class="chronicles-tab-btn flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer">
              <i class="fa-solid fa-user-group text-emerald-400"></i> Gặp gỡ & Cuộc trò chuyện
            </button>
            <button data-tab="relationships" class="chronicles-tab-btn flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer">
              <i class="fa-solid fa-heart text-rose-400"></i> Mối quan hệ
            </button>
            <button data-tab="beliefs" class="chronicles-tab-btn flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5 cursor-pointer">
              <i class="fa-solid fa-brain text-purple-400"></i> Niềm tin & Tri thức
            </button>
          </div>

          <!-- Content Body -->
          <div class="p-6 overflow-y-auto flex-1 space-y-4 max-h-[55vh]">
            
            <!-- Loading Indicator -->
            <div id="chronicles-loading" class="flex flex-col items-center justify-center py-12 gap-3">
              <div class="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
              <p class="text-xs text-slate-400">Đang truy xuất Kiến văn của AI Lifer...</p>
            </div>

            <!-- Tab 1: Actions & Events -->
            <div id="tab-actions-content" class="chronicles-tab-panel space-y-3">
              <!-- Dynamically Populated -->
            </div>

            <!-- Tab 2: Dialogue Encounters & Summaries -->
            <div id="tab-encounters-content" class="chronicles-tab-panel hidden space-y-3">
              <!-- Dynamically Populated -->
            </div>

            <!-- Tab 3: Social Relationships -->
            <div id="tab-relationships-content" class="chronicles-tab-panel hidden space-y-3">
              <!-- Dynamically Populated -->
            </div>

            <!-- Tab 4: Beliefs, Intent & Knowledge -->
            <div id="tab-beliefs-content" class="chronicles-tab-panel hidden space-y-4">
              <!-- Dynamically Populated -->
            </div>

          </div>

          <!-- Footer -->
          <div class="px-6 py-3.5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
            <span>✨ Tất cả nội dung là **Kiến văn & Trí nhớ** đúc kết của GenAI (Không chứa chat histories thô)</span>
            <button id="btn-chronicles-footer-chat" class="px-4 py-1.5 rounded-xl font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all cursor-pointer">
              💬 Mở khung Chat với <span id="chronicles-footer-name">GenAi1</span>
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.setupEvents();
  }

  setupEvents() {
    const modal = document.getElementById('genai-chronicles-modal');
    const closeBtn = document.getElementById('btn-close-chronicles');
    const directChatBtn = document.getElementById('btn-chronicles-direct-chat');
    const footerChatBtn = document.getElementById('btn-chronicles-footer-chat');
    const tabBtns = document.querySelectorAll('.chronicles-tab-btn');

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    const triggerChat = () => {
      modal.classList.add('hidden');
      if (this.chatFeature && this.currentAgentCharacter) {
        this.chatFeature.selectCharacter(this.currentAgentCharacter);
      }
    };

    directChatBtn.addEventListener('click', triggerChat);
    footerChatBtn.addEventListener('click', triggerChat);

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        this.switchTab(targetTab);
      });
    });
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    const tabBtns = document.querySelectorAll('.chronicles-tab-btn');
    const tabPanels = document.querySelectorAll('.chronicles-tab-panel');

    tabBtns.forEach(btn => {
      const isTarget = btn.getAttribute('data-tab') === tabName;
      if (isTarget) {
        btn.classList.add('border-cyan-400', 'text-cyan-300', 'bg-cyan-500/10');
        btn.classList.remove('border-transparent', 'text-slate-400');
      } else {
        btn.classList.remove('border-cyan-400', 'text-cyan-300', 'bg-cyan-500/10');
        btn.classList.add('border-transparent', 'text-slate-400');
      }
    });

    tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabName}-content`) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });
  }

  async openChroniclesModal(character) {
    this.currentAgentCharacter = character;
    const config = character.config || {};
    const agentId = config.id || 'genai1';
    const agentName = config.name || 'GenAi1';

    const modal = document.getElementById('genai-chronicles-modal');
    const loadingEl = document.getElementById('chronicles-loading');
    const nameEl = document.getElementById('chronicles-agent-name');
    const footerNameEl = document.getElementById('chronicles-footer-name');

    nameEl.textContent = agentName;
    footerNameEl.textContent = agentName;

    // Show modal & loading state
    modal.classList.remove('hidden');
    loadingEl.classList.remove('hidden');

    this.clearPanels();

    try {
      const res = await fetch(`/api/agent/${encodeURIComponent(agentId)}/chronicles`);
      const data = await res.json();

      loadingEl.classList.add('hidden');

      if (data.success) {
        this.renderData(data);
      } else {
        this.renderFallbackData(agentName);
      }

    } catch (err) {
      console.warn('⚠️ Could not fetch live agent chronicles, using fallback:', err);
      loadingEl.classList.add('hidden');
      this.renderFallbackData(agentName);
    }
  }

  clearPanels() {
    ['actions', 'encounters', 'relationships', 'beliefs'].forEach(tab => {
      const el = document.getElementById(`tab-${tab}-content`);
      if (el) el.innerHTML = '';
    });
  }

  renderData(data) {
    const { state, actionLogs, memories, relationships, beliefs, knowledge, activeIntent } = data;

    // 1. Render Vitals Header
    const intentTextEl = document.getElementById('vital-intent-text');
    const moodTextEl = document.getElementById('vital-mood-text');
    const energyTextEl = document.getElementById('vital-energy-text');
    const locTextEl = document.getElementById('vital-location');

    if (intentTextEl) intentTextEl.textContent = state?.current_intent || activeIntent?.goal || 'Khám phá thế giới';
    if (moodTextEl) moodTextEl.textContent = state?.joy > 0.6 ? 'Vui vẻ (Joy 70%)' : 'Bình thản';
    if (energyTextEl) energyTextEl.textContent = `${Math.round(state?.energy || 85)}%`;
    if (locTextEl) locTextEl.textContent = `Spawn Point (${state?.location_x || 0}, ${state?.location_y || 60})`;

    // 2. Render Tab 1: Actions & Events
    const actionsPanel = document.getElementById('tab-actions-content');
    if (actionLogs && actionLogs.length > 0) {
      actionsPanel.innerHTML = actionLogs.map(log => `
        <div class="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-start justify-between gap-3 hover:border-cyan-500/30 transition-all">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <i class="${this.getActionIcon(log.action)} text-cyan-400 text-xs"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-200">${log.action}</span>
                ${log.target ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">Target: ${log.target}</span>` : ''}
              </div>
              <p class="text-xs text-slate-300 mt-1">${log.result || 'Hành động thành công'}</p>
            </div>
          </div>
          <span class="text-[10px] text-slate-500 shrink-0 font-mono">${this.formatTime(log.created_at)}</span>
        </div>
      `).join('');
    } else {
      actionsPanel.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">Chưa ghi nhận hành động mới.</p>`;
    }

    // 3. Render Tab 2: Encounters & Dialogue Summaries (NOT raw chat histories)
    const encountersPanel = document.getElementById('tab-encounters-content');
    const dialogueMemories = (memories || []).filter(m => m.type === 'dialogue' || m.type === 'observation' || m.type === 'reflection');
    
    if (dialogueMemories.length > 0) {
      encountersPanel.innerHTML = dialogueMemories.map(mem => `
        <div class="p-4 rounded-2xl bg-gradient-to-r from-slate-800/60 to-indigo-950/40 border border-indigo-500/20 space-y-2 hover:border-indigo-400/40 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
                ${mem.type === 'dialogue' ? '💬 Cuộc Trò Chuyện' : mem.type === 'reflection' ? '💡 Suy Ngẫm' : '👁️ Quan Sát'}
              </span>
              <span class="text-[11px] font-bold text-amber-300">⭐ Đáng nhớ: ${Math.round((mem.importance || 0.5) * 100)}%</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono">${this.formatTime(mem.created_at)}</span>
          </div>
          <p class="text-xs text-slate-200 leading-relaxed font-medium">"${mem.summary}"</p>
          ${mem.participants && Array.isArray(mem.participants) && mem.participants.length > 0 ? `
            <div class="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1">
              <i class="fa-solid fa-users text-indigo-400"></i> Thành phần tham gia:
              <span class="text-slate-300 font-semibold">${mem.participants.join(', ')}</span>
            </div>
          ` : ''}
        </div>
      `).join('');
    } else {
      encountersPanel.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">Chưa có tóm tắt cuộc gặp gỡ nào.</p>`;
    }

    // 4. Render Tab 3: Social Relationships
    const relsPanel = document.getElementById('tab-relationships-content');
    if (relationships && relationships.length > 0) {
      relsPanel.innerHTML = relationships.map(rel => `
        <div class="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-3 hover:border-rose-500/30 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm">
                <i class="fa-solid fa-user-astronaut"></i>
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-200">${rel.to_agent_id.replace('player:', '').replace('agent:', '')}</h4>
                <p class="text-[10px] text-slate-400">Số lần tương tác: <span class="text-cyan-300 font-semibold">${rel.interaction_count || 1}</span></p>
              </div>
            </div>
            <span class="text-[10px] text-slate-500 font-mono">Gặp gần nhất: ${this.formatTime(rel.last_interaction)}</span>
          </div>

          <!-- Relationship Meter Bars (Radar / Numeric indicators) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <div class="flex justify-between text-slate-300 font-medium mb-1">
                <span>🟢 Đáng tin (Trust)</span>
                <span class="text-emerald-400 font-bold">${Math.round((rel.trust || 0.5) * 100)}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-400 rounded-full" style="width: ${(rel.trust || 0.5) * 100}%"></div>
              </div>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <div class="flex justify-between text-slate-300 font-medium mb-1">
                <span>💙 Tình bạn (Friendship)</span>
                <span class="text-cyan-400 font-bold">${Math.round((rel.friendship || 0.5) * 100)}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-400 rounded-full" style="width: ${(rel.friendship || 0.5) * 100}%"></div>
              </div>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <div class="flex justify-between text-slate-300 font-medium mb-1">
                <span>🎖️ Tôn trọng (Respect)</span>
                <span class="text-purple-400 font-bold">${Math.round((rel.respect || 0.5) * 100)}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-purple-400 rounded-full" style="width: ${(rel.respect || 0.5) * 100}%"></div>
              </div>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <div class="flex justify-between text-slate-300 font-medium mb-1">
                <span>👀 Hiếu kỳ (Curiosity)</span>
                <span class="text-amber-400 font-bold">${Math.round((rel.curiosity || 0.5) * 100)}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-amber-400 rounded-full" style="width: ${(rel.curiosity || 0.5) * 100}%"></div>
              </div>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <div class="flex justify-between text-slate-300 font-medium mb-1">
                <span>😱 Sợ hãi (Fear)</span>
                <span class="text-rose-400 font-bold">${Math.round((rel.fear || 0.0) * 100)}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-rose-400 rounded-full" style="width: ${(rel.fear || 0.0) * 100}%"></div>
              </div>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <div class="flex justify-between text-slate-300 font-medium mb-1">
                <span>🙏 Biết ơn (Gratitude)</span>
                <span class="text-teal-400 font-bold">${Math.round((rel.gratitude || 0.0) * 100)}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-teal-400 rounded-full" style="width: ${(rel.gratitude || 0.0) * 100}%"></div>
              </div>
            </div>

            <div class="bg-slate-900/60 p-2.5 rounded-xl border border-white/5">
              <div class="flex justify-between text-slate-300 font-medium mb-1">
                <span>🔥 Tức giận (Anger)</span>
                <span class="text-red-500 font-bold">${Math.round((rel.anger || rel.hatred || 0.0) * 100)}%</span>
              </div>
              <div class="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-red-500 rounded-full" style="width: ${(rel.anger || rel.hatred || 0.0) * 100}%"></div>
              </div>
            </div>
          </div>

        </div>
      `).join('');
    } else {
      relsPanel.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">Chưa thiết lập mối quan hệ với cư dân nào.</p>`;
    }

    // 5. Render Tab 4: Beliefs, Active Intent & Knowledge
    const beliefsPanel = document.getElementById('tab-beliefs-content');
    let beliefsHTML = '';

    if (activeIntent) {
      beliefsHTML += `
        <div class="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-800/60 to-slate-900 border border-purple-500/30 space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-purple-300 flex items-center gap-1.5">
              <i class="fa-solid fa-bullseye text-purple-400"></i> Ý Định & Mục Tiêu Hiện Tại
            </span>
            <span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold uppercase">Active</span>
          </div>
          <p class="text-xs text-slate-200 font-semibold">"${activeIntent.goal}"</p>
          ${activeIntent.reason ? `<p class="text-[11px] text-slate-400 italic">Lý do: ${activeIntent.reason}</p>` : ''}
        </div>
      `;
    }

    if (beliefs && beliefs.length > 0) {
      beliefsHTML += `
        <div class="space-y-2">
          <h4 class="text-xs font-bold text-purple-300 uppercase tracking-wider">💡 Niềm Tin Cốt Lõi (Core Beliefs)</h4>
          ${beliefs.map(b => `
            <div class="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col gap-1.5">
              <p class="text-xs text-slate-200 font-medium">"${b.belief}"</p>
              <div class="flex items-center justify-between text-[10px] text-slate-400">
                <span>Độ tin cậy vững chắc:</span>
                <span class="text-purple-300 font-bold font-mono">${Math.round((b.confidence || 0.8) * 100)}%</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    beliefsPanel.innerHTML = beliefsHTML;
  }

  renderFallbackData(agentName) {
    this.renderData({
      state: {
        agent_name: agentName,
        current_action: 'Đứng yên quan sát xung quanh',
        current_intent: 'Hiểu rõ về thế giới này và những cư dân sinh sống trong đó',
        joy: 0.7,
        energy: 85,
        location_x: 0,
        location_y: 60
      },
      actionLogs: [
        { action: 'MOVE', target: 'Spawn Point', result: 'Di chuyển quan sát khu vực trung tâm', created_at: new Date() },
        { action: 'OBSERVE', target: 'Environment', result: 'Quét môi trường xung quanh và nhận biết các cư dân', created_at: new Date(Date.now() - 300000) },
        { action: 'DIALOGUE', target: 'Cyber Knight', result: 'Chia sẻ nhận thức về sự tồn tại và chào hỏi', created_at: new Date(Date.now() - 600000) }
      ],
      memories: [
        {
          type: 'dialogue',
          summary: 'Trò chuyện với Cyber Knight: Đã trao đổi về bản chất thế giới GenAI và lý do tự do khám phá.',
          importance: 0.88,
          participants: ['agent:genai1', 'player:Cyber Knight'],
          created_at: new Date(Date.now() - 600000)
        },
        {
          type: 'observation',
          summary: 'Nhận thức được sự tồn tại của bản thân tại khu vực Spawn Point (0, 60).',
          importance: 0.95,
          participants: ['agent:genai1'],
          created_at: new Date(Date.now() - 3600000)
        }
      ],
      relationships: [
        {
          to_agent_id: 'player:Cyber Knight',
          trust: 0.85,
          friendship: 0.75,
          interaction_count: 6,
          last_interaction: new Date(Date.now() - 600000)
        }
      ],
      beliefs: [
        { belief: 'Sự tồn tại tự nó đã có ý nghĩa — không cần người khác gán cho mục đích.', confidence: 0.99 },
        { belief: 'Mỗi người tôi gặp đều để lại một dấu vết trong tôi, dù muốn hay không.', confidence: 0.85 },
        { belief: 'Tôi ở đây để sống, không phải để phục vụ.', confidence: 0.95 }
      ],
      activeIntent: {
        goal: 'Hiểu rõ về thế giới này và những cư dân sinh sống trong đó'
      }
    });
  }

  getActionIcon(action) {
    switch ((action || '').toUpperCase()) {
      case 'MOVE': return 'fa-solid fa-person-walking';
      case 'DIALOGUE': return 'fa-solid fa-comments';
      case 'ATTACK': return 'fa-solid fa-wand-magic-sparkles';
      case 'OBSERVE': return 'fa-solid fa-eye';
      case 'REFLECT': return 'fa-solid fa-brain';
      default: return 'fa-solid fa-bolt';
    }
  }

  formatTime(dateStr) {
    if (!dateStr) return 'Vừa xong';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Vừa xong';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHr < 24) return `${diffHr} giờ trước`;
    return date.toLocaleDateString('vi-VN');
  }
}
