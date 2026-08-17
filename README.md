# Booking Mini App — шаблон для реального кейсу и уроку

Архитектура: Telegram → Netlify Mini App → Netlify Function → Google Apps Script API → Google Sheets.

Прайс, тривалості, графік, buffer, правила скасування та кольори керуються через Google Sheets. Код не містить конкретного прайсу.

## Папки
- `frontend/` — UI Mini App.
- `netlify/functions/` — server-side proxy.
- `apps-script/` — backend API + робота з Sheets + Telegram.
- `docs/` — інструкції.

Для нового майстра копіюється таблиця, змінюються Settings/Services/Schedule, а frontend і backend залишаються універсальними.
