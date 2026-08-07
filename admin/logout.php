<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/auth.php';
logout_admin();
header('Location: /admin/login.php');
exit;
