export type RotationMode = 'sequential' | 'random';
export type ScheduleFrequency = 'daily' | 'interval' | 'custom_days' | 'weekly';

export interface User {
  telegramId: number;
  username: string | null;
  firstName: string;
  isRotationEnabled: boolean;
  rotationMode: RotationMode;
  frequency: ScheduleFrequency;
  intervalHours: number;
  targetDays: number[];
  currentEmojiIndex: number;
  accessGranted: boolean;
  rotateHour: number;
  lastRotatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmojiItem {
  id: number;
  userId: number;
  customEmojiId: string;
  label: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface RotationLog {
  id: number;
  userId: number;
  customEmojiId: string;
  status: 'success' | 'failed';
  errorMessage: string | null;
  createdAt: string;
}

export interface UserProfileResponse {
  user: User;
  emojis: EmojiItem[];
  recentLogs: RotationLog[];
}
