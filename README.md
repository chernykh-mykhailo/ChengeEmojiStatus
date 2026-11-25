# Telegram Premium Emoji Status Rotator 🔄✨

> Повноцінний Telegram-бот та Mini App для гнучкої автоматичної ротації преміум емодзі-статусу користувачів на базі **Telegram Bot API 8.0+**.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![grammY](https://img.shields.io/badge/grammY-1.35-3390ec?logo=telegram)
![Hono](https://img.shields.io/badge/Hono-4.7-e36002?logo=hono)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Основні можливості

- **Офіційна інтеграція Telegram Bot API 8.0+**:
  - Нативний запит дозволу через Mini App (`Telegram.WebApp.requestEmojiStatusAccess`). Жодних передач паролів чи сесійних рядків (StringSession).
  - Офіційне встановлення та очищення статусу через `setUserEmojiStatus`.
- **Живе відображення стікерів (Emoji Image Cache)**:
  - Автоматичне завантаження та кешування оригінальних преміум-іконок з CDN Telegram (`getCustomEmojiStickers`) прямо в інтерфейс додатку.
- **Гнучкий розклад (Rich Scheduling)**:
  - 📅 **Щодня (Daily)** — зміна у фіксовану годину (00:00 – 23:00).
  - ⏱ **Інтервал (Interval)** — ротація кожні 2, 4, 6 або 12 годин з автоматичним розрахунком `expiration_date`.
  - 📆 **Дні тижня (Custom Days)** — зміна тільки в обрані дні (наприклад, тільки у будні або тільки на вихідних).
  - 🗓 **Щотижня (Weekly)** — раз на тиждень у конкретний день.
- **Режими ротації**:
  - 🔄 **По черзі (Sequential)**
  - 🎲 **Випадковий вибір (Random)**
- **Автоматичне перехоплення емодзі**:
  - Користувачу достатньо просто надіслати будь-яке повідомлення з преміум-емодзі в чат з ботом — вони автоматично додадуться до списку.
- **Безпека**:
  - Валідація `initData` через HMAC-SHA256 (неможливо підробити запити від імені іншого користувача).
- **Модульна архітектура**:
  - Чітке розділення на `database`, `services`, `bot`, `api`, `webapp` — жодних монолітних або god-файлів.
  - База даних на вбудованому в Node.js 24 драйвері `node:sqlite` (швидкість SQLite + WAL mode без зовнішніх компіляторів).

---

## 🏗 Структура проєкту

```
├── src/
│   ├── config/              # Валідація env змінних (Zod)
│   ├── database/            # SQLite (node:sqlite, WAL, індекси)
│   │   ├── db.ts            # Схема БД та міграції
│   │   └── repositories/    # UserRepository, EmojiRepository, LogRepository
│   ├── services/            # Бізнес-логіка
│   │   ├── emoji.service.ts       # Виклики Bot API setUserEmojiStatus
│   │   ├── emoji-image.service.ts # Завантаження та кешування іконок емодзі
│   │   ├── user.service.ts        # Робота з профілем та налаштуваннями
│   │   └── scheduler.service.ts   # Щогодинний перевіряючий CRON (Croner)
│   ├── bot/                 # Telegram-бот (grammY)
│   │   ├── commands/        # /start, /status, /rotate
│   │   └── handlers/        # Перехоплювач сутностей custom_emoji
│   ├── api/                 # REST API на базі Hono
│   │   ├── middleware/      # Авторизація initData (HMAC-SHA256)
│   │   └── routes/          # Маршрути /users та /emojis
│   ├── types/               # TypeScript інтерфейси
│   └── index.ts             # Точка входу: запуск сервера, бота і планувальника
├── webapp/                  # Mini App (React 19 + TypeScript + Vite + Tailwind)
│   ├── src/components/      # Header, PermissionCard, SettingsCard, EmojiListCard, LogsCard
│   └── src/api.ts           # Типізований клієнт з x-telegram-init-data
├── Dockerfile               # Multi-stage production білд
└── docker-compose.yml       # Контейнеризація з персистентним SQLite сховищем
```

---

## 🚀 Швидкий старт

### 1. Створення бота та Mini App у Telegram
1. Відкрийте [@BotFather](https://t.me/BotFather) і створіть бота (`/newbot`). Скопіюйте токен.
2. Створіть Mini App (`/newapp`):
   - Оберіть вашого бота.
   - Вкажіть назву та опис.
   - Завантажте обкладинку 640x360 px (або надішліть `/empty`).
   - Вкажіть URL вашого додатку (публічний `https://` домен або тунель).
   - Вкажіть коротке ім'я додатку (наприклад, `app`).

### 2. Конфігурація `.env`
Створіть `.env` файл на основі `.env.example`:

```env
BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
WEBAPP_URL=https://emoji.yourdomain.com
PORT=3000
DB_PATH=./data/bot.db
APP_TIMEZONE=Europe/Kyiv
```

### 3. Запуск через Docker (Рекомендовано для сервера)

```bash
docker compose up -d --build
```
База даних зберігатиметься на хості у папці `./data` і не зникатиме при оновленнях.

---

### 4. Локальний запуск (Development)

```bash
# Встановлення залежностей
npm install
npm --prefix webapp install

# Термінал 1: Запуск сервера та бота з hot-reload
npm run dev:server

# Термінал 2: Запуск фронтенду для розробки
npm run dev:webapp
```

*Примітка для локального тесту:* Для відкриття Mini App усередині Telegram потрібен HTTPS. Можна використати тунель:
```bash
npx localtunnel --port 3000 --subdomain my-emoji-rotator
```

---

## 🔒 Безпека

* **Валідація WebApp initData:** Усі запити до `/api/users/*` та захищених методів `/api/emojis/*` перевіряються через криптографічний хеш Telegram (`HMAC_SHA256(data_check_string, secret_key)`).
* **Секрети:** Файл `.env` та файли бази даних `*.db` внесені до `.gitignore` і захищені від випадкового потрапляння в публічний доступ.

---

## 📄 Ліцензія

Проєкт розповсюджується під ліцензією [MIT](LICENSE).
