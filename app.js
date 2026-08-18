/* KATERINA SUGAR BOOKING MINI APP
   Frontend: GitHub Pages / any static hosting
   Backend: Google Apps Script Web App
   Database: Google Sheets
*/

const API_URL = 'https://script.google.com/macros/s/AKfycbzvkxBV3te_2J5itmQjvTvP9wjHpEPa95DSdgsq8avP50QaVWBLWzEROjqayYnywlBq/exec';

const DEFAULT_SETTINGS = {
  salonName: 'Sugar Katerina',
  logoUrl: '',
  slotStep: 30,
  buffer: 15,
  cancelBefore: 90,
  colors: {}
};

const state = {
  tg: window.Telegram?.WebApp || null,
  initData: '',
  user: null,
  isMaster: false,
  services: [],
  settings: DEFAULT_SETTINGS,
  schedule: [],
  selectedService: null,
  selectedDate: null,
  selectedTime: null,
  currentMonth: new Date(),
  bookings: []
};

const $ = id => document.getElementById(id);

const els = {
  salonName: $('salonName'),
  heroText: $('heroText'),
  logo: $('logo'),
  services: $('services'),
  calendar: $('calendar'),
  monthTitle: $('monthTitle'),
  prevMonth: $('prevMonth'),
  nextMonth: $('nextMonth'),
  slots: $('slots'),
  timeHint: $('timeHint'),
  form: $('bookingForm'),
  name: $('clientName'),
  phone: $('clientPhone'),
  comment: $('clientComment'),
  summary: $('summary'),
  submit: $('submitBtn'),
  successCard: $('successCard'),
  successTitle: $('successTitle'),
  successDetails: $('successDetails'),
  newBooking: $('newBooking'),
  mineBtn: $('mineBtn'),
  myBookingsCard: $('myBookingsCard'),
  myBookings: $('myBookings'),
  closeMine: $('closeMine'),
  errorBox: $('errorBox'),
  clientView: $('clientView'),
  adminView: $('adminView'),
  adminDate: $('adminDate'),
  adminCalendar: $('adminCalendar'),
  refreshAdmin: $('refreshAdmin'),
  blockStart: $('blockStart'),
  blockEnd: $('blockEnd'),
  blockReason: $('blockReason'),
  addBlock: $('addBlock'),
  manualName: $('manualName'),
  manualPhone: $('manualPhone'),
  manualService: $('manualService'),
  manualStart: $('manualStart'),
  manualComment: $('manualComment'),
  addManual: $('addManual'),
  toast: $('toast')
};

init();

async function init() {
  try {
    if (state.tg) {
      state.tg.ready();
      state.tg.expand();
      state.initData = state.tg.initData || '';
      state.user = state.tg.initDataUnsafe?.user || null;
    }

    bindEvents();

    const data = await apiPost('bootstrap', { initData: state.initData });
    applyBootstrap(data);

    renderServices();
    renderCalendar();

    if (state.isMaster) {
      showAdmin();
    }
  } catch (err) {
    showError(err.message || 'Не вдалося завантажити систему.');
  }
}

function applyBootstrap(data) {
  if (!data?.ok) throw new Error(data?.error || 'Помилка завантаження.');

  state.user = data.user || state.user;
  state.isMaster = Boolean(data.user?.isMaster);
  state.services = Array.isArray(data.services) ? data.services : [];
  state.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  state.schedule = Array.isArray(data.schedule) ? data.schedule : [];

  els.salonName.textContent = state.settings.salonName || 'Booking';
  els.heroText.textContent = 'Запишіться у зручний для Вас час';

  if (state.settings.logoUrl) {
    els.logo.src = state.settings.logoUrl;
    els.logo.classList.remove('hidden');
  }

  if (state.settings.colors) {
    const root = document.documentElement;
    Object.entries({
      primary: 'primary',
      primaryDark: 'primary-dark',
      primaryLight: 'primary-light',
      bg: 'bg',
      bgSoft: 'bg-soft',
      card: 'card',
      text: 'text',
      muted: 'muted',
      accent: 'accent',
      border: 'border'
    }).forEach(([key, css]) => {
      if (state.settings.colors[key]) root.style.setProperty(`--${css}`, state.settings.colors[key]);
    });
  }
}

function bindEvents() {
  els.prevMonth.addEventListener('click', () => changeMonth(-1));
  els.nextMonth.addEventListener('click', () => changeMonth(1));
  els.form.addEventListener('submit', submitBooking);
  els.mineBtn.addEventListener('click', loadMyBookings);
  els.closeMine.addEventListener('click', () => els.myBookingsCard.classList.add('hidden'));
  els.newBooking.addEventListener('click', resetBooking);
  els.refreshAdmin.addEventListener('click', loadAdminCalendar);
  els.adminDate.addEventListener('change', loadAdminCalendar);
  els.addBlock.addEventListener('click', addBlock);
  els.addManual.addEventListener('click', addManualBooking);
}

function renderServices() {
  els.services.innerHTML = '';

  if (!state.services.length) {
    els.services.innerHTML = '<div class="empty">Послуги ще не додані.</div>';
    return;
  }

  state.services.forEach(service => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'service-btn';
    btn.innerHTML = `
      <strong>${escapeHtml(service.name)}</strong>
      <span>${service.duration} хв · ${service.price ? `${service.price} грн` : 'ціну уточнить майстер'}</span>
    `;
    btn.addEventListener('click', () => selectService(service, btn));
    els.services.appendChild(btn);
  });

  els.manualService.innerHTML = state.services
    .map(s => `<option value="${escapeAttr(s.id)}">${escapeHtml(s.name)} — ${s.duration} хв</option>`)
    .join('');
}

function selectService(service, btn) {
  state.selectedService = service;
  state.selectedDate = null;
  state.selectedTime = null;

  document.querySelectorAll('.service-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');

  openStep('date');
  renderCalendar();
  els.slots.innerHTML = '';
  els.timeHint.textContent = 'Оберіть дату.';
  updateSummary();
}

function renderCalendar() {
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();

  els.monthTitle.textContent = state.currentMonth.toLocaleDateString('uk-UA', {
    month: 'long',
    year: 'numeric'
  });
  els.calendar.innerHTML = '';

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const mondayIndex = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < mondayIndex; i++) {
    const empty = document.createElement('button');
    empty.className = 'day-btn day-empty';
    empty.disabled = true;
    els.calendar.appendChild(empty);
  }

  const availableDates = new Set(
    state.schedule
      .filter(x => yes(x.active))
      .map(x => normalizeDate(x.date))
  );

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const iso = toIsoDate(date);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'day-btn';
    btn.textContent = day;

    const today = startOfDay(new Date());
    const disabled =
      startOfDay(date) < today ||
      !availableDates.has(iso) ||
      !state.selectedService;

    btn.disabled = disabled;

    if (state.selectedDate === iso) btn.classList.add('selected');

    btn.addEventListener('click', () => selectDate(iso));
    els.calendar.appendChild(btn);
  }
}

function changeMonth(delta) {
  const next = new Date(state.currentMonth);
  next.setMonth(next.getMonth() + delta);
  state.currentMonth = next;
  renderCalendar();
}

async function selectDate(date) {
  state.selectedDate = date;
  state.selectedTime = null;
  renderCalendar();
  openStep('time');

  els.slots.innerHTML = '<div class="empty">Завантажую вільний час…</div>';
  els.timeHint.textContent = 'Перевіряємо графік та записи.';

  try {
    const data = await apiPost('getSlots', {
      initData: state.initData,
      date,
      serviceId: state.selectedService.id
    });

    if (!data.ok) throw new Error(data.error || 'Не вдалося отримати час.');

    renderSlots(data.slots || []);
  } catch (err) {
    els.slots.innerHTML = '';
    showError(err.message);
  }
}

function renderSlots(slots) {
  els.slots.innerHTML = '';

  if (!slots.length) {
    els.timeHint.textContent = 'На цей день вільного часу немає.';
    els.slots.innerHTML = '<div class="empty">Спробуйте іншу дату.</div>';
    return;
  }

  els.timeHint.textContent = 'Оберіть зручний час:';

  slots.forEach(time => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'slot-btn';
    btn.textContent = time;
    btn.addEventListener('click', () => selectTime(time));
    els.slots.appendChild(btn);
  });
}

function selectTime(time) {
  state.selectedTime = time;
  document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
  [...els.slots.children].find(btn => btn.textContent === time)?.classList.add('selected');
  openStep('form');
  updateSummary();
}

function updateSummary() {
  if (!state.selectedService || !state.selectedDate || !state.selectedTime) {
    els.summary.classList.remove('visible');
    return;
  }

  const end = addMinutesToTime(state.selectedTime, state.selectedService.duration);
  els.summary.classList.add('visible');
  els.summary.innerHTML = `
    <strong>Ваш запис:</strong><br>
    ${escapeHtml(state.selectedService.name)}<br>
    ${formatDate(state.selectedDate)} · ${state.selectedTime}–${end}<br>
    ${state.selectedService.price ? `${state.selectedService.price} грн` : 'Ціну уточнить майстер'}
  `;
}

async function submitBooking(event) {
  event.preventDefault();
  hideError();

  if (!state.selectedService || !state.selectedDate || !state.selectedTime) {
    return showError('Оберіть послугу, дату і час.');
  }

  const name = els.name.value.trim();
  const phone = els.phone.value.trim();
  const comment = els.comment.value.trim();

  if (!name || !phone) return showError('Вкажіть ім’я та телефон.');

  els.submit.disabled = true;
  els.submit.textContent = 'Записую…';

  try {
    const data = await apiPost('createBooking', {
      initData: state.initData,
      clientName: name,
      phone,
      serviceId: state.selectedService.id,
      date: state.selectedDate,
      start: state.selectedTime,
      comment
    });

    if (!data.ok) throw new Error(data.error || 'Не вдалося створити запис.');

    const b = data.booking;
    showSuccess(b);

    if (state.tg) {
      state.tg.sendData(JSON.stringify({
        action: 'booking_created',
        bookingId: b.id
      }));
    }
  } catch (err) {
    showError(err.message || 'Помилка запису.');
  } finally {
    els.submit.disabled = false;
    els.submit.textContent = 'Підтвердити запис';
  }
}

function showSuccess(b) {
  els.successCard.classList.remove('hidden');
  els.successTitle.textContent = 'Запис підтверджено 💗';
  els.successDetails.innerHTML = `
    <strong>Послуга:</strong> ${escapeHtml(b.serviceName)}<br>
    <strong>Дата:</strong> ${formatDate(b.date)}<br>
    <strong>Час:</strong> ${b.start}–${b.end}<br>
    <strong>Вартість:</strong> ${b.price ? `${b.price} грн` : 'уточнить майстер'}
  `;
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

function resetBooking() {
  state.selectedService = null;
  state.selectedDate = null;
  state.selectedTime = null;
  els.form.reset();
  els.summary.classList.remove('visible');
  els.successCard.classList.add('hidden');
  document.querySelectorAll('.service-btn').forEach(b => b.classList.remove('selected'));
  openStep('service');
  renderCalendar();
}

async function loadMyBookings() {
  hideError();
  els.myBookingsCard.classList.remove('hidden');
  els.myBookings.innerHTML = '<div class="empty">Завантажую…</div>';

  try {
    const data = await apiPost('myBookings', { initData: state.initData });
    if (!data.ok) throw new Error(data.error || 'Не вдалося завантажити записи.');
    renderMyBookings(data.bookings || []);
  } catch (err) {
    showError(err.message);
  }
}

function renderMyBookings(bookings) {
  els.myBookings.innerHTML = '';

  if (!bookings.length) {
    els.myBookings.innerHTML = '<div class="empty">Активних записів поки немає.</div>';
    return;
  }

  bookings.forEach(b => {
    const item = document.createElement('div');
    item.className = 'booking-item';
    item.innerHTML = `
      <strong>${escapeHtml(b.serviceName)}</strong>
      <div class="booking-meta">
        ${formatDate(b.date)} · ${b.start}–${b.end}<br>
        ${b.price ? `${b.price} грн` : ''} ${b.comment ? `<br>${escapeHtml(b.comment)}` : ''}
      </div>
      <div class="booking-actions">
        <button class="secondary-btn" type="button" data-cancel="${escapeAttr(b.id)}">Скасувати</button>
      </div>
    `;
    item.querySelector('[data-cancel]').addEventListener('click', () => cancelBooking(b.id));
    els.myBookings.appendChild(item);
  });
}

async function cancelBooking(id) {
  if (!confirm('Скасувати цей запис?')) return;

  try {
    const data = await apiPost('cancelBooking', {
      initData: state.initData,
      bookingId: id
    });

    if (!data.ok) throw new Error(data.error || 'Не вдалося скасувати запис.');

    toast('Запис скасовано');
    loadMyBookings();
  } catch (err) {
    showError(err.message);
  }
}

function showAdmin() {
  els.adminView.classList.remove('hidden');
  const today = toIsoDate(new Date());
  els.adminDate.value = today;
  loadAdminCalendar();
}

async function loadAdminCalendar() {
  if (!state.isMaster) return;

  try {
    const data = await apiPost('adminCalendar', {
      initData: state.initData,
      date: els.adminDate.value
    });

    if (!data.ok) throw new Error(data.error || 'Не вдалося завантажити календар.');

    renderAdminCalendar(data);
  } catch (err) {
    showError(err.message);
  }
}

function renderAdminCalendar(data) {
  const items = [];

  (data.schedule || []).forEach(x => {
    items.push({
      time: `${x.start}–${x.end}`,
      text: 'Робочий час',
      className: 'timeline-item'
    });
  });

  (data.blocks || []).forEach(x => {
    items.push({
      time: `${x.start}–${x.end}`,
      text: `🔒 ${x.reason || 'Заблоковано'}`,
      className: 'timeline-item block-item'
    });
  });

  (data.bookings || []).forEach(x => {
    items.push({
      time: `${x.start}–${x.end}`,
      text: `👤 ${x.clientName} · ${x.serviceName}<br><span class="small">${escapeHtml(x.phone || '')}${x.comment ? `<br>${escapeHtml(x.comment)}` : ''}</span>`,
      className: 'timeline-item'
    });
  });

  items.sort((a,b) => a.time.localeCompare(b.time));

  els.adminCalendar.innerHTML = items.length
    ? items.map(x => `<div class="${x.className}"><div class="time">${x.time}</div><div>${x.text}</div></div>`).join('')
    : '<div class="empty">На цю дату поки нічого немає.</div>';
}

async function addBlock() {
  const payload = {
    initData: state.initData,
    date: els.adminDate.value,
    start: els.blockStart.value,
    end: els.blockEnd.value,
    reason: els.blockReason.value.trim()
  };

  try {
    const data = await apiPost('adminAddBlock', payload);
    if (!data.ok) throw new Error(data.error || 'Не вдалося заблокувати час.');
    els.blockStart.value = '';
    els.blockEnd.value = '';
    els.blockReason.value = '';
    toast('Час заблоковано');
    loadAdminCalendar();
  } catch (err) {
    showError(err.message);
  }
}

async function addManualBooking() {
  const payload = {
    initData: state.initData,
    date: els.adminDate.value,
    start: els.manualStart.value,
    serviceId: els.manualService.value,
    clientName: els.manualName.value.trim(),
    phone: els.manualPhone.value.trim(),
    comment: els.manualComment.value.trim()
  };

  try {
    const data = await apiPost('adminManualBooking', payload);
    if (!data.ok) throw new Error(data.error || 'Не вдалося додати запис.');
    els.manualName.value = '';
    els.manualPhone.value = '';
    els.manualStart.value = '';
    els.manualComment.value = '';
    toast('Ручний запис додано');
    loadAdminCalendar();
  } catch (err) {
    showError(err.message);
  }
}

function openStep(name) {
  const order = ['service','date','time','form'];
  const index = order.indexOf(name);

  order.forEach((step, i) => {
    $(`step-${step}`).classList.toggle('active', i <= index);
  });

  setTimeout(() => $(`step-${name}`)?.scrollIntoView({ behavior:'smooth', block:'start' }), 50);
}

async function apiPost(action, payload = {}) {
  if (!API_URL || API_URL.includes('PASTE_APPS_SCRIPT')) {
    throw new Error('У app.js ще не вказано URL Apps Script Web App.');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload })
  });

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Backend повернув не JSON. Перевір URL Apps Script Web App.');
  }
}

function yes(value) {
  return value === true || String(value).toLowerCase() === 'true' || String(value) === '1';
}

function normalizeDate(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]') return toIsoDate(value);
  return String(value).slice(0,10);
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function timeToMinutes(time) {
  const [h,m] = String(time).split(':').map(Number);
  return h*60+m;
}

function addMinutesToTime(time, minutes) {
  const total = timeToMinutes(time) + Number(minutes);
  return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}

function formatDate(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('uk-UA', {
    day:'numeric', month:'long', year:'numeric'
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, tag => ({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  }[tag]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g,'&#96;');
}

function showError(message) {
  els.errorBox.textContent = message;
  els.errorBox.classList.remove('hidden');
  els.errorBox.scrollIntoView({ behavior:'smooth', block:'center' });
}

function hideError() {
  els.errorBox.classList.add('hidden');
  els.errorBox.textContent = '';
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 2400);
}
