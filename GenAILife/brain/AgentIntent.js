/**
 * Agent Intent & Decision Maker
 */
export class AgentIntent {
  static evaluateIntent(perceptions) {
    if (perceptions.health < 30) {
      return { intent: 'RETREAT', priority: 'HIGH' };
    }
    if (perceptions.nearestEnemyDistance < 100) {
      return { intent: 'ATTACK', priority: 'HIGH' };
    }
    return { intent: 'EXPLORE', priority: 'LOW' };
  }
}
