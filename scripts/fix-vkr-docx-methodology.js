/**
 * Приведение ВКР docx к требованиям методички ГАПОУ ОКЭИ (раздел 5):
 * - подписи таблиц: «Таблица N – Название» (тире –, без точки после номера)
 * - сквозная нумерация таблиц и рисунков основной части
 * - таблицы/рисунки приложений: «Таблица А.1», «Рисунок Б.1»
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const INPUT = process.env.VKR_IN || process.argv[2] || 'c:/Users/adm/Desktop/конечнварик.docx';
const OUTPUT =
  process.env.VKR_OUT || process.argv[3] || INPUT.replace(/\.docx$/i, '_по_методичке.docx');

const EN_DASH = ' – ';

function paraTexts(pXml) {
  return [...pXml.matchAll(/<w:t(?:\s+xml:space="preserve")?>([^<]*)<\/w:t>/g)].map((m) => m[1]);
}

function paraFullText(pXml) {
  return paraTexts(pXml).join('');
}

function setParaText(pXml, newText) {
  const texts = paraTexts(pXml);
  if (!texts.length) return pXml;
  let i = 0;
  return pXml.replace(/<w:t(?:\s+xml:space="preserve")?>([^<]*)<\/w:t>/g, (match, content) => {
    if (i === 0) {
      i++;
      const preserve = /xml:space="preserve"/.test(match) || /^\s|\s$/.test(newText);
      return preserve
        ? `<w:t xml:space="preserve">${escapeXml(newText)}</w:t>`
        : `<w:t>${escapeXml(newText)}</w:t>`;
    }
    i++;
    return /<w:t[^>]*xml:space="preserve"/.test(match)
      ? '<w:t xml:space="preserve"></w:t>'
      : '<w:t></w:t>';
  });
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function normalizeCaptionSeparator(caption, kind) {
  const re = new RegExp(
    `^(${kind}\\s+(?:[\\dА-ЯA-Z]+\\.\\d+|[\\dА-ЯA-Z]+))\\s*[—–−-]\\s*`,
    'u'
  );
  return caption.replace(re, `$1${EN_DASH}`);
}

function cleanTitle(title, kind) {
  let t = title.trim();
  for (let i = 0; i < 5; i++) {
    const m = t.match(
      new RegExp(`^${kind}\\s+(?:[\\dА-ЯA-Z]+\\.\\d+|[\\dА-ЯA-Z]+)\\s*[—–−-]\\s*(.+)$`, 'u')
    );
    if (!m) break;
    t = m[1].trim();
  }
  return t.replace(/\.\s*$/, '');
}

function extractTitle(caption, kind) {
  const normalized = normalizeCaptionSeparator(caption.trim(), kind);
  const prefix = new RegExp(`^${kind}\\s+(?:[\\dА-ЯA-Z]+\\.\\d+|[\\dА-ЯA-Z]+)${EN_DASH.trim()}\\s*`);
  const raw = normalized.replace(prefix, '').trim();
  return cleanTitle(raw, kind);
}

function isTableCaption(t) {
  return /^Таблица\s+/.test(t);
}

function isFigureCaption(t) {
  return /^Рисунок\s+/.test(t);
}

function isNumberedTableCaption(t) {
  return /^Таблица\s+(\d+|[А-ЯA-Z]\.\d+)\s/.test(t);
}

function isNumberedFigureCaption(t) {
  return /^Рисунок\s+(\d+|[А-ЯA-Z]\.\d+)\s/.test(t);
}

function isFalseTableCaption(t) {
  return /^Таблица\s+/.test(t) && !/^Таблица\s+(\d+|[А-ЯA-Z]\.\d+)\s/.test(t);
}

const FALSE_TABLE_FIXES = [
  [
    /^Таблица заявок занимает основную часть страницы/i,
    'Блок заявок занимает основную часть страницы',
  ],
  [
    /^Таблица существующих новостей \(ниже формы/i,
    'Список существующих новостей (ниже формы',
  ],
];

const TEXT_FIXES = [
  [/интеллект\s+\tа/gi, 'интеллекта'],
  [/4\.7\.\s+Рефакторинг/g, '4.7 Рефакторинг'],
  [/Админ-\s+панель/g, 'Админ-панель'],
  [/главная станица/gi, 'главная страница'],
  [/на прием/g, 'на приём'],
  [/Таблица\s+(\d+)\s*—\s*/g, 'Таблица $1 – '],
  [/Рисунок\s+(\d+)\s*—\s*/g, 'Рисунок $1 – '],
];

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error('Файл не найден:', INPUT);
    process.exit(1);
  }

  const zip = await JSZip.loadAsync(fs.readFileSync(INPUT));
  let xml = await zip.file('word/document.xml').async('string');

  for (const [re, rep] of TEXT_FIXES) {
    xml = xml.replace(re, rep);
  }

  const parts = xml.split(/(?=<w:p[ >])/);
  const out = [];

  let inAppendix = false;
  let appendixLetter = null;
  let mainTable = 0;
  let mainFigure = 0;
  let reviewCodeBlock = 0;
  const appendixTable = {};
  const appendixFigure = {};

  for (const part of parts) {
    if (!part.startsWith('<w:p')) {
      out.push(part);
      continue;
    }

    let p = part;
    let t = paraFullText(p).replace(/\u00A0/g, ' ').trim();

    if (/^Приложение\s+[А-ЯA-Z]\b/.test(t)) {
      inAppendix = true;
      const m = t.match(/^Приложение\s+([А-ЯA-Z])/);
      appendixLetter = m ? m[1] : appendixLetter;
    }

    if (/^(Введение|Заключение|Список использованных)/.test(t)) {
      inAppendix = false;
      appendixLetter = null;
    }

    if (isFalseTableCaption(t)) {
      for (const [re, rep] of FALSE_TABLE_FIXES) {
        if (re.test(t)) {
          t = t.replace(re, rep);
          p = setParaText(p, t);
          break;
        }
      }
      out.push(p);
      continue;
    }

    if (isNumberedTableCaption(t)) {
      const title = extractTitle(t, 'Таблица');
      const appMatch = t.match(/^Таблица\s+([А-ЯA-Z])\.(\d+)/);
      if (appMatch || (inAppendix && appendixLetter)) {
        const letter = appMatch ? appMatch[1] : appendixLetter;
        appendixTable[letter] = (appendixTable[letter] || 0) + 1;
        const num = appendixTable[letter];
        p = setParaText(p, `Таблица ${letter}.${num}${EN_DASH}${title}`);
      } else {
        mainTable += 1;
        p = setParaText(p, `Таблица ${mainTable}${EN_DASH}${title}`);
      }
      out.push(p);
      continue;
    }

    if (isNumberedFigureCaption(t)) {
      const title = extractTitle(t, 'Рисунок');
      const appMatch = t.match(/^Рисунок\s+([А-ЯA-Z])\.(\d+)/);
      if (appMatch || (inAppendix && appendixLetter)) {
        const letter = appMatch ? appMatch[1] : appendixLetter;
        appendixFigure[letter] = (appendixFigure[letter] || 0) + 1;
        const num = appendixFigure[letter];
        let figTitle = title;
        if (/^главная страница$/i.test(figTitle)) figTitle = 'Главная страница';
        p = setParaText(p, `Рисунок ${letter}.${num}${EN_DASH}${figTitle}`);
      } else {
        mainFigure += 1;
        let figTitle = title;
        if (/^Фрагмент кода до ревьюирования$/i.test(title)) {
          reviewCodeBlock += 1;
          figTitle =
            reviewCodeBlock === 1
              ? 'Фрагмент кода до ревьюирования (модуль записи)'
              : 'Фрагмент кода до ревьюирования (модуль входа)';
        } else if (/^Фрагмент кода после ревьюирования$/i.test(title)) {
          figTitle =
            reviewCodeBlock === 1
              ? 'Фрагмент кода после ревьюирования (модуль записи)'
              : 'Фрагмент кода после ревьюирования (модуль входа)';
        } else if (/^главная страница$/i.test(title)) {
          figTitle = 'Главная страница';
        }
        p = setParaText(p, `Рисунок ${mainFigure}${EN_DASH}${figTitle}`);
      }
      out.push(p);
      continue;
    }

    out.push(p);
  }

  xml = out.join('');
  zip.file('word/document.xml', xml);

  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  try {
    fs.writeFileSync(OUTPUT, buf);
    console.log('Сохранено:', OUTPUT);
  } catch (e) {
    const alt = OUTPUT.replace(/\.docx$/i, '_новый.docx');
    fs.writeFileSync(alt, buf);
    console.log('Файл занят, сохранено как:', alt);
  }

  console.log('Таблиц в основной части:', mainTable);
  console.log('Рисунков в основной части:', mainFigure);
  console.log('Таблицы приложений:', JSON.stringify(appendixTable));
  console.log('Рисунки приложений:', JSON.stringify(appendixFigure));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
