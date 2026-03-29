export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  context: WorldContext;
}

export interface WorldContext {
  realm: string;
  epoch: string;
  activeQuests: string[];
  discoveredLore: string[];
}

export interface ContentItem {
  id: string;
  type: 'lore' | 'quest' | 'character' | 'location';
  title: string;
  body: string;
  metadata: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'published' | 'archived';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  category: 'hero' | 'characters' | 'environments' | 'covers' | 'misc';
  uploadedAt: number;
}
