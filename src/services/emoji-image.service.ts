import type { Api } from 'grammy';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

const CACHE_DIR = path.resolve(process.cwd(), 'data/emoji_cache');

export class EmojiImageService {
  constructor(private api: Api) {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  public async getEmojiImagePath(emojiId: string): Promise<{ path: string; contentType: string } | null> {
    if (!emojiId) return null;

    // Check disk cache first
    const possibleExts = ['.webp', '.png', '.jpg'];
    for (const ext of possibleExts) {
      const cachedFile = path.join(CACHE_DIR, `${emojiId}${ext}`);
      if (fs.existsSync(cachedFile)) {
        const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' ? 'image/jpeg' : 'image/webp';
        return { path: cachedFile, contentType };
      }
    }

    try {
      // Fetch custom emoji sticker info from Telegram
      const stickers = await this.api.raw.getCustomEmojiStickers({
        custom_emoji_ids: [emojiId],
      });

      if (!stickers || stickers.length === 0) {
        return null;
      }

      const sticker = stickers[0];
      // Prefer thumbnail for smaller size and fast loading, fallback to file_id
      const fileId = sticker.thumbnail?.file_id ?? sticker.file_id;
      const fileInfo = await this.api.raw.getFile({ file_id: fileId });

      if (!fileInfo.file_path) {
        return null;
      }

      const downloadUrl = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${fileInfo.file_path}`;
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        console.error(`Failed to download emoji ${emojiId} from Telegram: ${response.statusText}`);
        return null;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const ext = path.extname(fileInfo.file_path) || '.webp';
      const targetPath = path.join(CACHE_DIR, `${emojiId}${ext}`);

      fs.writeFileSync(targetPath, buffer);

      const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' ? 'image/jpeg' : 'image/webp';
      return { path: targetPath, contentType };
    } catch (err) {
      console.error(`Error fetching emoji image for ${emojiId}:`, err);
      return null;
    }
  }
}
