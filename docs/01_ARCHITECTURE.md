# Архітектура для уроку

**Frontend:** Netlify

**Proxy:** Netlify Function `/api/booking`

**Backend:** Google Apps Script Web App (`doPost`)

**Database / admin data:** Google Sheets

### Чому так

Ти показуєш у реальному кейсі нормальний frontend-хостинг, але не втрачаєш зручність Google Sheets як панелі керування.

Browser не звертається напряму до Apps Script. Він викликає same-origin `/api/booking`, а Netlify Function передає запит server-to-server у Apps Script.

Telegram `initData` передається до backend і там перевіряється. `initDataUnsafe` не використовується як доказ особи.
