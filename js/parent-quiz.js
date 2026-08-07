(function () {
  const bar = document.getElementById('quiz-bar');
  const startEl = document.getElementById('quiz-start');
  const questionEl = document.getElementById('quiz-question');
  const resultEl = document.getElementById('quiz-result');
  const beginBtn = document.getElementById('quiz-begin');

  if (!beginBtn) return;

  const questionsUrl = window.siteApiUrl(
    (window.SITE_API && window.SITE_API.questions) || '/api/quiz/questions'
  );
  const submitUrl = window.siteApiUrl((window.SITE_API && window.SITE_API.quiz) || '/api/quiz/submit');

  let questions = [];
  let step = 0;
  const answers = {};

  function loadQuestionsFromStatic() {
    if (!window.QUIZ_DATA || !window.QUIZ_DATA.QUESTIONS) return false;
    questions = window.QUIZ_DATA.QUESTIONS;
    return questions.length > 0;
  }

  fetch(questionsUrl)
    .then((r) => {
      if (!r.ok) throw new Error('api');
      return r.json();
    })
    .then((data) => {
      questions = data.questions || [];
      if (!questions.length && loadQuestionsFromStatic()) return;
      if (!questions.length) throw new Error('empty');
    })
    .catch(() => {
      if (loadQuestionsFromStatic()) return;
      beginBtn.disabled = true;
      beginBtn.textContent = 'Тест временно недоступен';
    });

  beginBtn.addEventListener('click', () => {
    const consent = document.getElementById('quiz-consent');
    if (!consent || !consent.checked) {
      alert('Подтвердите согласие на обработку данных');
      return;
    }
    if (!questions.length) {
      alert('Загрузка вопросов… попробуйте через секунду');
      return;
    }
    startEl.classList.add('hidden');
    step = 0;
    renderQuestion();
  });

  function renderQuestion() {
    const q = questions[step];
    if (!q) return submitQuiz();

    const pct = Math.round(((step + 1) / questions.length) * 100);
    if (bar) bar.style.width = pct + '%';

    const isMulti = q.type === 'multi';
    const selected = answers[q.id] || (isMulti ? [] : null);

    questionEl.classList.remove('hidden');
    questionEl.innerHTML = `
      <h2>${escapeHtml(q.question)}</h2>
      <div class="quiz-options">
        ${q.options
          .map((o) => {
            const checked = isMulti ? selected.includes(o.value) : selected === o.value;
            return `
          <label class="quiz-option ${checked ? 'selected' : ''}">
            <input type="${isMulti ? 'checkbox' : 'radio'}" name="q_${q.id}" value="${escapeHtml(o.value)}" ${checked ? 'checked' : ''} />
            <span>${escapeHtml(o.label)}</span>
          </label>`;
          })
          .join('')}
      </div>
      <div class="quiz-nav">
        <button class="btn btn-outline" type="button" id="quiz-prev" ${step === 0 ? 'disabled' : ''}>Назад</button>
        <button class="btn btn-primary" type="button" id="quiz-next">${step === questions.length - 1 ? 'Узнать результат' : 'Далее'}</button>
      </div>`;

    questionEl.querySelectorAll('.quiz-option input').forEach((input) => {
      input.addEventListener('change', () => collectAnswer(q));
    });

    document.getElementById('quiz-prev')?.addEventListener('click', () => {
      collectAnswer(q);
      step -= 1;
      renderQuestion();
    });

    document.getElementById('quiz-next')?.addEventListener('click', () => {
      if (!collectAnswer(q)) {
        alert('Выберите хотя бы один вариант');
        return;
      }
      step += 1;
      if (step >= questions.length) submitQuiz();
      else renderQuestion();
    });
  }

  function collectAnswer(q) {
    const isMulti = q.type === 'multi';
    if (isMulti) {
      const vals = [...questionEl.querySelectorAll(`input[name="q_${q.id}"]:checked`)].map((i) => i.value);
      answers[q.id] = vals;
      return vals.length > 0;
    }
    const checked = questionEl.querySelector(`input[name="q_${q.id}"]:checked`);
    if (!checked) return false;
    answers[q.id] = checked.value;
    return true;
  }

  function showResult(rec) {
    resultEl.innerHTML = `
      <div class="result-icon">${escapeHtml(rec.icon || '✨')}</div>
      <h2>Рекомендуем: ${escapeHtml(rec.title)}</h2>
      <p class="result-desc">${escapeHtml(rec.description || '')}</p>
      <p class="result-note">Это ориентир, не диагноз. Координатор уточнит детали при записи.</p>
      <div class="result-actions">
        <a href="zap.html?direction=${encodeURIComponent(rec.title)}" class="btn btn-primary">Записаться на приём</a>
        <a href="seansy.html" class="btn btn-outline">Расписание сеансов</a>
      </div>`;
  }

  function submitQuiz() {
    questionEl.classList.add('hidden');
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = '<p>Анализируем ответы…</p>';
    document.getElementById('quiz-progress')?.classList.add('hidden');

    const parentName = document.getElementById('parent-name')?.value || '';
    const childAge = document.getElementById('child-age')?.value || '';

    fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent_name: parentName,
        child_age: childAge,
        answers,
        consent: true,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        showResult(data.recommendation);
      })
      .catch(() => {
        if (window.QUIZ_DATA && typeof window.QUIZ_DATA.recommendCourse === 'function') {
          const { course } = window.QUIZ_DATA.recommendCourse(answers);
          if (course) {
            showResult(course);
            return;
          }
        }
        resultEl.innerHTML =
          '<p class="result-desc">Не удалось отправить результат. Позвоните нам: <a href="tel:89877969272">8 (987) 796-92-72</a></p>';
      });
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
