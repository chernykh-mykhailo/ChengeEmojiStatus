import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Loader2 } from 'lucide-react';
import { api } from '../api';

interface PermissionCardProps {
  accessGranted: boolean;
  onAccessUpdated: (granted: boolean) => void;
}

export const PermissionCard: React.FC<PermissionCardProps> = ({ accessGranted, onAccessUpdated }) => {
  const [loading, setLoading] = useState(false);

  const handleRequestPermission = () => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      alert('Telegram WebApp SDK не знайдено (відкрийте у Telegram).');
      return;
    }

    setLoading(true);

    if (typeof tg.requestEmojiStatusAccess === 'function') {
      tg.requestEmojiStatusAccess(async (granted: boolean) => {
        try {
          await api.updateAccess(granted);
          onAccessUpdated(granted);
          if (granted) {
            tg.HapticFeedback?.notificationOccurred('success');
          } else {
            tg.HapticFeedback?.notificationOccurred('warning');
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      });
    } else {
      setLoading(false);
      alert('Метод requestEmojiStatusAccess не підтримується вашим клієнтом Telegram (потрібен Telegram з підтримкою Bot API 8.0+).');
    }
  };

  if (accessGranted) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              Доступ до статусу активний
            </h3>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
              Бот має офіційний дозвіл змінювати ваш емодзі-статус.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
          <KeyRound className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Надайте дозвіл на зміну емодзі
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
            Telegram вимагає разового підтвердження від вас, щоб бот міг щодня встановлювати новий емодзі-статус.
          </p>
          <button
            onClick={handleRequestPermission}
            disabled={loading}
            className="mt-3.5 w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all text-white text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm shadow-blue-500/20 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Надати дозвіл Telegram</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
