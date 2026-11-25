import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dir = path.dirname(env.DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dbInstance = new DatabaseSync(env.DB_PATH);

  // Enable WAL mode for better concurrency and performance
  dbInstance.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      telegram_id INTEGER PRIMARY KEY,
      username TEXT,
      first_name TEXT NOT NULL,
      is_rotation_enabled INTEGER NOT NULL DEFAULT 1,
      rotation_mode TEXT NOT NULL DEFAULT 'sequential',
      frequency TEXT NOT NULL DEFAULT 'daily',
      interval_hours INTEGER NOT NULL DEFAULT 6,
      target_days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7]',
      current_emoji_index INTEGER NOT NULL DEFAULT 0,
      access_granted INTEGER NOT NULL DEFAULT 0,
      rotate_hour INTEGER NOT NULL DEFAULT 9,
      last_rotated_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS emojis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      custom_emoji_id TEXT NOT NULL,
      label TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (telegram_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_emojis_user ON emojis (user_id, order_index);

    CREATE TABLE IF NOT EXISTS rotation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      custom_emoji_id TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (telegram_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_logs_user_date ON rotation_logs (user_id, created_at);
  `);

  // Migrate existing table if columns don't exist
  try {
    dbInstance.exec("ALTER TABLE users ADD COLUMN frequency TEXT NOT NULL DEFAULT 'daily';");
  } catch {}
  try {
    dbInstance.exec('ALTER TABLE users ADD COLUMN interval_hours INTEGER NOT NULL DEFAULT 6;');
  } catch {}
  try {
    dbInstance.exec("ALTER TABLE users ADD COLUMN target_days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7]';");
  } catch {}

  return dbInstance;
}
