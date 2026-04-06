import type { ApiResponse, ChatMessage, ContentItem, ChatSession, GalleryImage } from './types';
import { db } from './firebase';
import { collection, getDocs, query, orderBy, where, doc, getDoc, setDoc, type QueryConstraint } from 'firebase/firestore';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
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

export async function subscribeEmail(email: string): Promise<ApiResponse<{ message: string }>> {
  return request('/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// Site content CMS
export async function getSiteContent(section: string): Promise<any> {
  const docRef = doc(db, 'site_content', section);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function updateSiteContent(section: string, data: any): Promise<void> {
  const docRef = doc(db, 'site_content', section);
  await setDoc(docRef, { ...data, updatedAt: Date.now() }, { merge: true });
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
