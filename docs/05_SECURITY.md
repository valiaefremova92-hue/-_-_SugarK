# Безпека

Telegram рекомендує передавати `Telegram.WebApp.initData` на backend і перевіряти його до використання. У шаблоні перевірка робиться в Apps Script через HMAC-SHA-256 і `BOT_TOKEN`.

Додатково кожен admin endpoint перевіряє `MASTER_TELEGRAM_ID`.

Не покладай BOT_TOKEN у GitHub, frontend або Netlify public files.

У продакшені заміни `PASTE_MASTER_TELEGRAM_ID`, перевір нагадування і протестуй доступ звичайного Telegram акаунта.
