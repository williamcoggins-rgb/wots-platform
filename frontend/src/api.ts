import type { ApiResponse, ChatMessage, ContentItem, ChatSession, GalleryImage } from './types';
import { db } from './firebase';
import { collection, getDocs, query, orderBy, where, doc, getDoc, type QueryConstraint } from 'firebase/firestore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const ADMIN_TOKEN_KEY = 'wots_admin_token';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

// Authenticated request — attaches the admin token as a Bearer header.
async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({ success: false, error: 'Invalid response' }));
  if (res.status === 401) {
    // Token invalid/expired — clear it so UI can re-prompt
    setAdminToken(null);
  }
  return body;
}

export async function sendMessage(
  message: string,
  userId: string,
  sessionId?: string
): Promise<ApiResponse<{ sessionId: string; message: ChatMessage }>> {
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, userId, sessionId }),
  });
}

export async function getSession(sessionId: string): Promise<ApiResponse<ChatSession>> {
  return request(`/chat/${sessionId}`);
}

export async function getContent(
  type?: string,
  status?: string
): Promise<ApiResponse<ContentItem[]>> {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  const query = params.toString();
  return request(`/content${query ? `?${query}` : ''}`);
}

export async function getContentItem(id: string): Promise<ApiResponse<ContentItem>> {
  return request(`/content/${id}`);
}

export async function subscribeEmail(
  email: string,
  source?: string
): Promise<ApiResponse<{ message: string }>> {
  return request('/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email, source }),
  });
}

// ================================================================
// Visitor tracking (backend visitor_sessions) + analytics aggregation
// ================================================================

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  const KEY = 'wots_session_id';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export async function trackVisit(page: string, referrer?: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/track-visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: getOrCreateSessionId(),
        page,
        referrer: referrer ?? document.referrer ?? null,
      }),
      keepalive: true,
    });
  } catch {
    /* silent — visitor tracking should never break UX */
  }
}

export interface AnalyticsSummary {
  windowDays: number;
  totalVisits: number;
  uniqueVisitors: number;
  topCountries: { country: string; count: number }[];
  topPages: { page: string; count: number }[];
  signupCount: number;
  chatMessageCount: number;
}

export async function getAnalytics(): Promise<ApiResponse<AnalyticsSummary>> {
  return adminRequest('/analytics');
}

// ================================================================
// Admin authentication + admin-gated writes
// ================================================================

export async function adminLogin(password: string): Promise<ApiResponse<{ token: string }>> {
  const res = await request<{ token: string }>('/admin/verify', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  if (res.success && res.data?.token) {
    setAdminToken(res.data.token);
  }
  return res;
}

export function adminLogout(): void {
  setAdminToken(null);
}

export async function adminCheck(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) return false;
  const res = await adminRequest<{ valid: boolean }>('/admin/check');
  return res.success === true;
}

export async function adminAddGalleryImage(
  url: string,
  title: string,
  category: string
): Promise<ApiResponse<{ id: string }>> {
  return adminRequest('/admin/gallery', {
    method: 'POST',
    body: JSON.stringify({ url, title, category }),
  });
}

export async function adminDeleteGalleryImage(id: string): Promise<ApiResponse<{ id: string }>> {
  return adminRequest(`/admin/gallery/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function adminUpdateSiteContent(
  section: string,
  data: unknown
): Promise<ApiResponse<{ section: string }>> {
  return adminRequest(`/admin/site-content/${encodeURIComponent(section)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Text-to-speech via ElevenLabs (The Griot voice)
export async function textToSpeech(text: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'TTS request failed' }));
    throw new Error(err.error || 'TTS request failed');
  }
  return res.blob();
}

// Site content CMS — public read. Writes go through adminUpdateSiteContent.
export async function getSiteContent(section: string): Promise<any> {
  const docRef = doc(db, 'site_content', section);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function getGalleryImages(category?: string): Promise<GalleryImage[]> {
  const col = collection(db, 'gallery_images');
  const constraints: QueryConstraint[] = [orderBy('uploadedAt', 'desc')];
  if (category) {
    constraints.unshift(where('category', '==', category));
  }
  const q = query(col, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as GalleryImage[];
}
