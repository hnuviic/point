/**
 * Генерирует js/quiz-data.js для работы теста без Node.js (статический хостинг).
 * Запуск: node scripts/export-quiz-data.js
 */
const fs = require('fs');
const path = require('path');
const { QUIZ_QUESTIONS, COURSES } = require('../lib/platform');

const out = `/* Автогенерация: node scripts/export-quiz-data.js — не правьте вручную */
(function () {
  const COURSES = ${JSON.stringify(COURSES, null, 2)};

  const QUIZ_QUESTIONS = ${JSON.stringify(QUIZ_QUESTIONS, null, 2)};

  function recommendCourse(answers) {
    const scores = { speech: 0, psychology: 0, early: 0, family: 0, diagnostics: 0 };
    QUIZ_QUESTIONS.forEach((q) => {
      const raw = answers[q.id];
      const selected = Array.isArray(raw) ? raw : raw ? [raw] : [];
      selected.forEach((val) => {
        const opt = q.options.find((o) => o.value === val);
        if (!opt || !opt.scores) return;
        Object.entries(opt.scores).forEach(([k, v]) => {
          scores[k] = (scores[k] || 0) + v;
        });
      });
    });
    const ranking = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topSlug = ranking[0]?.[0] || 'diagnostics';
    const course =
      COURSES.find((c) => c.slug === topSlug) ||
      COURSES.find((c) => c.slug === 'diagnostics') ||
      COURSES[0];
    return { course, scores, ranking };
  }

  window.QUIZ_DATA = {
    QUESTIONS: QUIZ_QUESTIONS,
    COURSES,
    recommendCourse,
  };
})();
`;

const target = path.join(__dirname, '..', 'js', 'quiz-data.js');
fs.writeFileSync(target, out, 'utf8');
console.log('Written:', target);
