export type RotationMode = 'sequential' | 'random';
export type ScheduleFrequency = 'daily' | 'interval' | 'custom_days' | 'weekly';

export interface User {
  telegramId: number;
  username: string | null;
  firstName: string;
  isRotationEnabled: boolean;
  rotationMode: RotationMode;
  frequency: ScheduleFrequency;
  intervalHours: number; // For 'interval' mode (e.g. 2, 4, 6, 8, 12)
  targetDays: number[]; // 1 = Monday ... 7 = Sunday
  currentEmojiIndex: number;
  accessGranted: boolean;
  rotateHour: number; // 0-23 in configured timezone
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

export interface WebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface UpdateSettingsInput {
  isRotationEnabled?: boolean;
  rotationMode?: RotationMode;
  frequency?: ScheduleFrequency;
  intervalHours?: number;
  targetDays?: number[];
  rotateHour?: number;
}

export interface AppEnv {
  Variables: {
    telegramUser: WebAppUser;
  };
}
