import type { ApiResponse, ChatMessage, ContentItem, ChatSession } from './types';

const API_BASE = '/api';

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
