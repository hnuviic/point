<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/auth.php';
require_admin();

$pdo = db();
$filter = $_GET['filter'] ?? 'all';
$type = $_GET['type'] ?? 'all';

$contacts = $pdo->query("
    SELECT id, created_at, processed, name, phone, email, topic, message, 'contact' AS kind
    FROM contact_requests
    ORDER BY created_at DESC
")->fetchAll();

$bookings = $pdo->query("
    SELECT id, created_at, processed, name, phone, child_name, direction, desired_date, comment, 'booking' AS kind
    FROM booking_requests
    ORDER BY created_at DESC
")->fetchAll();

$requests = array_merge($contacts, $bookings);
usort($requests, static fn($a, $b) => strcmp((string) $b['created_at'], (string) $a['created_at']));

$newContacts = count(array_filter($contacts, static fn($r) => !(int) $r['processed']));
$newBookings = count(array_filter($bookings, static fn($r) => !(int) $r['processed']));

$requests = array_values(array_filter($requests, static function ($r) use ($filter, $type) {
    if ($type !== 'all' && $r['kind'] !== $type) {
        return false;
    }
    if ($filter === 'new') {
        return !(int) $r['processed'];
    }
    if ($filter === 'done') {
        return (int) $r['processed'] === 1;
    }
    return true;
}));

$admin = $_SESSION['admin_user'];

function q(array $extra = []): string
{
    return '?' . http_build_query(array_merge($_GET, $extra));
}

function fmt_date(string $iso): string
{
    try {
        return (new DateTime($iso))->format('d.m.Y H:i');
    } catch (Throwable) {
        return $iso;
    }
}

function h(string $v): string
{
    return htmlspecialchars($v, ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Админка — Заявки | Точка Открытий</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/admin/assets/admin.css" />
</head>
<body>
  <div class="bg-gradient"></div>
  <div class="admin-wrap">
    <div class="admin-top">
      <div class="brand">
        <div class="brand-badge">ТО</div>
        <div>
          <h1>Админ-панель</h1>
          <p>Вошли как <?= h((string) $admin['username']) ?></p>
        </div>
      </div>
      <div class="top-actions">
        <a class="btn btn-outline" href="/" target="_blank" rel="noopener">Открыть сайт</a>
        <form method="post" action="/admin/logout.php" style="margin:0">
          <button class="btn btn-dark" type="submit">Выйти</button>
        </form>
      </div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="num"><?= $newContacts ?></div>
        <div class="label">Новые сообщения</div>
      </div>
      <div class="stat-card">
        <div class="num"><?= $newBookings ?></div>
        <div class="label">Новые записи</div>
      </div>
      <div class="stat-card">
                <div class="num"><?= count($contacts) + count($bookings) ?></div>
        <div class="label">Всего заявок</div>
      </div>
    </div>

    <div class="filters">
      <a class="filter-link <?= $filter === 'all' ? 'active' : '' ?>" href="<?= h(q(['filter' => 'all'])) ?>">Все</a>
      <a class="filter-link <?= $filter === 'new' ? 'active' : '' ?>" href="<?= h(q(['filter' => 'new'])) ?>">Только новые</a>
      <a class="filter-link <?= $filter === 'done' ? 'active' : '' ?>" href="<?= h(q(['filter' => 'done'])) ?>">Обработанные</a>
      <a class="filter-link <?= $type === 'contact' ? 'active' : '' ?>" href="<?= h(q(['type' => 'contact'])) ?>">Контакты</a>
      <a class="filter-link <?= $type === 'booking' ? 'active' : '' ?>" href="<?= h(q(['type' => 'booking'])) ?>">Записи</a>
    </div>

    <div class="card">
      <?php if (count($requests) === 0): ?>
      <div class="empty">Пока нет заявок по выбранному фильтру.</div>
      <?php else: ?>
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Тип</th>
            <th>Клиент</th>
            <th class="hide-mobile">Детали</th>
            <th>Статус</th>
            <th style="width:190px">Действие</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($requests as $r): ?>
          <?php $isDone = (int) $r['processed'] === 1; $isBooking = $r['kind'] === 'booking'; ?>
          <tr>
            <td><?= h(fmt_date((string) $r['created_at'])) ?></td>
            <td><span class="tag <?= $isBooking ? 'booking' : 'contact' ?>"><?= $isBooking ? 'Запись' : 'Контакт' ?></span></td>
            <td>
              <strong><?= h((string) $r['name']) ?></strong>
              <div class="muted">Тел: <?= h((string) $r['phone']) ?></div>
              <?php if (!$isBooking && !empty($r['email'])): ?>
              <div class="muted">Email: <?= h((string) $r['email']) ?></div>
              <?php endif; ?>
            </td>
            <td class="hide-mobile">
              <?php if ($isBooking): ?>
              <div><strong>Направление:</strong> <?= h((string) ($r['direction'] ?? '—')) ?></div>
              <div class="muted">Дата визита: <?= h((string) ($r['desired_date'] ?? '—')) ?></div>
              <?php if (!empty($r['child_name'])): ?><div class="muted">Ребёнок: <?= h((string) $r['child_name']) ?></div><?php endif; ?>
              <div class="muted"><?= h((string) ($r['comment'] ?? '')) ?></div>
              <?php else: ?>
              <div><strong>Тема:</strong> <?= h((string) ($r['topic'] ?? '—')) ?></div>
              <div class="muted"><?= h((string) ($r['message'] ?? '')) ?></div>
              <?php endif; ?>
            </td>
            <td class="status <?= $isDone ? 'done' : 'new' ?>"><?= $isDone ? 'Утверждено' : 'Новая' ?></td>
            <td>
              <form method="post" action="/admin/toggle.php">
                <input type="hidden" name="kind" value="<?= h((string) $r['kind']) ?>" />
                <input type="hidden" name="id" value="<?= (int) $r['id'] ?>" />
                <input type="hidden" name="return" value="<?= h($_SERVER['REQUEST_URI'] ?? '/admin/index.php') ?>" />
                <button class="btn btn-primary" type="submit" style="width:100%">
                  <?= $isDone ? 'Вернуть в новые' : ($isBooking ? 'Утвердить запись' : 'Отметить обработанным') ?>
                </button>
              </form>
            </td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
