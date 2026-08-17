# Встановлення

## 1. Google Sheet

Створи Google Sheet → **Розширення → Apps Script**.

Встав `apps-script/Code.gs`. Запусти `setupSheets()` один раз.

## 2. Telegram Bot

Створи бота через BotFather. BOT_TOKEN збережи в Apps Script → Project Settings → Script Properties як:

`BOT_TOKEN = ...`

## 3. Telegram ID майстра

У `Settings` у рядку `MASTER_TELEGRAM_ID` постав Telegram ID майстра.

## 4. Deploy Apps Script API

**Deploy → New deployment → Web app**.

Execute as: **Me**.

Who has access: **Anyone**.

Скопіюй `/exec` URL.

## 5. Netlify

Завантаж проект у GitHub. Підключи репозиторій до Netlify.

Publish directory: `frontend`
Functions directory: `netlify/functions`

Netlify офіційно підтримує functions у `netlify/functions` і деплой разом із сайтом.

## 6. Environment variable

Netlify → Project configuration → Environment variables:

`APPS_SCRIPT_API_URL = https://script.google.com/macros/s/.../exec`

## 7. Mini App URL

Після deploy Netlify дасть URL типу:

`https://your-project.netlify.app`

У `Settings` → `WEB_APP_URL` встав цей URL.

## 8. Кнопка Telegram

Запусти Apps Script `setTelegramMenuButton()`.

## 9. Нагадування

Запусти Apps Script `setupReminderTrigger()`.

## 10. Графік

Заповнюй `Schedule` конкретними датами. Наприклад:

`2026-08-17 | 09:00 | 13:00 | TRUE`
`2026-08-17 | 15:00 | 20:00 | TRUE`

Перерви/обід — `Blocks`.

Прайс і таймінг — `Services`.

Buffer 15 хв, крок 30 хв і правило 90 хв — `Settings`.
