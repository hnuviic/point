const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph } = require('docx');
const C = require('./vkr-doc-common');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'vkr');

function pageBlock(title, rows) {
  return [
    C.textParagraph(title, { bold: true, noIndent: true, after: 80 }),
    C.dataTable(['Элемент', 'Описание'], rows),
    new Paragraph({ spacing: { after: 160 }, children: [] }),
  ];
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let tbl = 20;
  let fig = 18;
  const T = (title, h, rows, opts) => {
    const n = tbl++;
    return [C.tableCaption(`Таблица ${n} – ${title}`), C.dataTable(h, rows, opts)];
  };
  const F = (content, title) => {
    const n = fig++;
    const block = Array.isArray(content) ? C.wireframe(content) : content;
    return [block, C.figureCaption(`Рисунок ${n} – ${title}`)];
  };
  const TC = (title, data) => {
    const n = tbl++;
    return [
      C.tableCaption(`Таблица ${n} – ${title}`),
      C.testCaseTable(data),
      new Paragraph({ spacing: { after: 200 }, children: [] }),
    ];
  };

  const publicPages = [
    [
      'index.html — главная страница',
      [
        ['Файл стилей', 'style.css — hero-блок, карточки, статистика, адаптивная сетка'],
        ['Скрипты', 'js/news-dynamic.js (события с API), js/ai-chat.js (виджет), js/site-config.js'],
        ['Разделы', 'Hero, «О центре», события, команда, CTA, футер'],
        ['Навигация', 'Единое меню: О центре, Проекты, События, Контакты, Записаться'],
        ['Формы', 'Кнопки перехода на zap.html и info.html'],
        ['Дизайн', 'Палитра #145867 / #C22660, шрифты Space Grotesk и Inter, glass-эффект шапки'],
        ['Код', 'Приложение П (фрагмент index.html)'],
      ],
    ],
    [
      'info.html — страница «О центре»',
      [
        ['Файл стилей', 'info.css'],
        ['Содержание', 'Миссия, ценности, карточки команды специалистов, этапы работы'],
        ['Медиа', 'images/team/*.jpg — фото сотрудников'],
        ['Функции', 'Информирование о квалификации персонала, навыках (PECS, АВА и др.)'],
        ['Формы', 'Ссылки на contact.html и zap.html'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'proect.html — страница «Проекты»',
      [
        ['Файл стилей', 'proect.css'],
        ['Содержание', 'Карточки проектов: ресурсный класс, консультирование семей, «Ранний старт», «Уроки доброты»'],
        ['Интерактив', 'Фильтрация по категориям (образование, социальная поддержка, партнёрские)'],
        ['Функции', 'Представление активных и партнёрских программ центра'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'proect-konsult.html — проект «Консультирование семей»',
      [
        ['Файл стилей', 'proect.css / info.css'],
        ['Содержание', 'Детальное описание бесплатных консультаций для семей с детьми с ООП'],
        ['Функции', 'Информирование о порядке получения помощи, CTA на запись'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'news.html — страница «События и новости»',
      [
        ['Файл стилей', 'news.css'],
        ['Скрипты', 'js/news-dynamic.js — загрузка из /api/content/events и /api/content/news'],
        ['Динамика', 'Контейнеры #dynamic-featured-event, #dynamic-events-grid, #dynamic-news-list'],
        ['Fallback', 'При недоступности API отображается статическая вёрстка'],
        ['Код', 'Приложение П, js/news-dynamic.js'],
      ],
    ],
    [
      'contact.html — страница «Контакты»',
      [
        ['Файл стилей', 'contact.css'],
        ['Форма', '#contactForm → POST /api/contact (name, phone, email, topic, message, consent)'],
        ['Блоки', 'Карточки телефона, email, адреса, режима работы; ссылки MAX/VK через site-config.js'],
        ['Скрипты', 'Обработчик submit, ai-chat.js'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'zap.html — страница «Запись на приём»',
      [
        ['Файл стилей', 'zap.css'],
        ['Форма', '#bookingForm → POST /api/booking'],
        ['Поля', 'name, phone, child_name, direction, desired_date, comment, consent'],
        ['UX', 'После успеха скрывается форма, показывается #successMessage'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'seansy.html — страница «Сеансы»',
      [
        ['Файл стилей', 'seansy.css'],
        ['Скрипт', 'js/sessions-dynamic.js — GET /api/content/sessions'],
        ['Содержание', 'Памятка «Путь семьи», карточки ближайших сеансов, CTA на podbor и zap'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'podbor.html — страница «Подбор курса»',
      [
        ['Файл стилей', 'podbor.css'],
        ['Скрипт', 'js/quiz.js — GET /api/quiz/questions, POST /api/quiz/submit'],
        ['Содержание', '5 вопросов, прогресс-бар, экран рекомендации направления'],
        ['БД', 'parent_quiz_results, courses'],
        ['Код', 'Приложение П'],
      ],
    ],
  ];

  const adminPages = [
    [
      'admin-login.ejs — вход в систему',
      [
        ['Маршрут', 'GET/POST /admin/login'],
        ['Функции', 'Аутентификация bcrypt, создание сессии adminUser'],
        ['Форма', 'username, password'],
        ['Стили', 'admin/assets/admin.css'],
        ['Код', 'Приложение П (server.js, views/admin-login.ejs)'],
      ],
    ],
    [
      'admin-home.ejs — кабинет сотрудника',
      [
        ['Маршрут', 'GET /admin/home'],
        ['Функции', 'Дашборд: статистика новостей, событий, заявок, библиотеки'],
        ['Роли', 'Набор карточек зависит от role (admin, coordinator, specialist)'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'admin.ejs — список заявок',
      [
        ['Маршрут', 'GET /admin'],
        ['Функции', 'Просмотр contact + booking; смена status; assign специалиста; заметки'],
        ['Ограничения', 'specialist видит только назначенные booking'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'admin-news.ejs — управление новостями',
      [
        ['Маршрут', 'GET/POST /admin/news, toggle published'],
        ['Роли', 'admin, coordinator'],
        ['Таблица БД', 'site_news'],
        ['Алгоритм', 'Рисунок 12; flowchart-content-admin.html (приложение Д)'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'admin-events.ejs — управление событиями',
      [
        ['Маршрут', 'GET/POST /admin/events'],
        ['Поля', 'title, body, event_date, event_time, place, tag, featured'],
        ['Таблица БД', 'site_events'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'admin-reports.ejs — отчёты о мероприятиях',
      [
        ['Маршрут', 'GET/POST /admin/reports'],
        ['Таблица БД', 'site_reports'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'admin-library.ejs — методическая библиотека',
      [
        ['Маршрут', 'GET/POST /admin/library, approve'],
        ['Роли', 'specialist добавляет; coordinator/admin модерирует'],
        ['Таблица БД', 'library_materials (status: pending/approved)'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'admin-users.ejs — пользователи',
      [
        ['Маршрут', 'GET/POST /admin/users'],
        ['Роль доступа', 'Только admin'],
        ['Функции', 'Создание учётных записей с ролями admin/coordinator/specialist'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'admin-sessions.ejs — расписание сеансов',
      [
        ['Маршрут', 'GET/POST /admin/sessions'],
        ['Роли', 'admin, coordinator'],
        ['Таблица БД', 'therapy_sessions'],
        ['Публикация', 'GET /api/content/sessions → seansy.html'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'admin-quiz.ejs — результаты теста родителей',
      [
        ['Маршрут', 'GET /admin/quiz'],
        ['Роли', 'admin, coordinator'],
        ['Таблица БД', 'parent_quiz_results'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'admin-audit.ejs — журнал аудита',
      [
        ['Маршрут', 'GET /admin/audit'],
        ['Роль', 'Только admin'],
        ['Таблица БД', 'admin_audit_log'],
        ['Код', 'Приложение П'],
      ],
    ],
    [
      'admin-analytics.ejs — аналитика',
      [
        ['Маршрут', 'GET /admin/analytics'],
        ['Роли', 'admin, coordinator'],
        ['Функции', 'Сводки по заявкам и контенту'],
        ['Код', 'Приложение П'],
      ],
    ],
  ];

  const children = [
    C.sectionHeading('4', 'Рабочий проект'),
    C.subsectionHeading('4.1', 'Описание веб-приложения'),

    C.textParagraph(
      'Раздел описывает реализованное веб-приложение ВИСЗ-АНО-ТО: веб-дизайн, состав страниц и динамический контент. Реализация выполнена в соответствии с макетами технического задания (глава 2) с использованием дизайн-системы проекта (design-system.html).'
    ),

    C.pointHeading('4.1.1', 'Описание веб-дизайна приложения'),
    C.textParagraph(
      'Дизайн построен на фирменной палитре (#145867, #C22660, #FAFBFC), шрифтах Space Grotesk и Inter. Страницы адаптированы от 320 px. Для родителей — простой язык, крупные заголовки, контраст WCAG 2.1 AA, отключение анимаций при prefers-reduced-motion: родитель читает сайт за ребёнка и принимает решение о записи.'
    ),
    ...F(
      [
        'Шапка: логотип + навигация + кнопка «Записаться»',
        'Hero: заголовок, описание, статистика 10+/500+/30+',
        'Карточки услуг, блок событий (динамика), команда, футер',
        'Виджет чат-помощника (правый нижний угол)',
      ],
      'Реализованный дизайн главной страницы'
    ),

    C.pointHeading('4.1.2', 'Описание веб-страниц приложения'),
    C.textParagraph(
      'Публичная часть включает 9 HTML-страниц; административная — 13 EJS-шаблонов (сеансы, quiz, audit, analytics). Скриншоты интерфейса — рисунки 16–25; полный листинг — приложение П.'
    ),
    C.textParagraph('Публичные страницы', { bold: true, noIndent: false, after: 80 }),
    ...publicPages.flatMap(([title, rows]) => pageBlock(title, rows)),
    C.textParagraph('Страницы административной панели', { bold: true, noIndent: false, after: 80 }),
    ...adminPages.flatMap(([title, rows]) => pageBlock(title, rows)),

    C.pointHeading('4.1.3', 'Описание динамического контента'),
    C.textParagraph(
      'Динамический контент: js/news-dynamic.js, js/sessions-dynamic.js, js/quiz.js, js/ai-chat.js; формы contact/zap; EJS admin-панель. Код — приложение П.'
    ),
    ...T(
      'Файлы динамического контента',
      ['Файл', 'Назначение', 'Источник данных'],
      [
        ['js/news-dynamic.js', 'События и новости', 'site_events, site_news'],
        ['js/sessions-dynamic.js', 'Расписание seansy.html', 'therapy_sessions'],
        ['js/quiz.js', 'Тест podbor.html', '/api/quiz/*, courses'],
        ['js/ai-chat.js', 'Чат-помощник', '/api/chat'],
        ['contact.html, zap.html', 'Формы', '/api/contact, /api/booking'],
        ['views/admin*.ejs', 'Кабинет', 'SQLite через server.js'],
      ]
    ),
    C.textParagraph(
      'Приложение развёрнуто на Reg.ru (http://pointdiscovery.online/), данные локализованы в РФ. Приёмка — приложение М.'
    ),

    ...require('./vkr-section-42').getSection42(T, F),

    ...require('./vkr-section-43').getSection43(C, T, F),

    ...require('./vkr-section-44').getSection44(C, T, F),

    ...require('./vkr-section-45').getSection45(C, T, () => fig++),

    C.subsectionHeading('4.6', 'Ревьюирование программного кода'),
    ...require('./vkr-section-46').getSection46(C, () => fig++),

    ...require('./vkr-section-47').getSection47(C, T, () => fig++),

    ...require('./vkr-section-48').getSection48(C, T, TC),
  ];

  const doc = new Document({ sections: [C.makeSection(children)] });
  const outFile = path.join(OUT_DIR, 'Глава_4_Рабочий_проект.docx');
  const buffer = await Packer.toBuffer(doc);
  await C.writeDoc(outFile, buffer);
  const desktopCopy = path.join(process.env.USERPROFILE || '', 'Desktop', 'Глава_4_Рабочий_проект_обновлено.docx');
  try {
    fs.copyFileSync(outFile, desktopCopy);
    console.log('Copied:', desktopCopy);
  } catch (_) {
    /* ignore */
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
