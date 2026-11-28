import { getDatabase } from '../db.js';
import type { User, UpdateSettingsInput, ScheduleFrequency } from '../../types/index.js';

interface UserRow {
  telegram_id: number;
  username: string | null;
  first_name: string;
  is_rotation_enabled: number;
  rotation_mode: string;
  frequency?: string;
  interval_hours?: number;
  target_days?: string;
  current_emoji_index: number;
  access_granted: number;
  rotate_hour: number;
  last_rotated_at: string | null;
  created_at: string;
  updated_at: string;
}

function parseTargetDays(daysJson?: string | null): number[] {
  if (!daysJson) return [1, 2, 3, 4, 5, 6, 7];
  try {
    const parsed = JSON.parse(daysJson);
    if (Array.isArray(parsed)) return parsed.map(Number);
  } catch {}
  return [1, 2, 3, 4, 5, 6, 7];
}

function mapRowToUser(row: UserRow): User {
  return {
    telegramId: Number(row.telegram_id),
    username: row.username,
    firstName: row.first_name,
    isRotationEnabled: Boolean(row.is_rotation_enabled),
    rotationMode: row.rotation_mode as User['rotationMode'],
    frequency: (row.frequency ?? 'daily') as ScheduleFrequency,
    intervalHours: Number(row.interval_hours ?? 6),
    targetDays: parseTargetDays(row.target_days),
    currentEmojiIndex: Number(row.current_emoji_index),
    accessGranted: Boolean(row.access_granted),
    rotateHour: Number(row.rotate_hour),
    lastRotatedAt: row.last_rotated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserRepository {
  private db = getDatabase();

  public getById(telegramId: number): User | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    const row = stmt.get(telegramId) as UserRow | undefined;
    return row ? mapRowToUser(row) : null;
  }

  public upsert(data: { telegramId: number; username?: string | null; firstName: string }): User {
    const existing = this.getById(data.telegramId);
    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET username = ?, first_name = ?, updated_at = ?
        WHERE telegram_id = ?
      `);
      stmt.run(data.username ?? null, data.firstName, new Date().toISOString(), data.telegramId);
      return this.getById(data.telegramId)!;
    }

    const stmt = this.db.prepare(`
      INSERT INTO users (telegram_id, username, first_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    stmt.run(data.telegramId, data.username ?? null, data.firstName, now, now);
    return this.getById(data.telegramId)!;
  }

  public setAccessGranted(telegramId: number, granted: boolean): void {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET access_granted = ?, updated_at = ?
      WHERE telegram_id = ?
    `);
    stmt.run(granted ? 1 : 0, new Date().toISOString(), telegramId);
  }

  public updateSettings(telegramId: number, settings: UpdateSettingsInput): User | null {
    const user = this.getById(telegramId);
    if (!user) return null;

    const isRotationEnabled = settings.isRotationEnabled !== undefined 
      ? (settings.isRotationEnabled ? 1 : 0) 
      : (user.isRotationEnabled ? 1 : 0);

    const rotationMode = settings.rotationMode ?? user.rotationMode;
    const frequency = settings.frequency ?? user.frequency;
    const intervalHours = settings.intervalHours !== undefined ? settings.intervalHours : user.intervalHours;
    const targetDaysJson = settings.targetDays ? JSON.stringify(settings.targetDays) : JSON.stringify(user.targetDays);
    const rotateHour = settings.rotateHour !== undefined ? settings.rotateHour : user.rotateHour;

    const stmt = this.db.prepare(`
      UPDATE users
      SET is_rotation_enabled = ?, rotation_mode = ?, frequency = ?, interval_hours = ?, target_days = ?, rotate_hour = ?, updated_at = ?
      WHERE telegram_id = ?
    `);
    stmt.run(isRotationEnabled, rotationMode, frequency, intervalHours, targetDaysJson, rotateHour, new Date().toISOString(), telegramId);

    return this.getById(telegramId);
  }

  public updateEmojiIndex(telegramId: number, newIndex: number): void {
    const stmt = this.db.prepare(`
      UPDATE users 
      SET current_emoji_index = ?, last_rotated_at = ?, updated_at = ?
      WHERE telegram_id = ?
    `);
    const now = new Date().toISOString();
    stmt.run(newIndex, now, now, telegramId);
  }

  public getAllActiveUsers(): User[] {
    const stmt = this.db.prepare(`
      SELECT * FROM users
      WHERE is_rotation_enabled = 1 AND access_granted = 1
    `);
    const rows = stmt.all() as unknown as UserRow[];
    return rows.map(mapRowToUser);
  }
}
