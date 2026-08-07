<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/auth.php';

if (admin_logged_in()) {
    header('Location: /admin/index.php');
    exit;
}

$error = null;
$username = (string) (app_config()['admin_username'] ?? 'admin');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');

    if (attempt_login($username, $password)) {
        header('Location: /admin/index.php');
        exit;
    }

    $error = 'Неверный логин или пароль';
}
?>
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Админка — Вход | Точка Открытий</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/admin/assets/admin.css" />
  </head>
  <body>
    <div class="bg-gradient"></div>

    <div class="admin-wrap">
      <div class="login-card">
        <h1>Вход в админку</h1>
        <p>Заявки с сайта и утверждение записей</p>

        <form method="post" action="/admin/login.php">
          <label>Логин</label>
          <input type="text" name="username" value="<?= htmlspecialchars($username, ENT_QUOTES, 'UTF-8') ?>" required />

          <label>Пароль</label>
          <input type="password" name="password" required />

          <button class="btn btn-primary" type="submit" style="width: 100%; margin-top: 18px">Войти</button>
        </form>

        <?php if ($error): ?>
        <div class="error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
        <?php endif; ?>

        <p class="muted" style="margin-top: 16px">
          Пароль задаётся в файле <code>config.php</code> на хостинге.
        </p>
      </div>
    </div>
  </body>
</html>
