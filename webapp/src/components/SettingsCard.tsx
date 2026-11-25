import React, { useState } from 'react';
import { Clock, Shuffle, ArrowRightLeft, Play, Loader2, Check, Repeat } from 'lucide-react';
import type { User, ScheduleFrequency } from '../types';
import { api } from '../api';

interface SettingsCardProps {
  user: User;
  onSettingsUpdated: (updatedUser: User) => void;
}

const DAYS = [
  { id: 1, label: 'Пн' },
  { id: 2, label: 'Вт' },
  { id: 3, label: 'Ср' },
  { id: 4, label: 'Чт' },
  { id: 5, label: 'Пт' },
  { id: 6, label: 'Сб' },
  { id: 7, label: 'Нд' },
];

export const SettingsCard: React.FC<SettingsCardProps> = ({ user, onSettingsUpdated }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Optimistic UI update: updates screen immediately (0ms), syncs to backend in background
  const applySetting = (payload: Parameters<typeof api.updateSettings>[0]) => {
    // 1. Immediate haptic feedback
    window.Telegram?.WebApp.HapticFeedback?.impactOccurred('light');

    // 2. Instant local UI update
    const previousUser = { ...user };
    const optimisticUser: User = {
      ...user,
      ...(payload.isRotationEnabled !== undefined ? { isRotationEnabled: payload.isRotationEnabled } : {}),
      ...(payload.rotationMode ? { rotationMode: payload.rotationMode } : {}),
      ...(payload.frequency ? { frequency: payload.frequency } : {}),
      ...(payload.intervalHours !== undefined ? { intervalHours: payload.intervalHours } : {}),
      ...(payload.targetDays ? { targetDays: payload.targetDays } : {}),
      ...(payload.rotateHour !== undefined ? { rotateHour: payload.rotateHour } : {}),
    };
    onSettingsUpdated(optimisticUser);

    // 3. Background network sync
    api.updateSettings(payload).then((res) => {
      onSettingsUpdated(res.user);
    }).catch((err) => {
      console.error('Failed to sync settings:', err);
      // Revert if network error
      onSettingsUpdated(previousUser);
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('error');
    });
  };

  const handleToggleDay = (dayId: number) => {
    let nextDays = [...user.targetDays];
    if (nextDays.includes(dayId)) {
      if (nextDays.length > 1) {
        nextDays = nextDays.filter((d) => d !== dayId);
      }
    } else {
      nextDays.push(dayId);
      nextDays.sort((a, b) => a - b);
    }
    applySetting({ targetDays: nextDays });
  };

  const handleTestRotation = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.triggerRotation();
      setTestResult(`Оновлено! (ID: ${res.customEmojiId.slice(0, 8)}...)`);
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('success');
      setTimeout(() => setTestResult(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Помилка';
      setTestResult(`Помилка: ${msg}`);
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/80 dark:border-zinc-800 space-y-4">
      {/* Master Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Автоматична ротація
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Змінювати статус автоматично за розкладом
          </p>
        </div>
        <button
          onClick={() => applySetting({ isRotationEnabled: !user.isRotationEnabled })}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-150 ease-in-out cursor-pointer active:scale-95 ${
            user.isRotationEnabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-150 ease-in-out ${
              user.isRotationEnabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Rotation Mode: Sequential vs Random */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-2 gap-2">
        <button
          onClick={() => applySetting({ rotationMode: 'sequential' })}
          className={`p-2.5 rounded-xl border text-xs font-medium flex items-center space-x-2 transition-all active:scale-[0.98] ${
            user.rotationMode === 'sequential'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />
          <span>По черзі</span>
        </button>

        <button
          onClick={() => applySetting({ rotationMode: 'random' })}
          className={`p-2.5 rounded-xl border text-xs font-medium flex items-center space-x-2 transition-all active:scale-[0.98] ${
            user.rotationMode === 'random'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <Shuffle className="w-4 h-4 flex-shrink-0" />
          <span>Випадково</span>
        </button>
      </div>

      {/* Frequency Tabs */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
          <Repeat className="w-3.5 h-3.5 text-blue-500" />
          <span>Періодичність зміни:</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl">
          {[
            { id: 'daily', label: 'Щодня' },
            { id: 'interval', label: 'Інтервал' },
            { id: 'custom_days', label: 'Дні тижня' },
            { id: 'weekly', label: 'Щотижня' },
          ].map((tab) => {
            const isSelected = user.frequency === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => applySetting({ frequency: tab.id as ScheduleFrequency })}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 font-semibold shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Sub-options based on Frequency */}
      {user.frequency === 'interval' && (
        <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 space-y-2">
          <span className="text-xs text-zinc-600 dark:text-zinc-400 block font-medium">
            Змінювати кожні:
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {[2, 4, 6, 12].map((hours) => (
              <button
                key={hours}
                onClick={() => applySetting({ intervalHours: hours })}
                className={`py-1.5 px-1 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                  user.intervalHours === hours
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {hours} год
              </button>
            ))}
          </div>
        </div>
      )}

      {user.frequency === 'custom_days' && (
        <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 space-y-2">
          <span className="text-xs text-zinc-600 dark:text-zinc-400 block font-medium">
            Оберіть дні тижня:
          </span>
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day) => {
              const isChecked = user.targetDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  onClick={() => handleToggleDay(day.id)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all active:scale-90 ${
                    isChecked
                      ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {user.frequency === 'weekly' && (
        <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 space-y-2">
          <span className="text-xs text-zinc-600 dark:text-zinc-400 block font-medium">
            День тижня:
          </span>
          <select
            value={user.targetDays[0] || 1}
            onChange={(e) => applySetting({ targetDays: [Number(e.target.value)] })}
            className="w-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold py-2 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:outline-none"
          >
            {DAYS.map((day) => (
              <option key={day.id} value={day.id}>
                Що{day.id === 2 ? 'вівторка' : day.id === 3 ? 'середи' : day.id === 4 ? 'четверга' : day.id === 5 ? 'п\'ятниці' : day.id === 6 ? 'суботи' : day.id === 7 ? 'неділі' : 'понеділка'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Hour Picker (shown for daily, custom_days, weekly) */}
      {user.frequency !== 'interval' && (
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Час зміни статусу:
            </span>
          </div>
          <select
            value={user.rotateHour}
            onChange={(e) => applySetting({ rotateHour: Number(e.target.value) })}
            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:outline-none"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Immediate Test Button */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
        <button
          onClick={handleTestRotation}
          disabled={testing || !user.accessGranted}
          className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all text-zinc-800 dark:text-zinc-200 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
        >
          {testing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : testResult ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{testResult}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-blue-500 fill-blue-500" />
              <span>Протестувати зміну зараз</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
