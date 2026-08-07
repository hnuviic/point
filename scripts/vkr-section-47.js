/** § 4.7 — рефакторинг со скринами/листингами до и после */
function getSection47(C, T, nextFigure) {
  const codeFig = (title, lines) => {
    const n = nextFigure();
    return [C.codeListing(lines), C.figureCaption(`Рисунок ${n} – ${title}`)];
  };

  const statusBefore = [
    '// Ранняя версия: только флаг processed',
    'CREATE TABLE booking_requests (',
    '  id INTEGER PRIMARY KEY,',
    '  processed INTEGER DEFAULT 0  -- 0 или 1',
    ');',
    '// UI: одна кнопка «Отметить обработанным»',
  ];

  const statusAfter = [
    "status TEXT NOT NULL DEFAULT 'new',",
    'processed INTEGER NOT NULL DEFAULT 0,',
    '',
    'function nextStatus(current) {',
    "  if (current === 'new') return 'in_progress';",
    "  if (current === 'in_progress') return 'done';",
    "  return 'new';",
    '}',
    '// UI admin: цикл new → in_progress → done',
  ];

  const migrateBefore = [
    '// При изменении схемы — удалить data.sqlite и создать заново',
    'if (!fs.existsSync(dbPath)) {',
    '  initDb(); // только CREATE TABLE',
    '}',
    '// Потеря всех заявок при добавлении столбца',
  ];

  const migrateAfter = [
    'function addColumnIfMissing(table, column, columnSql) {',
    '  const cols = getTableColumns(table);',
    '  if (!cols.includes(column)) {',
    '    db.exec(`ALTER TABLE ${table} ADD COLUMN ${columnSql};`);',
    '  }',
    '}',
    'addColumnIfMissing("booking_requests", "assigned_to", ...);',
    'addColumnIfMissing("therapy_sessions", "tips_for_parents", ...);',
  ];

  return [
    C.subsectionHeading('4.7', 'Рефакторинг программного кода'),
    C.textParagraph(
      'В процессе разработки выполнен рефакторинг ключевых модулей. Ниже — два примера с листингами «до» и «после»; для наглядности в пояснительную записку включаются скриншоты админ-панели с трёхстадийными статусами и фрагменты server.js (приложение П).'
    ),

    C.textParagraph('Пример 1. Система статусов заявок', { bold: true, noIndent: true, after: 80 }),
    C.textParagraph(
      'До: поле processed (0/1). После: status (new, in_progress, done) и функции normalizeStatus, nextStatus. Эффект: координатор видит этап обработки; SQL-отчёты фильтруют по status. Скриншот таблицы заявок с колонкой «Статус» — на рисунке перед листингами.'
    ),
    ...codeFig('Структура статусов до рефакторинга', statusBefore),
    ...codeFig('Структура статусов после рефакторинга', statusAfter),

    C.textParagraph('Пример 2. Миграции без пересоздания БД', { bold: true, noIndent: true, after: 80 }),
    C.textParagraph(
      'До: пересоздание data.sqlite при каждом изменении схемы. После: addColumnIfMissing при старте server.js — добавлены therapy_sessions, parent_quiz_results, admin_audit_log без потери заявок.'
    ),
    ...codeFig('Инициализация БД до рефакторинга', migrateBefore),
    ...codeFig('Миграции addColumnIfMissing после рефакторинга', migrateAfter),

    ...T(
      'Сравнение до/после рефакторинга',
      ['Характеристика', 'До', 'После'],
      [
        ['Статусы заявок', 'processed 0/1', 'new / in_progress / done'],
        ['Новые таблицы', 'Ручной перенос', 'ALTER TABLE при старте'],
        ['Сеансы и quiz', 'Не было', 'therapy_sessions, parent_quiz_results'],
        ['Аудит', 'Нет', 'admin_audit_log'],
      ]
    ),
    C.textParagraph('Полные листинги — приложение П.'),
  ];
}

module.exports = { getSection47 };
