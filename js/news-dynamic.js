(function () {
  const EVENT_IMAGES = [
    'images/events/event-garden.jpg',
    'images/events/event-chalk.jpg',
    'images/events/event-balloons.jpg',
    'images/events/event-play.jpg',
    'images/events/event-reading.jpg',
  ];

  const NEWS_IMAGES = [
    'images/events/event-chalk.jpg',
    'images/events/event-play.jpg',
    'images/events/event-reading.jpg',
    'images/events/event-garden.jpg',
  ];

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function monthRu(dateStr) {
    const d = new Date(dateStr);
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Мая', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    return { day: d.getDate(), month: months[d.getMonth()] };
  }

  async function loadEvents() {
    const featured = document.getElementById('dynamic-featured-event');
    const grid = document.getElementById('dynamic-events-grid');
    if (!featured && !grid) return;

    try {
      const resp = await fetch(
        window.siteApiUrl((window.SITE_API && window.SITE_API.events) || '/api/content/events')
      );
      if (!resp.ok) return;
      const data = await resp.json();
      const items = data.items || [];
      if (!items.length) return;

      const main = items.find((e) => e.featured) || items[0];
      const rest = items.filter((e) => e.id !== main.id);

      if (featured) {
        const dt = main.event_date ? monthRu(main.event_date) : { day: '—', month: '' };
        const img = EVENT_IMAGES[0];
        featured.innerHTML = `
          <div class="featured-img">
            <img src="${img}" alt="${esc(main.title)}" loading="lazy">
          </div>
          <div class="featured-content">
            <span class="badge">${esc(main.tag || 'Событие')}</span>
            <h3>${esc(main.title)}</h3>
            <p>${esc(main.body || '')}</p>
            <div class="event-meta">
              <span>${esc(main.event_date || '')} ${esc(main.event_time || '')}</span>
              <span>${esc(main.place || '')}</span>
            </div>
            <a href="tel:89877969272" class="btn btn-white">Уточнить участие →</a>
          </div>`;
        featured.style.display = '';
      }

      if (grid && rest.length) {
        grid.innerHTML = rest
          .map((e, i) => {
            const dt = e.event_date ? monthRu(e.event_date) : { day: '—', month: '' };
            const img = EVENT_IMAGES[(i + 1) % EVENT_IMAGES.length];
            return `
              <div class="event-card fade-in visible">
                <div class="event-card-img">
                  <img src="${img}" alt="${esc(e.title)}" loading="lazy">
                </div>
                <div class="event-date-badge">
                  <span class="date-day">${dt.day}</span>
                  <span class="date-month">${dt.month}</span>
                </div>
                <div class="event-card-body">
                  <span class="event-tag">${esc(e.tag || 'Событие')}</span>
                  <h3>${esc(e.title)}</h3>
                  <p><strong>${esc(e.event_time || '')}</strong> · ${esc(e.place || '')}</p>
                  <p class="muted">${esc((e.body || '').slice(0, 160))}</p>
                </div>
              </div>`;
          })
          .join('');
      }
    } catch (_) {
      /* остаётся статическая вёрстка */
    }
  }

  async function loadNews() {
    const list = document.getElementById('dynamic-news-list');
    if (!list) return;

    try {
      const resp = await fetch(
        window.siteApiUrl((window.SITE_API && window.SITE_API.news) || '/api/content/news')
      );
      if (!resp.ok) return;
      const data = await resp.json();
      const items = data.items || [];
      if (!items.length) return;

      list.innerHTML = items
        .map(
          (n, i) => `
        <div class="news-item fade-in visible">
          <div class="news-img">
            <img src="${NEWS_IMAGES[i % NEWS_IMAGES.length]}" alt="${esc(n.title)}" loading="lazy">
          </div>
          <div class="news-content">
            <h3>${esc(n.title)}</h3>
            <p>${esc(n.body)}</p>
            <div class="news-meta">
              <span>${new Date(n.created_at).toLocaleDateString('ru-RU')}</span>
              <span>${esc(n.category || 'Новости')}</span>
            </div>
          </div>
        </div>`
        )
        .join('');
    } catch (_) {
      /* статика */
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadEvents();
      loadNews();
    });
  } else {
    loadEvents();
    loadNews();
  }
})();
