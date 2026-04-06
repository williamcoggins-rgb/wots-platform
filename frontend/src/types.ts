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

export interface SiteHeroContent {
  tagline: string;
  ctaPrimary: { label: string; link: string };
  ctaSecondary: { label: string; link: string };
  updatedAt: number;
}

export interface FeaturedCard {
  title: string;
  category: string;
  desc: string;
  gradient: string;
  imageCategory: string;
}

export interface SiteFeaturedContent {
  cards: FeaturedCard[];
  updatedAt: number;
}

export interface DiscoverCard {
  title: string;
  desc: string;
  borderColor: string;
  hoverBorderColor: string;
}

export interface SiteDiscoverContent {
  cards: DiscoverCard[];
  updatedAt: number;
}

export interface SiteEmailCaptureContent {
  heading: string;
  subheading: string;
  buttonText: string;
  updatedAt: number;
}
