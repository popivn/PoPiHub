export class NetworkClient {
  constructor(onMessageCallback) {
    this.onMessageCallback = onMessageCallback;
    this.ws = null;
    this.isReady = false;
  }

  connect(userData, playerData) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to WebSocket server on port 3001
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isReady = true;

      // Send JOIN_GAME event
      this.send({
        type: 'JOIN_GAME',
        user: userData,
        player: playerData || {}
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
      } catch (err) {}
    };

    this.ws.onclose = () => {
      this.isReady = false;
      setTimeout(() => this.connect(userData, playerData), 3000);
    };
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendPosition(wx, wy, anim, scaleX) {
    this.send({
      type: 'UPDATE_POSITION',
      wx,
      wy,
      anim,
      scaleX
    });
  }

  sendAttack() {
    this.send({
      type: 'ATTACK_ACTION'
    });
  }
}
