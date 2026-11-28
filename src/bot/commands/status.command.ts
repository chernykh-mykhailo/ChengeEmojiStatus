import type { CommandContext, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import type { UserService } from '../../services/user.service.js';
import { env } from '../../config/env.js';

const DAY_NAMES: Record<number, string> = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
  7: 'Нд',
};

function formatLastRotated(dateStr: string | null): string {
  if (!dateStr) return 'ще не було';
  try {
    // If dateStr doesn't have 'Z' or offset, append 'Z' because SQLite CURRENT_TIMESTAMP is UTC
    const utcStr = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : `${dateStr.replace(' ', 'T')}Z`;
    const date = new Date(utcStr);
    return new Intl.DateTimeFormat('uk-UA', {
      timeZone: env.APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function registerStatusCommand(userService: UserService) {
  return async (ctx: CommandContext<Context>) => {
    if (!ctx.from) return;

    const user = userService.getUser(ctx.from.id);
    if (!user) {
      await ctx.reply('⚠️ Ваш профіль не знайдено. Натисніть /start для реєстрації.');
      return;
    }

    const emojis = userService.getUserEmojis(ctx.from.id);
    const modeLabel = user.rotationMode === 'random' ? '🎲 Випадковий' : '🔄 По черзі';
    const accessLabel = user.accessGranted ? '✅ Надано' : '❌ Не надано (відкрийте додаток для надання)';
    const statusLabel = user.isRotationEnabled ? '🟢 Увімкнено' : '🔴 Вимкнено';

    const formattedHour = `${user.rotateHour.toString().padStart(2, '0')}:00`;
    let scheduleLabel = '';

    switch (user.frequency) {
      case 'interval':
        scheduleLabel = `⏱ Кожні ${user.intervalHours} год`;
        break;
      case 'custom_days': {
        const days = user.targetDays.map((d) => DAY_NAMES[d] || String(d)).join(', ');
        scheduleLabel = `📆 Обрані дні (${days}) о ${formattedHour}`;
        break;
      }
      case 'weekly': {
        const day = DAY_NAMES[user.targetDays[0]] || 'Пн';
        scheduleLabel = `🗓 Щотижня (${day}) о ${formattedHour}`;
        break;
      }
      case 'daily':
      default:
        scheduleLabel = `📅 Щодня о ${formattedHour}`;
        break;
    }

    const keyboard = new InlineKeyboard().webApp(
      '⚙️ Відкрити Mini App',
      env.WEBAPP_URL
    );

    const formattedLastUpdate = formatLastRotated(user.lastRotatedAt);

    const text = [
      '📊 <b>Ваш статус ротації емодзі:</b>',
      '',
      `• Дозвіл на зміну: ${accessLabel}`,
      `• Автоматична ротація: ${statusLabel}`,
      `• Режим: ${modeLabel}`,
      `• Розклад ротації: <b>${scheduleLabel}</b>`,
      `• Емодзі у списку: <b>${emojis.length}</b> шт.`,
      `• Останнє оновлення: <b>${formattedLastUpdate}</b> (${env.APP_TIMEZONE})`,
      '',
      '<i>Для зміни налаштувань скористайтеся кнопкою нижче:</i>',
    ].join('\n');

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  };
}
