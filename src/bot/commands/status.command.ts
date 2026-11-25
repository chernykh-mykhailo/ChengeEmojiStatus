import type { CommandContext, Context } from 'grammy';
import type { UserService } from '../../services/user.service.js';

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

    const text = [
      '📊 <b>Ваш статус ротації емодзі:</b>',
      '',
      `• Дозвіл на зміну: ${accessLabel}`,
      `• Автоматична ротація: ${statusLabel}`,
      `• Режим: ${modeLabel}`,
      `• Час щоденної зміни: ${user.rotateHour.toString().padStart(2, '0')}:00`,
      `• Емодзі у списку: <b>${emojis.length}</b> шт.`,
      `• Останнє оновлення: ${user.lastRotatedAt ? user.lastRotatedAt : 'ще не було'}`,
      '',
      '<i>Для зміни налаштувань скористайтеся /start або Mini App.</i>',
    ].join('\n');

    await ctx.reply(text, { parse_mode: 'HTML' });
  };
}
