/**
 * Agent Memory System (Short-term & Long-term reflection)
 */
export class AgentMemory {
  constructor(agentId) {
    this.agentId = agentId;
    this.shortTermMemory = [];
    this.reflections = [];
  }

  remember(event) {
    this.shortTermMemory.push({
      timestamp: Date.now(),
      event
    });
    if (this.shortTermMemory.length > 50) {
      this.shortTermMemory.shift();
    }
  }

  reflect() {
    const summary = `Agent ${this.agentId} has ${this.shortTermMemory.length} recent events.`;
    this.reflections.push({ timestamp: Date.now(), summary });
    return summary;
  }
}
