const fs = require('fs');
const {
  Paragraph,
  TextRun,
  AlignmentType,
  PageNumber,
  Footer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  LineRuleType,
  VerticalAlign,
} = require('docx');

/** ГАПОУ ОКЭИ, СТП 101-00 / раздел 5.3 методички */
const FONT = 'Times New Roman';
const SIZE_BODY = 28; // 14 pt
const SIZE_SECTION = 32; // 16 pt — заголовки разделов
const SIZE_SUBSECTION = 28; // 14 pt — заголовки подразделов
const SIZE_APPENDIX = 32; // 16 pt — «Приложение А»
const SIZE_SMALL = 28; // 14 pt
const INDENT = 850; // 15 mm
const LINE = 240; // одинарный интервал
const SP_AFTER_HEADING = 300; // ~15 mm после заголовка до текста
const SP_BEFORE_SECTION = 480; // ~20 mm между разделами

const border = { style: BorderStyle.SINGLE, size: 1, color: '000000' };
const borders = { top: border, bottom: border, left: border, right: border };

const PAGE_MARGINS = {
  top: 1134, // 20 mm
  right: 567, // 10 mm
  bottom: 1134,
  left: 1134, // 20 mm (поле под рамку ГОСТ)
};

function textParagraph(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: {
      line: LINE,
      lineRule: LineRuleType.AUTO,
      after: opts.after ?? 0,
      before: opts.before ?? 0,
    },
    indent: opts.noIndent ? undefined : { firstLine: opts.hanging ? 0 : INDENT },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.size ?? SIZE_BODY,
        bold: !!opts.bold,
        italics: !!opts.italics,
      }),
    ],
  });
}

/** Раздел: «1 Название» — с абзацного отступа, 16 pt */
function sectionHeading(number, title) {
  return textParagraph(`${number} ${title}`, {
    bold: true,
    noIndent: false,
    size: SIZE_SECTION,
    before: SP_BEFORE_SECTION,
    after: SP_AFTER_HEADING,
  });
}

/** Подраздел: «3.1 Название» — 14 pt */
function subsectionHeading(number, title) {
  return textParagraph(`${number} ${title}`, {
    bold: true,
    noIndent: false,
    size: SIZE_SUBSECTION,
    before: 360,
    after: SP_AFTER_HEADING,
  });
}

/** Подпункт: «3.1.1 Название» */
function pointHeading(number, title) {
  return subsectionHeading(number, title);
}

/** «Таблица 1 – Название» — слева, с абзацного отступа, над таблицей */
function tableCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE, lineRule: LineRuleType.AUTO, before: 120, after: 120 },
    indent: { firstLine: INDENT },
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY })],
  });
}

/** «Рисунок 1 – Название» — под рисунком, с абзацного отступа */
function figureCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE, lineRule: LineRuleType.AUTO, before: 120, after: 240 },
    indent: { firstLine: INDENT },
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY })],
  });
}

function cell(text, opts = {}) {
  const align =
    opts.center ? AlignmentType.CENTER : opts.left ? AlignmentType.LEFT : AlignmentType.JUSTIFIED;
  return new TableCell({
    borders,
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opts.colSpan,
    rowSpan: opts.rowSpan,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: align,
        spacing: { line: LINE, lineRule: LineRuleType.AUTO },
        indent: { firstLine: 0 },
        children: [
          new TextRun({
            text,
            font: FONT,
            size: opts.header ? SIZE_BODY : SIZE_SMALL,
            bold: !!opts.header,
          }),
        ],
      }),
    ],
  });
}

/** Ячейка с подписью сверху и значением снизу (блок «Процесс тестирования») */
function stackedCell(label, value, opts = {}) {
  return new TableCell({
    borders,
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opts.colSpan,
    rowSpan: opts.rowSpan,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [
      new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { line: LINE, lineRule: LineRuleType.AUTO, after: 40 },
        indent: { firstLine: 0 },
        children: [
          new TextRun({
            text: label,
            font: FONT,
            size: SIZE_BODY,
            bold: !!opts.header,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: LINE, lineRule: LineRuleType.AUTO },
        indent: { firstLine: 0 },
        children: [new TextRun({ text: value, font: FONT, size: SIZE_SMALL })],
      }),
    ],
  });
}

function dataTable(headers, rows, opts = {}) {
  const headerAlign = opts.headerCenter !== false;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((h) => cell(h, { header: true, center: headerAlign })),
      }),
      ...rows.map((row) =>
        new TableRow({
          children: row.map((c, i) =>
            cell(c, {
              center: opts.numericCols?.includes(i),
            })
          ),
        })
      ),
    ],
  });
}

function bulletList(items) {
  return items.map((item) =>
    textParagraph(`– ${item}`, { noIndent: false, after: 0 })
  );
}

function wireframe(lines) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: lines.map((line) => new TableRow({ children: [cell(line, { center: false })] })),
  });
}

const CODE_FONT = 'Courier New';
const SIZE_CODE = 20; // 10 pt

/** Листинг программного кода для раздела ревьюирования */
function codeListing(lines) {
  const rows = lines.map((line) =>
    new TableRow({
      children: [
        new TableCell({
          borders,
          margins: { top: 20, bottom: 20, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { line: 220, lineRule: LineRuleType.AUTO },
              indent: { firstLine: 0 },
              children: [
                new TextRun({
                  text: line === '' ? ' ' : line,
                  font: CODE_FONT,
                  size: SIZE_CODE,
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

function orgDiagram() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [cell('Руководитель организации АНО «Точка Открытий»', { header: true, colSpan: 3 })],
      }),
      new TableRow({
        children: [
          cell('Профильные специалисты\n(психологи, дефектологи, логопеды)', { header: true }),
          cell('Администрация\n(координатор, бухгалтер, SMM)', { header: true }),
          cell('Партнёрские проекты\n(школы, НКО-партнёры)', { header: true }),
        ],
      }),
      new TableRow({
        children: [
          cell(
            'Направления: диагностика; консультирование семей; групповая терапия; ресурсные классы.',
            { center: false }
          ),
          cell('Функции: приём обращений; запись; публикация новостей; финансовый учёт.', {
            center: false,
          }),
          cell('Программы: «Ранний старт»; «Уроки доброты»; педагогическая навигация.', {
            center: false,
          }),
        ],
      }),
    ],
  });
}

function usersDiagram() {
  return dataTable(
    ['Категория', 'Роль', 'Функции'],
    [
      ['Родитель', 'Гость', 'Просмотр информации; запись; обратная связь; чат-помощник'],
      ['Педагог / партнёр', 'Гость', 'Проекты; сотрудничество; события'],
      ['Координатор', 'coordinator', 'Заявки; новости; события; отчёты'],
      ['Специалист', 'specialist', 'Назначенные записи; библиотека'],
      ['Администратор', 'admin', 'Пользователи; полный доступ'],
    ]
  );
}

function dbTable(name, rows) {
  return [
    tableCaption(`Таблица – Структура «${name}»`),
    dataTable(['Поле', 'Тип', 'Ограничения', 'Описание'], rows),
    new Paragraph({ spacing: { after: 200 }, children: [] }),
  ];
}

function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: LINE, lineRule: LineRuleType.AUTO },
        children: [new TextRun({ font: FONT, size: SIZE_BODY, children: [PageNumber.CURRENT] })],
      }),
    ],
  });
}

function makeSection(children) {
  return {
    properties: { page: { margin: PAGE_MARGINS } },
    footers: { default: makeFooter() },
    children,
  };
}

/** Таблица тест-кейса — 4 колонки, как в методичке ОКЭИ (см. образец CheckTask) */
function testCaseTable({
  url = 'http://localhost:3000',
  executor = 'Козина Я.М.',
  priority = 'Высокий',
  processName,
  steps,
  expected,
  actual,
}) {
  const stepsText = String(steps).replace(/\s*\n+\s*/g, '; ');
  const expectedText = /^Ожидаемый/i.test(expected)
    ? expected
    : `Ожидаемый результат: ${expected}`;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [2800, 2187, 2187, 2186],
    rows: [
      new TableRow({
        children: [
          cell('Ссылка на веб-приложение', { header: true, left: true }),
          cell('Процесс тестирования', { header: true, colSpan: 3, center: true }),
        ],
      }),
      new TableRow({
        children: [
          cell(url, { left: true }),
          stackedCell('Исполнитель', executor),
          stackedCell('Уровень важности', priority),
          stackedCell('Название процесса', processName),
        ],
      }),
      new TableRow({
        children: [
          cell('Пошаговые действия', { header: true, left: true }),
          cell('Ожидаемый результат', { header: true, colSpan: 3, left: true }),
        ],
      }),
      new TableRow({
        children: [
          cell(stepsText, { left: true }),
          cell(expectedText, { colSpan: 3, left: true }),
        ],
      }),
      new TableRow({
        children: [cell('Полученный результат', { header: true, colSpan: 4, left: true })],
      }),
      new TableRow({
        children: [cell(actual, { colSpan: 4, left: true })],
      }),
    ],
  });
}

function appendixBlock(letter, status, title, bodyChildren) {
  return [
    textParagraph(`Приложение ${letter}`, {
      center: true,
      bold: true,
      noIndent: true,
      size: SIZE_APPENDIX,
      after: 120,
    }),
    textParagraph(`(${status})`, {
      center: true,
      bold: true,
      italics: true,
      noIndent: true,
      size: SIZE_BODY,
      after: 120,
    }),
    textParagraph(title, {
      center: true,
      bold: true,
      noIndent: true,
      size: SIZE_BODY,
      after: 240,
    }),
    ...bodyChildren,
  ];
}

const DB_TABLES = {
  contact_requests: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор обращения'],
    ['created_at', 'TEXT', 'NOT NULL', 'Дата и время создания (ISO 8601)'],
    ['processed', 'INTEGER', 'DEFAULT 0', 'Признак обработки (0/1)'],
    ['status', 'TEXT', 'DEFAULT new', 'Статус: new, in_progress, done'],
    ['name', 'TEXT', 'NOT NULL', 'ФИО отправителя'],
    ['phone', 'TEXT', 'NOT NULL', 'Контактный телефон'],
    ['email', 'TEXT', 'NULL', 'Адрес электронной почты'],
    ['topic', 'TEXT', 'NULL', 'Тема обращения'],
    ['message', 'TEXT', 'NULL', 'Текст сообщения'],
    ['consent', 'INTEGER', 'DEFAULT 0', 'Согласие на обработку ПДн (0/1)'],
    ['ip', 'TEXT', 'NULL', 'IP-адрес клиента'],
    ['user_agent', 'TEXT', 'NULL', 'User-Agent браузера'],
    ['assigned_to', 'INTEGER', 'NULL, FK→admin_users', 'Ответственный сотрудник'],
    ['admin_note', 'TEXT', 'NULL', 'Служебная заметка администратора'],
  ],
  booking_requests: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор заявки на запись'],
    ['created_at', 'TEXT', 'NOT NULL', 'Дата и время создания'],
    ['processed', 'INTEGER', 'DEFAULT 0', 'Признак обработки (0/1)'],
    ['status', 'TEXT', 'DEFAULT new', 'Статус: new, in_progress, done'],
    ['name', 'TEXT', 'NOT NULL', 'ФИО родителя / представителя'],
    ['phone', 'TEXT', 'NOT NULL', 'Контактный телефон'],
    ['child_name', 'TEXT', 'NULL', 'Имя ребёнка'],
    ['direction', 'TEXT', 'NULL', 'Направление (логопед, психолог и т.д.)'],
    ['desired_date', 'TEXT', 'NULL', 'Желаемая дата приёма'],
    ['comment', 'TEXT', 'NULL', 'Комментарий клиента'],
    ['consent', 'INTEGER', 'DEFAULT 0', 'Согласие на обработку ПДн'],
    ['ip', 'TEXT', 'NULL', 'IP-адрес клиента'],
    ['user_agent', 'TEXT', 'NULL', 'User-Agent браузера'],
    ['assigned_to', 'INTEGER', 'NULL, FK→admin_users', 'Назначенный специалист'],
    ['specialist_note', 'TEXT', 'NULL', 'Заметка специалиста'],
  ],
  admin_users: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор пользователя'],
    ['username', 'TEXT', 'NOT NULL, UNIQUE', 'Логин для входа'],
    ['password_hash', 'TEXT', 'NOT NULL', 'Хеш пароля (bcrypt)'],
    ['role', 'TEXT', 'DEFAULT admin', 'Роль: admin, coordinator, specialist'],
    ['full_name', 'TEXT', 'NULL', 'ФИО сотрудника'],
    ['created_at', 'TEXT', 'NOT NULL', 'Дата создания учётной записи'],
  ],
  site_news: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор новости'],
    ['title', 'TEXT', 'NOT NULL', 'Заголовок'],
    ['body', 'TEXT', 'NOT NULL', 'Текст новости'],
    ['category', 'TEXT', 'NULL', 'Категория'],
    ['published', 'INTEGER', 'DEFAULT 0', 'Признак публикации (0/1)'],
    ['created_at', 'TEXT', 'NOT NULL', 'Дата создания'],
    ['updated_at', 'TEXT', 'NULL', 'Дата последнего изменения'],
    ['author_id', 'INTEGER', 'NULL, FK→admin_users', 'Автор публикации'],
  ],
  site_events: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор события'],
    ['title', 'TEXT', 'NOT NULL', 'Название мероприятия'],
    ['body', 'TEXT', 'NULL', 'Описание'],
    ['event_date', 'TEXT', 'NULL', 'Дата проведения'],
    ['event_time', 'TEXT', 'NULL', 'Время проведения'],
    ['place', 'TEXT', 'NULL', 'Место проведения'],
    ['tag', 'TEXT', 'NULL', 'Метка / категория'],
    ['published', 'INTEGER', 'DEFAULT 0', 'Признак публикации'],
    ['featured', 'INTEGER', 'DEFAULT 0', 'Выделение на главной'],
    ['created_at', 'TEXT', 'NOT NULL', 'Дата создания'],
    ['updated_at', 'TEXT', 'NULL', 'Дата изменения'],
    ['author_id', 'INTEGER', 'NULL, FK→admin_users', 'Автор'],
  ],
  site_reports: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор отчёта'],
    ['title', 'TEXT', 'NOT NULL', 'Заголовок отчёта'],
    ['body', 'TEXT', 'NOT NULL', 'Текст отчёта о мероприятии'],
    ['published', 'INTEGER', 'DEFAULT 0', 'Признак публикации'],
    ['created_at', 'TEXT', 'NOT NULL', 'Дата создания'],
    ['author_id', 'INTEGER', 'NULL, FK→admin_users', 'Автор'],
  ],
  library_materials: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор материала'],
    ['title', 'TEXT', 'NOT NULL', 'Название материала'],
    ['description', 'TEXT', 'NULL', 'Краткое описание'],
    ['link', 'TEXT', 'NULL', 'Ссылка на файл или ресурс'],
    ['status', 'TEXT', 'DEFAULT pending', 'Статус: pending, approved, rejected'],
    ['created_at', 'TEXT', 'NOT NULL', 'Дата добавления'],
    ['author_id', 'INTEGER', 'NULL, FK→admin_users', 'Автор / загрузивший'],
  ],
  therapy_sessions: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор сеанса'],
    ['title', 'TEXT', 'NOT NULL', 'Название занятия'],
    ['description', 'TEXT', 'NULL', 'Краткое описание'],
    ['session_date', 'TEXT', 'NOT NULL', 'Дата проведения'],
    ['session_time', 'TEXT', 'NULL', 'Время начала'],
    ['duration_min', 'INTEGER', 'DEFAULT 45', 'Длительность (мин.)'],
    ['direction', 'TEXT', 'NULL', 'Направление (логопед, психолог и т.д.)'],
    ['place', 'TEXT', 'DEFAULT кабинет', 'Место проведения'],
    ['specialist_id', 'INTEGER', 'NULL, FK→admin_users', 'Ответственный специалист'],
    ['max_slots', 'INTEGER', 'DEFAULT 1', 'Число мест'],
    ['tips_for_parents', 'TEXT', 'NULL', 'Памятка для родителей'],
    ['status', 'TEXT', 'DEFAULT scheduled', 'Статус: scheduled, cancelled, done'],
    ['published', 'INTEGER', 'DEFAULT 1', 'Признак публикации (0/1)'],
    ['created_at', 'TEXT', 'NOT NULL', 'Дата создания записи'],
    ['author_id', 'INTEGER', 'NULL, FK→admin_users', 'Автор / редактор'],
  ],
  courses: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор курса / направления'],
    ['title', 'TEXT', 'NOT NULL', 'Название направления'],
    ['slug', 'TEXT', 'NOT NULL, UNIQUE', 'URL-идентификатор'],
    ['description', 'TEXT', 'NULL', 'Описание программы'],
    ['age_min', 'INTEGER', 'NULL', 'Минимальный возраст'],
    ['age_max', 'INTEGER', 'NULL', 'Максимальный возраст'],
    ['tags', 'TEXT', 'NULL', 'Теги для подбора (JSON / CSV)'],
    ['icon', 'TEXT', 'NULL', 'Иконка / метка'],
    ['published', 'INTEGER', 'DEFAULT 1', 'Признак публикации (0/1)'],
    ['sort_order', 'INTEGER', 'DEFAULT 0', 'Порядок вывода на сайте'],
  ],
  parent_quiz_results: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор результата теста'],
    ['created_at', 'TEXT', 'NOT NULL', 'Дата и время прохождения'],
    ['parent_name', 'TEXT', 'NULL', 'Имя родителя (опционально)'],
    ['child_age', 'TEXT', 'NULL', 'Возраст ребёнка'],
    ['answers_json', 'TEXT', 'NULL', 'Ответы на вопросы (JSON)'],
    ['recommended_course_id', 'INTEGER', 'NULL, FK→courses', 'Рекомендованное направление'],
    ['recommended_title', 'TEXT', 'NULL', 'Название рекомендации для экрана'],
    ['score_json', 'TEXT', 'NULL', 'Баллы по категориям (JSON)'],
    ['ip', 'TEXT', 'NULL', 'IP-адрес клиента'],
  ],
  admin_audit_log: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор записи журнала'],
    ['created_at', 'TEXT', 'NOT NULL', 'Дата и время действия'],
    ['user_id', 'INTEGER', 'NULL, FK→admin_users', 'Идентификатор сотрудника'],
    ['username', 'TEXT', 'NULL', 'Логин на момент действия'],
    ['action', 'TEXT', 'NOT NULL', 'Тип операции (login, update, delete…)'],
    ['entity_type', 'TEXT', 'NULL', 'Тип сущности (session, news, user…)'],
    ['entity_id', 'INTEGER', 'NULL', 'Идентификатор изменённой записи'],
    ['details', 'TEXT', 'NULL', 'Дополнительные сведения (JSON)'],
  ],
  chat_logs: [
    ['id', 'INTEGER', 'PK, AUTOINCREMENT', 'Идентификатор диалога'],
    ['created_at', 'TEXT', 'NOT NULL', 'Дата и время запроса'],
    ['message', 'TEXT', 'NOT NULL', 'Текст вопроса пользователя'],
    ['reply', 'TEXT', 'NULL', 'Ответ чат-помощника'],
    ['source', 'TEXT', 'NULL', 'Источник (страница, модуль)'],
    ['ip', 'TEXT', 'NULL', 'IP-адрес клиента'],
  ],
};

async function writeDoc(outFile, buffer) {
  try {
    fs.writeFileSync(outFile, buffer);
  } catch (err) {
    if (err.code === 'EBUSY') {
      const alt = outFile.replace('.docx', '_новый.docx');
      fs.writeFileSync(alt, buffer);
      console.warn('Файл занят, сохранено как:', alt);
      return;
    }
    throw err;
  }
  console.log('Created:', outFile);
}

module.exports = {
  writeDoc,
  FONT,
  SIZE_BODY,
  INDENT,
  LINE,
  textParagraph,
  sectionHeading,
  subsectionHeading,
  pointHeading,
  tableCaption,
  figureCaption,
  dataTable,
  bulletList,
  wireframe,
  codeListing,
  testCaseTable,
  orgDiagram,
  usersDiagram,
  dbTable,
  makeSection,
  appendixBlock,
  DB_TABLES,
};
