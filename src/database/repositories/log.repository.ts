import { getDatabase } from '../db.js';
import type { RotationLog } from '../../types/index.js';

interface LogRow {
  id: number;
  user_id: number;
  custom_emoji_id: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

function mapRowToLog(row: LogRow): RotationLog {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    customEmojiId: row.custom_emoji_id,
    status: row.status as RotationLog['status'],
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export class LogRepository {
  private db = getDatabase();

  public logRotation(
    userId: number,
    customEmojiId: string,
    status: 'success' | 'failed',
    errorMessage?: string | null
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO rotation_logs (user_id, custom_emoji_id, status, error_message)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, customEmojiId, status, errorMessage ?? null);
  }

  public getRecentLogs(userId: number, limit = 20): RotationLog[] {
    const stmt = this.db.prepare(`
      SELECT * FROM rotation_logs
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT ?
    `);
    const rows = stmt.all(userId, limit) as unknown as LogRow[];
    return rows.map(mapRowToLog);
  }
}
