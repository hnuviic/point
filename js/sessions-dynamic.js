(function () {
  const el = document.getElementById('sessions-list');
  if (!el) return;

  fetch(window.siteApiUrl((window.SITE_API && window.SITE_API.sessions) || '/api/content/sessions'))
    .then((r) => r.json())
    .then((data) => {
      const items = data.items || [];
      if (!items.length) {
        el.innerHTML =
          '<div class="empty-msg">Расписание скоро появится. Позвоните координатору: <a href="tel:89877969272">8 (987) 796-92-72</a> или <a href="zap.html">оставьте заявку</a>.</div>';
        return;
      }
      el.innerHTML = items
        .map(
          (s) => `
        <article class="session-card">
          <div class="session-date">${escapeHtml(s.session_date)} · ${escapeHtml(s.session_time || 'время уточняется')}</div>
          <h3>${escapeHtml(s.title)}</h3>
          <div class="session-meta">${escapeHtml(s.direction || '')}${s.specialist_name ? ' · ' + escapeHtml(s.specialist_name) : ''}</div>
          <div class="session-meta">${escapeHtml(s.place || '')} · ${s.duration_min || 45} мин</div>
          ${s.description ? `<p>${escapeHtml(s.description)}</p>` : ''}
          ${s.tips_for_parents ? `<div class="session-tips"><strong>Памятка:</strong> ${escapeHtml(s.tips_for_parents)}</div>` : ''}
        </article>`
        )
        .join('');
    })
    .catch(() => {
      el.innerHTML = '<div class="empty-msg">Не удалось загрузить расписание. Попробуйте позже или позвоните нам.</div>';
    });

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
