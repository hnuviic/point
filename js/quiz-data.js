/* Автогенерация: node scripts/export-quiz-data.js — не правьте вручную */
(function () {
  const COURSES = [
  {
    "slug": "speech",
    "title": "Логопед / дефектолог",
    "description": "Коррекция речи, альтернативная коммуникация (PECS, АВА), занятия с дефектологом.",
    "age_min": 2,
    "age_max": 18,
    "tags": "речь,логопед,PECS,АВА",
    "icon": "🗣️",
    "sort_order": 1
  },
  {
    "slug": "psychology",
    "title": "Психологическая поддержка",
    "description": "Работа с эмоциями, адаптация, арт-терапия, групповые и индивидуальные консультации.",
    "age_min": 3,
    "age_max": 18,
    "tags": "психолог,эмоции,арт-терапия",
    "icon": "🧠",
    "sort_order": 2
  },
  {
    "slug": "early",
    "title": "Раннее развитие",
    "description": "Занятия для малышей до 3 лет: моторика, коммуникация, сенсорная интеграция.",
    "age_min": 0,
    "age_max": 3,
    "tags": "раннее развитие,малыши",
    "icon": "🌱",
    "sort_order": 3
  },
  {
    "slug": "family",
    "title": "Поддержка родителей",
    "description": "Семейное консультирование, супервизия, мастер-классы для родителей.",
    "age_min": 0,
    "age_max": 18,
    "tags": "семья,родители,консультация",
    "icon": "👨‍👩‍👧",
    "sort_order": 4
  },
  {
    "slug": "diagnostics",
    "title": "Комплексная диагностика",
    "description": "Первичное обследование, составление индивидуального маршрута помощи ребёнку.",
    "age_min": 0,
    "age_max": 18,
    "tags": "диагностика,маршрут",
    "icon": "📋",
    "sort_order": 5
  }
];

  const QUIZ_QUESTIONS = [
  {
    "id": "age",
    "question": "Сколько лет вашему ребёнку?",
    "type": "single",
    "options": [
      {
        "value": "0-2",
        "label": "До 2 лет",
        "scores": {
          "early": 3,
          "diagnostics": 2
        }
      },
      {
        "value": "2-3",
        "label": "2–3 года",
        "scores": {
          "early": 4,
          "speech": 2,
          "diagnostics": 2
        }
      },
      {
        "value": "3-6",
        "label": "3–6 лет",
        "scores": {
          "speech": 3,
          "psychology": 2,
          "early": 1
        }
      },
      {
        "value": "7-12",
        "label": "7–12 лет",
        "scores": {
          "speech": 2,
          "psychology": 3
        }
      },
      {
        "value": "13+",
        "label": "13 лет и старше",
        "scores": {
          "psychology": 3,
          "family": 2
        }
      }
    ]
  },
  {
    "id": "concerns",
    "question": "Что беспокоит вас больше всего? (можно несколько)",
    "type": "multi",
    "options": [
      {
        "value": "speech",
        "label": "Речь и коммуникация",
        "scores": {
          "speech": 4
        }
      },
      {
        "value": "behavior",
        "label": "Поведение и эмоции",
        "scores": {
          "psychology": 4
        }
      },
      {
        "value": "social",
        "label": "Общение со сверстниками",
        "scores": {
          "psychology": 3,
          "family": 1
        }
      },
      {
        "value": "motor",
        "label": "Моторика и координация",
        "scores": {
          "early": 3,
          "diagnostics": 2
        }
      },
      {
        "value": "learning",
        "label": "Обучение и внимание",
        "scores": {
          "speech": 2,
          "psychology": 2,
          "diagnostics": 2
        }
      }
    ]
  },
  {
    "id": "diagnosis",
    "question": "Есть ли заключение специалистов (ПМПК, невролог и т.д.)?",
    "type": "single",
    "options": [
      {
        "value": "yes",
        "label": "Да, есть заключение",
        "scores": {
          "speech": 1,
          "psychology": 1
        }
      },
      {
        "value": "process",
        "label": "В процессе обследования",
        "scores": {
          "diagnostics": 4
        }
      },
      {
        "value": "no",
        "label": "Пока нет",
        "scores": {
          "diagnostics": 5
        }
      }
    ]
  },
  {
    "id": "experience",
    "question": "Был ли уже опыт занятий или коррекции?",
    "type": "single",
    "options": [
      {
        "value": "none",
        "label": "Нет, мы только начинаем",
        "scores": {
          "diagnostics": 3,
          "family": 2
        }
      },
      {
        "value": "some",
        "label": "Был, но нужно продолжить",
        "scores": {
          "speech": 2,
          "psychology": 2
        }
      },
      {
        "value": "regular",
        "label": "Регулярно занимаемся",
        "scores": {
          "family": 2,
          "psychology": 1
        }
      }
    ]
  },
  {
    "id": "priority",
    "question": "Что для вас сейчас важнее всего?",
    "type": "single",
    "options": [
      {
        "value": "diag",
        "label": "Понять, с чего начать (диагностика)",
        "scores": {
          "diagnostics": 5
        }
      },
      {
        "value": "classes",
        "label": "Регулярные занятия со специалистом",
        "scores": {
          "speech": 3,
          "psychology": 3
        }
      },
      {
        "value": "parents",
        "label": "Поддержка и советы для родителей",
        "scores": {
          "family": 5
        }
      },
      {
        "value": "group",
        "label": "Групповые мероприятия и общение",
        "scores": {
          "psychology": 2,
          "family": 3
        }
      }
    ]
  }
];

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
