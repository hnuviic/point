// =============================================================================
// Гибридный режим: статика на REG.RU + API на Render
// После деплоя на Render вставьте ваш URL ниже (без слэша в конце):
//   https://ваш-сервис.onrender.com
// Для локальной разработки (npm start) оставьте пустую строку ''.
// =============================================================================
const API_BASE = '';

window.SITE_API = {
  base: API_BASE,
  contact: '/api/contact',
  booking: '/api/booking',
  chat: '/api/chat',
  sessions: '/api/content/sessions',
  events: '/api/content/events',
  news: '/api/content/news',
  questions: '/api/quiz/questions',
  quiz: '/api/quiz/submit',
  admin: API_BASE ? API_BASE + '/admin' : '/admin',
};

window.siteApiUrl = function (path) {
  const base = (window.SITE_API && window.SITE_API.base) || '';
  const p = String(path || '').startsWith('/') ? path : '/' + path;
  return base + p;
};

// Замените на ваши реальные ссылки MAX и ВКонтакте
window.SITE_LINKS = {
  max: 'https://max.ru/',
  vk: 'https://vk.com/',
};

window.SITE_DOCS = {
  charter: 'docs/Ustav.pdf',
  annualReport: '#',
};

function applySiteLinks() {
  const links = window.SITE_LINKS || {};
  document.querySelectorAll('[data-link="max"]').forEach((el) => {
    if (links.max) el.href = links.max;
  });
  document.querySelectorAll('[data-link="vk"]').forEach((el) => {
    if (links.vk) el.href = links.vk;
  });
  const docs = window.SITE_DOCS || {};
  document.querySelectorAll('[data-doc="charter"]').forEach((el) => {
    if (docs.charter) el.href = docs.charter;
  });
  document.querySelectorAll('[data-doc="annual-report"]').forEach((el) => {
    if (docs.annualReport) el.href = docs.annualReport;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applySiteLinks);
} else {
  applySiteLinks();
}
