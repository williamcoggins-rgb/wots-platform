import { createNewSession } from '../assistant';

describe('Assistant', () => {
  describe('createNewSession', () => {
    it('should create a new session with defaults', () => {
      const session = createNewSession('user123');
      expect(session.userId).toBe('user123');
      expect(session.messages).toEqual([]);
      expect(session.context.realm).toBe('Sandstone Citadel');
      expect(session.context.epoch).toBe('Age of Awakening');
      expect(session.context.activeQuests).toEqual([]);
      expect(session.context.discoveredLore).toEqual([]);
      expect(session.id).toMatch(/^session_/);
    });
  });
});
