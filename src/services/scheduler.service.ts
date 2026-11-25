import { Cron } from 'croner';
import type { EmojiService } from './emoji.service.js';
import type { UserRepository } from '../database/repositories/user.repository.js';
import type { User } from '../types/index.js';
import { env } from '../config/env.js';

export class SchedulerService {
  private cronJob: Cron | null = null;
  private isProcessing = false;

  constructor(
    private emojiService: EmojiService,
    private userRepo: UserRepository
  ) {}

  public start(): void {
    if (this.cronJob) return;

    // Run at minute 0 of every hour
    this.cronJob = new Cron('0 * * * *', { timezone: env.APP_TIMEZONE }, async () => {
      await this.runHourlyCheck();
    });

    console.log(`[Scheduler] Started cron job (hourly checks in timezone ${env.APP_TIMEZONE})`);
  }

  public stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[Scheduler] Stopped cron job');
    }
  }

  public isUserDueForRotation(user: User, currentHour: number, currentDay: number): boolean {
    switch (user.frequency) {
      case 'daily':
        // Once a day at specified hour
        return currentHour === user.rotateHour;

      case 'interval':
        // Every N hours (e.g. 2, 4, 6, 8, 12)
        const interval = user.intervalHours > 0 ? user.intervalHours : 6;
        return currentHour % interval === 0;

      case 'custom_days':
        // On selected days of the week at specified hour
        return user.targetDays.includes(currentDay) && currentHour === user.rotateHour;

      case 'weekly':
        // Once a week on the selected day at specified hour
        const weeklyDay = user.targetDays.length > 0 ? user.targetDays[0] : 1;
        return currentDay === weeklyDay && currentHour === user.rotateHour;

      default:
        return currentHour === user.rotateHour;
    }
  }

  public calculateDurationSeconds(user: User): number {
    if (user.frequency === 'interval') {
      return user.intervalHours * 3600;
    }
    return 86400; // 24 hours default
  }

  public async runHourlyCheck(): Promise<void> {
    if (this.isProcessing) {
      console.warn('[Scheduler] Previous rotation job still running, skipping cycle');
      return;
    }

    this.isProcessing = true;
    try {
      const now = new Date();

      // Get current hour (0-23) in configured timezone
      const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: env.APP_TIMEZONE,
        hour: 'numeric',
        hour12: false,
      });
      const currentHour = parseInt(hourFormatter.format(now), 10);

      // Get current day of week: 1 = Monday, ..., 7 = Sunday
      const weekdayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: env.APP_TIMEZONE,
        weekday: 'short',
      });
      const dayName = weekdayFormatter.format(now);
      const dayMap: Record<string, number> = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 7,
      };
      const currentDay = dayMap[dayName] ?? 1;

      const activeUsers = this.userRepo.getAllActiveUsers();
      const usersToRotate = activeUsers.filter((user) =>
        this.isUserDueForRotation(user, currentHour, currentDay)
      );

      console.log(
        `[Scheduler] Checking hour ${currentHour}, day ${dayName} (${currentDay}): found ${usersToRotate.length} of ${activeUsers.length} user(s) to rotate`
      );

      for (const user of usersToRotate) {
        try {
          const durationSeconds = this.calculateDurationSeconds(user);
          const result = await this.emojiService.rotateUserEmoji(user.telegramId, durationSeconds);
          if (result.success) {
            console.log(
              `[Scheduler] Rotated emoji for user ${user.telegramId} (${user.frequency}) -> ${result.customEmojiId}`
            );
          } else {
            console.warn(`[Scheduler] Skipped user ${user.telegramId}: ${result.error}`);
          }
        } catch (err) {
          console.error(`[Scheduler] Unexpected error rotating user ${user.telegramId}:`, err);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
