import type { UserProfileResponse, EmojiItem, User, RotationMode, ScheduleFrequency } from './types';

function getInitData(): string {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }
  return '';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const initData = getInitData();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (initData) {
    headers.set('x-telegram-init-data', initData);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  getProfile: (): Promise<UserProfileResponse> => {
    return request<UserProfileResponse>('/api/users/me');
  },

  updateAccess: (granted: boolean): Promise<{ success: boolean; accessGranted: boolean }> => {
    return request('/api/users/access', {
      method: 'POST',
      body: JSON.stringify({ granted }),
    });
  },

  updateSettings: (settings: {
    isRotationEnabled?: boolean;
    rotationMode?: RotationMode;
    frequency?: ScheduleFrequency;
    intervalHours?: number;
    targetDays?: number[];
    rotateHour?: number;
  }): Promise<{ success: boolean; user: User }> => {
    return request('/api/users/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  },

  addEmoji: (customEmojiId: string, label?: string): Promise<{ success: boolean; item: EmojiItem }> => {
    return request('/api/emojis', {
      method: 'POST',
      body: JSON.stringify({ customEmojiId, label }),
    });
  },

  deleteEmoji: (id: number): Promise<{ success: boolean }> => {
    return request(`/api/emojis/${id}`, {
      method: 'DELETE',
    });
  },

  reorderEmojis: (emojiIds: number[]): Promise<{ success: boolean }> => {
    return request('/api/emojis/reorder', {
      method: 'POST',
      body: JSON.stringify({ emojiIds }),
    });
  },

  triggerRotation: (): Promise<{ success: boolean; customEmojiId: string }> => {
    return request('/api/emojis/rotate', {
      method: 'POST',
    });
  },
};
