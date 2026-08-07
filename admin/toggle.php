<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/auth.php';
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /admin/index.php');
    exit;
}

$kind = (string) ($_POST['kind'] ?? '');
$id = (int) ($_POST['id'] ?? 0);
$return = (string) ($_POST['return'] ?? '/admin/index.php');

if (!in_array($kind, ['contact', 'booking'], true) || $id <= 0) {
    header('Location: /admin/index.php');
    exit;
}

$table = $kind === 'contact' ? 'contact_requests' : 'booking_requests';
$pdo = db();

$stmt = $pdo->prepare("SELECT processed FROM {$table} WHERE id = ?");
$stmt->execute([$id]);
$row = $stmt->fetch();

if ($row) {
    $next = ((int) $row['processed']) ? 0 : 1;
    $upd = $pdo->prepare("UPDATE {$table} SET processed = ? WHERE id = ?");
    $upd->execute([$next, $id]);
}

header('Location: ' . $return);
exit;
