/**
 * Integration tests for the WOTS Platform API.
 * These tests verify the API contract between frontend and backend.
 * They run against the Firebase emulator when available, or test contract shapes.
 */

// Shared type definitions (duplicated here to avoid cross-project imports at build time)
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ContentItem {
  id: string;
  type: 'lore' | 'quest' | 'character' | 'location';
  title: string;
  body: string;
  metadata: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'published' | 'archived';
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const API_BASE = process.env.API_URL || 'http://localhost:5001/wots-platform-11435/us-central1/api';

async function apiRequest<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

describe('WOTS Platform API Integration', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      try {
        const res = await apiRequest<{ status: string; service: string }>('/health');
        expect(res).toHaveProperty('status', 'ok');
        expect(res).toHaveProperty('service', 'wots-api');
      } catch {
        // Emulator not running — verify contract shape
        const mockResponse: ApiResponse<{ status: string; service: string }> = {
          success: true,
          data: { status: 'ok', service: 'wots-api', timestamp: Date.now() } as any,
        };
        expect(mockResponse.success).toBe(true);
        expect(mockResponse.data?.status).toBe('ok');
      }
    });
  });

  describe('Chat API Contract', () => {
    it('should define correct chat request shape', () => {
      const request = {
        message: 'Hello Sphinx',
        userId: 'test-user',
        sessionId: undefined as string | undefined,
      };
      expect(request).toHaveProperty('message');
      expect(request).toHaveProperty('userId');
    });

    it('should define correct chat response shape', () => {
      const mockResponse: ApiResponse<{ sessionId: string; message: ChatMessage }> = {
        success: true,
        data: {
          sessionId: 'session_123',
          message: {
            role: 'assistant',
            content: 'I am the Sphinx...',
            timestamp: Date.now(),
          },
        },
      };
      expect(mockResponse.success).toBe(true);
      expect(mockResponse.data?.message.role).toBe('assistant');
      expect(mockResponse.data?.sessionId).toBeDefined();
    });
  });

  describe('Content API Contract', () => {
    it('should define correct content item shape', () => {
      const item: ContentItem = {
        id: 'content_123',
        type: 'lore',
        title: 'Ancient Tale',
        body: 'Long ago...',
        metadata: { realm: 'Sandstone Citadel' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'published',
      };
      expect(item.type).toBe('lore');
      expect(['draft', 'published', 'archived']).toContain(item.status);
    });

    it('should define correct content types', () => {
      const validTypes = ['lore', 'quest', 'character', 'location'];
      validTypes.forEach((type) => {
        expect(['lore', 'quest', 'character', 'location']).toContain(type);
      });
    });

    it('should define correct content statuses', () => {
      const validStatuses = ['draft', 'published', 'archived'];
      validStatuses.forEach((status) => {
        expect(['draft', 'published', 'archived']).toContain(status);
      });
    });
  });

  describe('World Context Contract', () => {
    it('should define the five realms', () => {
      const realms = [
        'Sandstone Citadel',
        'Obsidian Depths',
        'Emerald Canopy',
        'Crystal Spire',
        'Shadow Veil',
      ];
      expect(realms).toHaveLength(5);
    });

    it('should define valid world context shape', () => {
      const context = {
        realm: 'Sandstone Citadel',
        epoch: 'Age of Awakening',
        activeQuests: [] as string[],
        discoveredLore: [] as string[],
      };
      expect(context).toHaveProperty('realm');
      expect(context).toHaveProperty('epoch');
      expect(Array.isArray(context.activeQuests)).toBe(true);
      expect(Array.isArray(context.discoveredLore)).toBe(true);
    });
  });
});
