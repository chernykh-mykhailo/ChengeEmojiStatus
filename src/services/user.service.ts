import { UserRepository } from '../database/repositories/user.repository.js';
import { EmojiRepository } from '../database/repositories/emoji.repository.js';
import { LogRepository } from '../database/repositories/log.repository.js';
import type { User, EmojiItem, UpdateSettingsInput, RotationLog } from '../types/index.js';

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private emojiRepo: EmojiRepository,
    private logRepo: LogRepository
  ) {}

  public getOrCreateUser(data: { telegramId: number; username?: string | null; firstName: string }): User {
    return this.userRepo.upsert(data);
  }

  public getUser(telegramId: number): User | null {
    return this.userRepo.getById(telegramId);
  }

  public updateAccess(telegramId: number, granted: boolean): void {
    this.userRepo.setAccessGranted(telegramId, granted);
  }

  public updateSettings(telegramId: number, settings: UpdateSettingsInput): User | null {
    return this.userRepo.updateSettings(telegramId, settings);
  }

  public getUserEmojis(userId: number): EmojiItem[] {
    return this.emojiRepo.getByUserId(userId);
  }

  public addEmoji(userId: number, customEmojiId: string, label?: string | null): EmojiItem {
    if (this.emojiRepo.exists(userId, customEmojiId)) {
      throw new Error('This custom emoji is already in your rotation list');
    }
    return this.emojiRepo.add(userId, customEmojiId, label);
  }

  public removeEmoji(userId: number, emojiId: number): boolean {
    return this.emojiRepo.delete(emojiId, userId);
  }

  public reorderEmojis(userId: number, emojiIdsInOrder: number[]): void {
    this.emojiRepo.reorder(userId, emojiIdsInOrder);
  }

  public getLogs(userId: number, limit = 20): RotationLog[] {
    return this.logRepo.getRecentLogs(userId, limit);
  }
}
