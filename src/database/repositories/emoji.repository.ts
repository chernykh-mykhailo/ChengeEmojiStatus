import { getDatabase } from '../db.js';
import type { EmojiItem } from '../../types/index.js';

interface EmojiRow {
  id: number;
  user_id: number;
  custom_emoji_id: string;
  label: string | null;
  order_index: number;
  created_at: string;
}

function mapRowToEmoji(row: EmojiRow): EmojiItem {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    customEmojiId: row.custom_emoji_id,
    label: row.label,
    orderIndex: Number(row.order_index),
    createdAt: row.created_at,
  };
}

export class EmojiRepository {
  private db = getDatabase();

  public getByUserId(userId: number): EmojiItem[] {
    const stmt = this.db.prepare(`
      SELECT * FROM emojis 
      WHERE user_id = ? 
      ORDER BY order_index ASC, id ASC
    `);
    const rows = stmt.all(userId) as unknown as EmojiRow[];
    return rows.map(mapRowToEmoji);
  }

  public getById(id: number, userId: number): EmojiItem | null {
    const stmt = this.db.prepare('SELECT * FROM emojis WHERE id = ? AND user_id = ?');
    const row = stmt.get(id, userId) as EmojiRow | undefined;
    return row ? mapRowToEmoji(row) : null;
  }

  public exists(userId: number, customEmojiId: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM emojis WHERE user_id = ? AND custom_emoji_id = ?');
    return Boolean(stmt.get(userId, customEmojiId));
  }

  public add(userId: number, customEmojiId: string, label?: string | null): EmojiItem {
    // Get highest order_index
    const maxOrderStmt = this.db.prepare('SELECT MAX(order_index) as max_order FROM emojis WHERE user_id = ?');
    const maxRow = maxOrderStmt.get(userId) as { max_order: number | null } | undefined;
    const nextOrder = (maxRow?.max_order ?? -1) + 1;

    const stmt = this.db.prepare(`
      INSERT INTO emojis (user_id, custom_emoji_id, label, order_index)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(userId, customEmojiId, label ?? null, nextOrder);
    const newId = Number(result.lastInsertRowid);

    return this.getById(newId, userId)!;
  }

  public delete(id: number, userId: number): boolean {
    const stmt = this.db.prepare('DELETE FROM emojis WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  public clearAll(userId: number): void {
    const stmt = this.db.prepare('DELETE FROM emojis WHERE user_id = ?');
    stmt.run(userId);
  }

  public reorder(userId: number, emojiIdsInOrder: number[]): void {
    const updateStmt = this.db.prepare('UPDATE emojis SET order_index = ? WHERE id = ? AND user_id = ?');
    emojiIdsInOrder.forEach((id, index) => {
      updateStmt.run(index, id, userId);
    });
  }
}
