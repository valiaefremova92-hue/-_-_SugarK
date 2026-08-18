# Katerina Sugar — Booking Mini App

Це нова версія системи бронювання за тією самою логікою, що працювала у попередньому проекті Barbie Salon.

## Архітектура

```text
Telegram
   ↓
GitHub Pages / MiroHost / будь-який статичний хостинг
   ↓
index.html + style.css + app.js
   ↓
Google Apps Script Web App
   ↓
Google Sheets
```

Frontend не залежить від GitHub. GitHub — лише один із варіантів розміщення статичних файлів.

## Файли

- `index.html` — інтерфейс Mini App
- `style.css` — дизайн
- `app.js` — логіка клієнтської частини
- `apps-script/Code.gs` — backend та робота з Google Sheets
- `assets/` — картинки/логотипи

## Таблиці

Backend читає саме ці листи:

- `Settings`
- `Services`
- `Schedule`
- `Blocks`
- `Bookings`
- `Clients`

Очікувані поля:

### Settings

`key | value`

Використовуються:

`SALON_NAME`
`MASTER_TELEGRAM_ID`
`TIMEZONE`
`SLOT_STEP_MINUTES`
`BUFFER_MINUTES`
`CANCEL_BEFORE_MINUTES`
`REMINDER_1_HOURS`
`REMINDER_2_HOURS`
`PRIMARY`
`PRIMARY_DARK`
`PRIMARY_LIGHT`
`BG`
`BG_SOFT`
`CARD`
`TEXT`
`MUTED`
`ACCENT`
`BORDER`
`SALON_LOGO_URL`
`WEB_APP_URL`

### Services

`id | name | price | duration | type | active | sort`

### Schedule

`date | start | end | active`

### Blocks

`id | date | start | end | reason | createdAt`

### Bookings

`id | telegramId | clientName | phone | serviceId | serviceName | date | start | end | duration | status | comment | createdAt | updatedAt | reminder24Sent | reminder2Sent`

### Clients

`telegramId | name | phone | firstSeen | lastSeen | bookingsCount`

## 1. Apps Script

Створи Apps Script, прив'язаний до цієї Google таблиці.

Скопіюй `apps-script/Code.gs`.

У Script Properties створи:

- `BOT_TOKEN` — токен Telegram-бота
- `SPREADSHEET_ID` — ID Google таблиці

Для `SPREADSHEET_ID` можна виконати `spreadsheetIdSetup()`.

## 2. Deploy Apps Script

Deploy → New deployment → Web app.

Налаштування:

- Execute as: Me
- Who has access: Anyone

Потрібен саме стабільний URL:

`https://script.google.com/macros/s/.../exec`

Не використовуй `/dev` у Telegram.

## 3. Frontend

У `app.js` знайди:

```js
const API_URL = 'PASTE_APPS_SCRIPT_EXEC_URL_HERE';
```

і встав URL `/exec`.

Після цього завантаж:

- `index.html`
- `style.css`
- `app.js`
- папку `assets`

на GitHub Pages або інший статичний хостинг.

## 4. Telegram

У `Settings` заповни:

`WEB_APP_URL = https://твій-frontend-домен/...`

Після цього виконай в Apps Script:

`setTelegramMenuButton()`

## 5. Нагадування

В Apps Script один раз виконай:

`setupReminderTrigger()`

Він створить тригер кожні 5 хвилин.

## 6. Логіка

Клієнт:

1. відкриває Mini App у Telegram;
2. backend перевіряє Telegram `initData`;
3. завантажуються послуги та графік із Sheets;
4. клієнт обирає послугу;
5. бачить тільки дати, які є в `Schedule`;
6. backend рахує доступні слоти;
7. `Blocks` блокують час;
8. `Bookings` блокують вже зайнятий час;
9. створюється запис у `Bookings`;
10. клієнт додається/оновлюється в `Clients`;
11. Telegram отримує повідомлення про запис.

Майстер:

- бачить календар;
- бачить записи;
- може блокувати час;
- може додавати ручний запис.

## Важливо

`BookingAnswers` не використовується в цій базовій версії, тому його можна залишити в таблиці без змін. Якщо пізніше додамо анкету перед записом, підключимо його окремим модулем.

Не клади BOT_TOKEN у `app.js` або GitHub. Він має залишатися тільки в Script Properties.
