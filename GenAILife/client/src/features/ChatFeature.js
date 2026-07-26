import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class ChatFeature {
  constructor(app) {
    this.app = app;
    this.selectedCharacter = null;
    this.chatBubbles = new Map(); // character -> Container

    this.createChatUIOverlay();
  }

  createChatUIOverlay() {
    // Floating Chat Input Modal Overlay
    const chatModalHTML = `
      <div id="character-chat-modal" class="hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md px-4">
        <div class="glass flex flex-col gap-2.5 p-3.5 rounded-2xl" style="background:rgba(12, 20, 40, 0.95);border:1px solid rgba(0, 242, 254, 0.4);box-shadow:0 10px 40px rgba(0,0,0,0.8), 0 0 25px rgba(0,242,254,0.2)">
          
          <!-- Header Info -->
          <div class="flex items-center justify-between pb-2 border-b border-white/10">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span id="chat-target-name" class="text-xs font-bold text-cyan-300">Target Character</span>
            </div>
            <button id="btn-close-chat" class="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded-md hover:bg-white/10">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Quick Prompts / Chat Input -->
          <form id="form-send-chat" class="flex gap-2">
            <input type="text" id="input-chat-message" class="form-control text-xs py-2 px-3 flex-1" placeholder="Nhập tin nhắn trò chuyện..." required autocomplete="off" />
            <button type="submit" class="flex items-center justify-center gap-1 text-xs font-bold px-4 py-2 rounded-xl text-slate-900 cursor-pointer transition-all hover:scale-105" style="background:linear-gradient(135deg,#00f2fe,#00ff88)">
              <i class="fa-solid fa-paper-plane"></i> Gửi
            </button>
          </form>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatModalHTML);
    this.setupEvents();
  }

  setupEvents() {
    const modal = document.getElementById('character-chat-modal');
    const closeBtn = document.getElementById('btn-close-chat');
    const form = document.getElementById('form-send-chat');
    const input = document.getElementById('input-chat-message');

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      this.selectedCharacter = null;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || !this.selectedCharacter) return;

      // Display speech bubble above target character
      this.showSpeechBubble(this.selectedCharacter, text);
      input.value = '';

      const targetId = this.selectedCharacter.config ? this.selectedCharacter.config.id : null;
      const targetName = this.selectedCharacter.config ? this.selectedCharacter.config.name : 'Character';

      // Dispatch global character chat event
      window.dispatchEvent(new CustomEvent('character_chat_sent', {
        detail: {
          target: this.selectedCharacter,
          targetId: targetId,
          targetName: targetName,
          text: text
        }
      }));
    });
  }

  // 🖱️ Attach Click Event to ANY character container
  attachCharacterClick(character) {
    if (!character || !character.container) return;

    character.container.eventMode = 'static';
    character.container.cursor = 'pointer';

    character.container.on('pointerdown', (e) => {
      e.stopPropagation();
      const config = character.config || {};
      const isAiAgent = config.isAiAgent || config.name === 'GenAi1' || config.id === '00000000-0000-0000-0000-0000000000b1';

      if (isAiAgent && typeof this.onAiAgentClick === 'function') {
        this.onAiAgentClick(character);
      } else {
        this.selectCharacter(character);
      }
    });
  }

  selectCharacter(character) {
    this.selectedCharacter = character;
    const modal = document.getElementById('character-chat-modal');
    const nameEl = document.getElementById('chat-target-name');
    const input = document.getElementById('input-chat-message');

    const charName = character.config ? character.config.name : 'Character';
    nameEl.textContent = `💬 Đang trò chuyện với: ${charName}`;
    modal.classList.remove('hidden');
    input.focus();
  }

  // 💬 Display Speech Bubble above Character Overhead UI
  showSpeechBubble(character, text) {
    if (!character || !character.uiContainer) return;

    // Remove existing bubble if any
    if (this.chatBubbles.has(character)) {
      const oldBubble = this.chatBubbles.get(character);
      character.uiContainer.removeChild(oldBubble);
    }

    const bubbleContainer = new Container();
    bubbleContainer.y = -125;

    const style = new TextStyle({
      fontFamily: 'Outfit, sans-serif',
      fontSize: 11,
      fontWeight: '600',
      fill: '#ffffff',
      wordWrap: true,
      wordWrapWidth: 160
    });

    const textObj = new Text({ text, style });
    textObj.anchor.set(0.5);

    const padding = 10;
    const bgWidth = Math.max(textObj.width + padding * 2, 50);
    const bgHeight = textObj.height + padding * 1.5;

    const bg = new Graphics();
    bg.roundRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 10)
      .fill({ color: 0x0f172a, alpha: 0.95 })
      .stroke({ width: 1.5, color: 0x00f2fe });

    // Triangle pointer below bubble
    bg.poly([
      -5, bgHeight / 2,
      5, bgHeight / 2,
      0, bgHeight / 2 + 5
    ]).fill({ color: 0x00f2fe });

    bubbleContainer.addChild(bg);
    bubbleContainer.addChild(textObj);
    character.uiContainer.addChild(bubbleContainer);

    this.chatBubbles.set(character, bubbleContainer);

    // Auto fadeout bubble after 4 seconds
    setTimeout(() => {
      if (this.chatBubbles.get(character) === bubbleContainer) {
        character.uiContainer.removeChild(bubbleContainer);
        this.chatBubbles.delete(character);
      }
    }, 4000);
  }
}
