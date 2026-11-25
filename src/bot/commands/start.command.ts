import type { CommandContext, Context } from 'grammy';
import { InlineKeyboard } from 'grammy';
import type { UserService } from '../../services/user.service.js';
import { env } from '../../config/env.js';

export function registerStartCommand(userService: UserService) {
  return async (ctx: CommandContext<Context>) => {
    if (!ctx.from) return;

    const user = userService.getOrCreateUser({
      telegramId: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
    });

    const keyboard = new InlineKeyboard().webApp(
      '⚙️ Відкрити налаштування емодзі',
      env.WEBAPP_URL
    );

    const text = [
      `👋 Привіт, <b>${ctx.from.first_name}</b>!`,
      '',
      'Я бот для <b>автоматичної щоденної зміни твого Telegram Premium емодзі-статусу</b>.',
      '',
      '🔹 <b>Як це працює:</b>',
      '1. Відкрий налаштування кнопкою нижче та надай дозвіл боту змінювати емодзі-статус.',
      '2. Надішли мені сюди будь-які преміум-емодзі з повідомленням або додай їх у додатку.',
      '3. Обери час (наприклад, щодня о 09:00) та режим (по черзі чи випадковий).',
      '',
      'Усе інше я робитиму автоматично щодня!',
    ].join('\n');

    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  };
}
