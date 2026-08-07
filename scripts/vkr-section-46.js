/** Раздел 4.6 — ревьюирование программного кода (рисунки 21–24) */
function getSection46(C, nextFigure) {
  const codeFig = (title, lines) => {
    const n = nextFigure();
    return [C.codeListing(lines), C.figureCaption(`Рисунок ${n} – ${title}`)];
  };

  const bookingBefore = [
    "app.post('/api/booking', (req, res) => {",
    '  const { name, phone, comment } = req.body;',
    '  const sql = "INSERT INTO booking_requests (name, phone, comment)',
    '    VALUES (\'" + name + "\', \'" + phone + "\', \'" + comment + "\')";',
    '  db.exec(sql);',
    "  res.send('Заявка принята');",
    '});',
  ];

  const bookingAfter = [
    "app.post('/api/booking', (req, res) => {",
    '  const { name, phone, child_name, direction, desired_date, comment, consent } = req.body || {};',
    '  if (!name || !phone) {',
    "    return res.status(400).json({ error: 'Поля name и phone обязательны' });",
    '  }',
    '  const record = {',
    '    created_at: new Date().toISOString(), processed: 0, status: \'new\',',
    '    name: String(name).trim(), phone: String(phone).trim(),',
    '    child_name: child_name ? String(child_name).trim() : null,',
    '    consent: consent ? 1 : 0, ip: req.ip || null, user_agent: req.get(\'user-agent\') || null,',
    '  };',
    '  if (record.consent !== 1) {',
    "    return res.status(400).json({ error: 'Нужно подтвердить согласие…' });",
    '  }',
    '  const info = db.prepare(`INSERT INTO booking_requests (...) VALUES (...)`).run(record);',
    '  res.json({ ok: true, id: info.lastInsertRowid });',
    '});',
  ];

  const loginBefore = [
    "app.post('/admin/login', (req, res) => {",
    '  const { username, password } = req.body;',
    '  const row = db',
    "    .prepare('SELECT * FROM admin_users WHERE username = ? AND password = ?')",
    '    .get(username, password);',
    '  if (row) {',
    '    req.session.user = username;',
    "    res.redirect('/admin');",
    '  } else {',
    "    res.send('Ошибка входа');",
    '  }',
    '});',
  ];

  const loginAfter = [
    "app.post('/admin/login', (req, res) => {",
    '  const { username, password } = req.body || {};',
    '  const login = String(username || \'\');',
    "  const row = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(login);",
    '  if (!row) {',
    '    return res.status(401).render(\'admin-login\', {',
    "      error: 'Неверные данные входа', username: login });",
    '  }',
    '  const ok = bcrypt.compareSync(String(password || \'\'), row.password_hash);',
    '  if (!ok) {',
    '    return res.status(401).render(\'admin-login\', {',
    "      error: 'Неверные данные входа', username: login });",
    '  }',
    '  req.session.adminUser = { id: row.id, username: row.username, role: row.role, full_name: row.full_name };',
    '  return res.redirect(adminRedirectAfterLogin(row.role));',
    '});',
  ];

  return [
    C.textParagraph(
      'В рамках обеспечения качества разработанного информационно-сервисного портала «Точка Открытий» был проведён систематический процесс ревьюирования программного кода. Данная процедура выполнялась на всех этапах разработки: после создания новых модулей, перед интеграцией функционала в основную ветку репозитория и перед финальным развёртыванием системы. Целью ревью являлось выявление потенциальных уязвимостей, оптимизация производительности, обеспечение читаемости кода и соответствие принятым в проекте стандартам разработки.'
    ),
    C.textParagraph(
      'Процесс ревьюирования осуществлялся последовательно, начиная со статического анализа кода с использованием инструментов ESLint и Prettier для автоматического выявления синтаксических ошибок, несоответствий стилю и потенциально опасных конструкций. Затем проводилась проверка безопасности, включающая анализ запросов к базе данных на предмет уязвимостей к инъекциям, верификацию механизмов аутентификации и авторизации, а также контроль обработки пользовательского ввода. Далее следовала оценка архитектуры и модульности, в ходе которой проверялось соблюдение принципа единственной ответственности, отсутствие дублирования кода и корректность разделения клиентской и серверной логики. Завершающим этапом стал анализ читаемости и поддерживаемости, охватывающий оценку осмысленности имён переменных и функций, наличия комментариев к сложным участкам кода и соответствия проектной документации.'
    ),

    C.textParagraph('Пример 1. Модуль онлайн-записи на услугу (POST /api/booking)', { bold: true, noIndent: true, after: 120 }),
    C.textParagraph(
      'Был проанализирован фрагмент программного кода, реализующий обработку формы онлайн-записи на услугу (страница zap.html). Ниже приведена учебная реконструкция ранней версии обработчика (до ревьюирования) и актуальная реализация в server.js (после ревьюирования).'
    ),
    ...codeFig('Фрагмент кода до ревьюирования (модуль записи)', bookingBefore),
    C.textParagraph(
      'При проверке выявлено несколько критических замечаний, требующих устранения. Формирование SQL-запроса через прямую конкатенацию строк создавало прямую угрозу SQL-инъекций, позволяя злоумышленнику манипулировать базой данных. Отсутствовала валидация входящих данных (обязательные поля, согласие на обработку персональных данных), что допускало сохранение некорректных записей и сбои в бизнес-логике. Обработка ошибок сводилась к общему текстовому ответу без указания HTTP-статусов, что нарушало принципы построения RESTful API. Кроме того, не фиксировались служебные реквизиты заявки (дата создания, IP, User-Agent, статус new), что затрудняло работу координатора в админ-панели.'
    ),
    ...codeFig('Фрагмент кода после ревьюирования (модуль записи)', bookingAfter),
    C.textParagraph(
      'В результате ревьюирования программный код приведён к использованию prepared statements (better-sqlite3), явной валидации name, phone и consent, структурированного объекта record, ответа JSON с кодом 400 при ошибках и полями status/processed для последующей маршрутизации заявок в модуле /admin.'
    ),

    C.textParagraph('Пример 2. Модуль аутентификации сотрудников (POST /admin/login)', { bold: true, noIndent: true, after: 120 }),
    C.textParagraph(
      'Второй проанализированный фрагмент относится к входу в административную панель. До ревьюирования допускалось сравнение пароля в открытом виде и хранение идентификатора сессии без ролевой модели; после ревьюирования применены bcrypt и объект adminUser в сессии.'
    ),
    ...codeFig('Фрагмент кода до ревьюирования (модуль входа)', loginBefore),
    C.textParagraph(
      'Замечания ревью: сравнение password в SQL-запросе (риск утечки при компрометации БД); отсутствие HTTP 401 и единого шаблона ошибки; в сессии сохранялся только username без role и id, что делало невозможным корректное применение middleware requireRole; отсутствие хеширования паролей при создании пользователей противоречило требованиям защиты персональных данных сотрудников.'
    ),
    ...codeFig('Фрагмент кода после ревьюирования (модуль входа)', loginAfter),
    C.textParagraph(
      'После ревьюирования: пароль проверяется через bcrypt.compareSync по полю password_hash; при ошибке возвращается статус 401 и render admin-login.ejs; в req.session.adminUser сохраняются id, username, role, full_name; редирект учитывает роль (adminRedirectAfterLogin). Создание учётных записей в /admin/users также использует bcrypt.hashSync.'
    ),
    C.textParagraph(
      'По итогам ревью зафиксированы рекомендации к доработке в следующих итерациях: добавить серверную проверку формата телефона (regex) для /api/contact и /api/booking; устранить дублирование FAQ чата между server.js и js/ai-chat.js. Полные листинги модулей — приложение П.'
    ),
  ];
}

module.exports = { getSection46 };
