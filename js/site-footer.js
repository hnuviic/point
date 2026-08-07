(function () {
  function renderSiteFooter() {
    const root = document.getElementById('site-footer');
    if (!root) return;

    const adminBase = (window.SITE_API && window.SITE_API.admin) || '/admin';
    const adminLogin = adminBase.replace(/\/$/, '') + '/login';
    const year = new Date().getFullYear();

    root.innerHTML =
      '<div class="container">' +
      '<div class="footer-grid">' +
      '<div class="footer-brand">' +
      '<a href="index.html" class="logo">' +
      '<img src="логотип цветной без фона.png" alt="Точка Открытий" class="logo-img" style="filter: brightness(0) invert(1); height: 40px;">' +
      '</a>' +
      '<p>Центр социальной поддержки населения. Мы помогаем создавать счастливое будущее для ваших детей с особыми потребностями.</p>' +
      '</div>' +
      '<div class="footer-col">' +
      '<h4>Разделы</h4>' +
      '<ul>' +
      '<li><a href="info.html">О центре</a></li>' +
      '<li><a href="seansy.html">Сеансы</a></li>' +
      '<li><a href="podbor.html">Подбор курса</a></li>' +
      '<li><a href="proect.html">Проекты</a></li>' +
      '<li><a href="news.html">События</a></li>' +
      '<li><a href="contact.html">Контакты</a></li>' +
      '</ul>' +
      '</div>' +
      '<div class="footer-col">' +
      '<h4>Документы</h4>' +
      '<ul>' +
      '<li><a href="docs/Ustav.pdf" data-doc="charter">Устав</a></li>' +
      '<li><a href="#" data-doc="annual-report">Публичный годовой отчёт</a></li>' +
      '<li><a href="#">Политика конфиденциальности</a></li>' +
      '</ul>' +
      '</div>' +
      '<div class="footer-col">' +
      '<h4>Контакты</h4>' +
      '<ul>' +
      '<li><a href="tel:89877969272">8 (987) 796-92-72</a></li>' +
      '<li><a href="mailto:ano.tochka56@mail.ru">ano.tochka56@mail.ru</a></li>' +
      '<li>Штаб общественной поддержки<br>г. Оренбург, ул. Цвиллинга, д. 1</li>' +
      '<li>Пн–Пт: 9:00 — 20:00</li>' +
      '</ul>' +
      '</div>' +
      '</div>' +
      '<div class="footer-bottom">' +
      '<span class="footer-copy">© ' +
      year +
      ' АНО «Точка Открытий»</span>' +
      '<a href="' +
      adminLogin +
      '" class="footer-admin-link">Вход для сотрудников</a>' +
      '</div>' +
      '</div>';

    if (typeof applySiteLinks === 'function') applySiteLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderSiteFooter);
  } else {
    renderSiteFooter();
  }
})();
