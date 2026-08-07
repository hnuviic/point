(function () {
  const IMG = 'img/chat-assistant.png';

  function chatApiUrl() {
    return window.siteApiUrl((window.SITE_API && window.SITE_API.chat) || '/api/chat');
  }

  const QUICK = [
    'Как записаться?',
    'Подбор курса для ребёнка',
    'Как проходят сеансы?',
    'Контакты',
  ];

  const WELCOME =
    'Здравствуйте! Я помощник центра «Точка Открытий». Помогу с записью, подбором направления, расписанием сеансов и контактами.';

  function localReply(text) {
    const t = String(text || '').toLowerCase().trim();
    if (!t) return 'Напишите ваш вопрос — я постараюсь помочь.';

    if (/запис|при[eё]м|диагност|консультац/.test(t)) {
      return (
        'Записаться можно на <a href="zap.html">странице записи</a> или пройти ' +
        '<a href="podbor.html">тест подбора направления</a>. Телефон: ' +
        '<a href="tel:89877969272">8 (987) 796-92-72</a>.'
      );
    }
    if (/тест|подбор|курс|направлен|какой курс/.test(t)) {
      return (
        'Пройдите короткий тест на <a href="podbor.html">«Подбор направления»</a> — ' +
        '5 вопросов о ребёнке, и мы подскажем, с чего начать.'
      );
    }
    if (/сеанс|занят|расписан|как проход/.test(t)) {
      return (
        'На странице <a href="seansy.html">«Как проходят сеансы»</a> — памятка для родителей ' +
        'и актуальное расписание занятий.'
      );
    }
    if (/услуг|направлен|занят|логопед|дефектолог|психолог|коррекц/.test(t)) {
      return (
        'В центре: комплексная диагностика, коррекционные занятия (логопед, дефектолог, психолог), ' +
        'поддержка родителей, обучение специалистов. Подробнее — на странице ' +
        '<a href="info.html">«О центре»</a> и <a href="proect.html">«Проекты»</a>.'
      );
    }
    if (/контакт|телефон|почт|email|адрес|где|находит/.test(t)) {
      return (
        'Контакты: телефон <a href="tel:89877969272">8 (987) 796-92-72</a>, ' +
        'email <a href="mailto:ano.tochka56@mail.ru">ano.tochka56@mail.ru</a>. ' +
        'Все контакты — на <a href="contact.html">странице «Контакты»</a>. ' +
        'Режим работы: Пн–Пт 9:00–20:00.'
      );
    }
    if (/цен|стоим|сколько|оплат|бесплатн/.test(t)) {
      return (
        'Стоимость зависит от направления и программы. Для точной информации ' +
        'оставьте заявку на <a href="zap.html">запись</a> или позвоните — ' +
        'мы подберём вариант под вашу ситуацию.'
      );
    }
    if (/время|режим|час|когда|работа/.test(t)) {
      return 'Мы работаем Пн–Пт с 9:00 до 20:00. Сб–Вс — выходной.';
    }
    if (/привет|здрав|добр|день|вечер/.test(t)) {
      return 'Здравствуйте! Рада помочь. Спросите про запись, услуги или контакты.';
    }
    if (/спасибо|благодар/.test(t)) {
      return 'Пожалуйста! Если появятся ещё вопросы — пишите.';
    }

    return (
      'Спасибо за вопрос! По этой теме лучше уточнить у специалиста: ' +
      '<a href="contact.html">напишите нам</a> или позвоните ' +
      '<a href="tel:89877969272">8 (987) 796-92-72</a>. ' +
      'Могу подсказать про <strong>запись</strong>, <strong>услуги</strong> или <strong>контакты</strong>.'
    );
  }

  function injectStyles() {
    if (document.getElementById('ai-chat-styles')) return;
    const link = document.createElement('link');
    link.id = 'ai-chat-styles';
    link.rel = 'stylesheet';
    link.href = 'css/ai-chat.css';
    document.head.appendChild(link);
  }

  function createWidget() {
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'ai-chat-fab';
    fab.setAttribute('aria-label', 'Открыть чат-помощник');
    fab.innerHTML = `<img src="${IMG}" alt="Помощник" />`;

    const panel = document.createElement('div');
    panel.className = 'ai-chat-panel';
    panel.innerHTML = `
      <div class="ai-chat-header">
        <div class="ai-chat-header-avatar"><img src="${IMG}" alt="" /></div>
        <div class="ai-chat-header-info">
          <h3>Помощник центра</h3>
          <p>Онлайн · отвечаю сразу</p>
        </div>
        <button type="button" class="ai-chat-close" aria-label="Закрыть">×</button>
      </div>
      <div class="ai-chat-messages" role="log" aria-live="polite"></div>
      <div class="ai-chat-quick"></div>
      <div class="ai-chat-input-wrap">
        <input type="text" placeholder="Ваш вопрос..." maxlength="500" autocomplete="off" />
        <button type="button" class="ai-chat-send" aria-label="Отправить">➤</button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    const messagesEl = panel.querySelector('.ai-chat-messages');
    const quickEl = panel.querySelector('.ai-chat-quick');
    const input = panel.querySelector('input');
    const sendBtn = panel.querySelector('.ai-chat-send');
    const closeBtn = panel.querySelector('.ai-chat-close');

    QUICK.forEach((label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', () => {
        input.value = label;
        sendMessage();
      });
      quickEl.appendChild(b);
    });

    function addMsg(text, who) {
      const el = document.createElement('div');
      el.className = `ai-chat-msg ${who}`;
      el.innerHTML = text;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return el;
    }

    let history = [];

    async function fetchReply(userText) {
      try {
        const resp = await fetch(chatApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userText, history }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.reply) return data.reply;
        }
      } catch (_) {
        /* локальный режим */
      }
      return localReply(userText);
    }

    async function sendMessage() {
      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      sendBtn.disabled = true;
      addMsg(text.replace(/</g, '&lt;').replace(/>/g, '&gt;'), 'user');
      history.push({ role: 'user', content: text });

      const typing = addMsg('Печатаю…', 'bot typing');

      const reply = await fetchReply(text);
      typing.remove();
      addMsg(reply, 'bot');
      history.push({ role: 'assistant', content: reply.replace(/<[^>]+>/g, '') });
      if (history.length > 20) history = history.slice(-20);

      sendBtn.disabled = false;
      input.focus();
    }

    function open() {
      panel.classList.add('is-open');
      fab.classList.add('is-open');
      if (!panel.dataset.greeted) {
        addMsg(WELCOME, 'bot');
        panel.dataset.greeted = '1';
      }
      input.focus();
    }

    function close() {
      panel.classList.remove('is-open');
      fab.classList.remove('is-open');
    }

    fab.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectStyles();
      createWidget();
    });
  } else {
    injectStyles();
    createWidget();
  }
})();
