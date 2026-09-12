# Домен pointdiscovery.com и поиск «Точка Открытий Оренбург»

## Важно: .com или .online?

Раньше использовался **pointdiscovery.online**.  
Если нужен именно **pointdiscovery.com** — домен нужно **купить или перенести** (REG.RU, Timeweb, и т.д.).

Без оплаченного домена ссылка `pointdiscovery.com` не заработает.

---

## Часть 1. Привязать домен к Timeweb

1. Timeweb → приложение **«Точка Открытий»** → **Настройки → Домены → Редактировать**
2. **Добавить домен:** `pointdiscovery.com` и `www.pointdiscovery.com`
3. Timeweb покажет DNS-записи (A или CNAME)

4. У регистратора домена (REG.RU и др.) → **DNS**:
   - пропишите записи **как указал Timeweb**
   - подождите 1–24 часа

5. Проверка:
   - `https://pointdiscovery.com/api/health` → `{"ok":true}`
   - `https://pointdiscovery.com/admin/login`

6. В Timeweb → **Переменные** добавьте/обновите:
   ```
   CORS_ORIGINS=https://pointdiscovery.com,https://www.pointdiscovery.com
   DB_PATH=/tmp/point-data.sqlite
   COOKIE_SECURE=false
   ```

7. **Пересоберите** приложение.

---

## Часть 2. Поиск в Google и Яндексе

Сайт в поиске **не появляется сразу** — обычно 1–4 недели после регистрации.

### Шаг A — Яндекс.Вебмастер

1. [webmaster.yandex.ru](https://webmaster.yandex.ru)
2. **Добавить сайт** → `https://pointdiscovery.com`
3. Подтвердить владение (файл или meta-тег)
4. **Индексирование → Sitemap** → добавить:
   ```
   https://pointdiscovery.com/sitemap.xml
   ```

### Шаг B — Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console)
2. Добавить ресурс `https://pointdiscovery.com`
3. Подтвердить сайт
4. **Sitemap** → `https://pointdiscovery.com/sitemap.xml`

### Шаг C — Карточка организации (сильно помогает по запросу «Оренбург»)

**Яндекс Бизнес:** [business.yandex.ru](https://business.yandex.ru)  
**Google Business:** [business.google.com](https://business.google.com)

Укажите:
- Название: **АНО «Точка Открытий»**
- Город: **Оренбург**
- Адрес: **ул. Цвиллинга, 1**
- Телефон: **8 (987) 796-92-72**
- Сайт: **https://pointdiscovery.com**

### Шаг D — Что уже сделано на сайте

- Заголовки и описания с «Точка Открытий», «Оренбург»
- `robots.txt` и `sitemap.xml`
- Разметка Organization (JSON-LD) на главной

---

## Запрос для проверки

Через 2–4 недели в Яндексе/Google ищите:

```
Точка Открытий Оренбург
```

или

```
центр социальной поддержки Оренбург Точка Открытий
```

---

## Если сайт на Timeweb ещё не открывается

Сначала дождитесь **«В сети»** и успешного healthcheck (`/api/health`).  
Потом привязывайте домен — иначе и Timeweb-ссылка, и свой домен не откроются.
