import { buildContentItem } from '../pipeline';

describe('Pipeline', () => {
  describe('buildContentItem', () => {
    it('should build a content item with generated fields', () => {
      const item = buildContentItem({
        type: 'lore',
        title: 'Test Lore',
        body: 'Test body text',
        metadata: { realm: 'Sandstone Citadel' },
      });
      expect(item.id).toMatch(/^content_/);
      expect(item.status).toBe('draft');
      expect(item.title).toBe('Test Lore');
      expect(item.type).toBe('lore');
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });
  });
});
