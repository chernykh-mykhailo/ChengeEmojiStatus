import type { Api } from 'grammy';
import { UserRepository } from '../database/repositories/user.repository.js';
import { EmojiRepository } from '../database/repositories/emoji.repository.js';
import { LogRepository } from '../database/repositories/log.repository.js';

export interface RotationResult {
  success: boolean;
  customEmojiId?: string;
  error?: string;
}

export class EmojiService {
  constructor(
    private api: Api,
    private userRepo: UserRepository,
    private emojiRepo: EmojiRepository,
    private logRepo: LogRepository
  ) {}

  public async setStatus(
    userId: number,
    customEmojiId: string,
    expirationDate?: number
  ): Promise<boolean> {
    try {
      await this.api.raw.setUserEmojiStatus({
        user_id: userId,
        emoji_status_custom_emoji_id: customEmojiId,
        ...(expirationDate ? { emoji_status_expiration_date: expirationDate } : {}),
      });
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      // If user revoked access or is not premium
      if (errorMsg.includes('USER_NOT_MUTUAL_CONTACT') || errorMsg.includes('BOT_ACCESS_FORBIDDEN')) {
        this.userRepo.setAccessGranted(userId, false);
      }
      throw err;
    }
  }

  public async clearStatus(userId: number): Promise<boolean> {
    try {
      await this.api.raw.setUserEmojiStatus({
        user_id: userId,
        emoji_status_custom_emoji_id: '',
      });
      return true;
    } catch (err) {
      console.error(`Failed to clear emoji status for user ${userId}:`, err);
      return false;
    }
  }

  public async rotateUserEmoji(userId: number, durationSeconds?: number): Promise<RotationResult> {
    const user = this.userRepo.getById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.accessGranted) {
      return { success: false, error: 'Permission not granted by user in Mini App' };
    }

    const emojis = this.emojiRepo.getByUserId(userId);
    if (emojis.length === 0) {
      return { success: false, error: 'No custom emojis configured in user list' };
    }

    let nextIndex = 0;
    if (user.rotationMode === 'random') {
      if (emojis.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * emojis.length);
        } while (nextIndex === user.currentEmojiIndex && emojis.length > 1);
      } else {
        nextIndex = 0;
      }
    } else {
      nextIndex = (user.currentEmojiIndex + 1) % emojis.length;
    }

    const targetEmoji = emojis[nextIndex];

    try {
      const validSeconds = durationSeconds && durationSeconds > 0 ? durationSeconds : 86400;
      const expirationDate = Math.floor(Date.now() / 1000) + validSeconds;
      await this.setStatus(userId, targetEmoji.customEmojiId, expirationDate);

      this.userRepo.updateEmojiIndex(userId, nextIndex);
      this.logRepo.logRotation(userId, targetEmoji.customEmojiId, 'success');

      return { success: true, customEmojiId: targetEmoji.customEmojiId };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logRepo.logRotation(userId, targetEmoji.customEmojiId, 'failed', errorMsg);
      return { success: false, error: errorMsg };
    }
  }
}
