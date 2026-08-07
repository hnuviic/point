<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/lib/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

$body = json_input();
$name = trim((string) ($body['name'] ?? ''));
$phone = trim((string) ($body['phone'] ?? ''));
$childName = trim((string) ($body['child_name'] ?? ''));
$direction = trim((string) ($body['direction'] ?? ''));
$desiredDate = trim((string) ($body['desired_date'] ?? ''));
$comment = trim((string) ($body['comment'] ?? ''));
$consent = (int) ($body['consent'] ?? 0);

if ($name === '' || $phone === '') {
    json_response(['error' => 'Поля name и phone обязательны'], 400);
}

if ($consent !== 1) {
    json_response(['error' => 'Нужно подтвердить согласие на обработку данных'], 400);
}

$pdo = db();
$stmt = $pdo->prepare("
    INSERT INTO booking_requests
        (created_at, processed, name, phone, child_name, direction, desired_date, comment, consent, ip, user_agent)
    VALUES
        (:created_at, 0, :name, :phone, :child_name, :direction, :desired_date, :comment, :consent, :ip, :user_agent)
");

$stmt->execute([
    ':created_at' => gmdate('c'),
    ':name' => $name,
    ':phone' => $phone,
    ':child_name' => $childName !== '' ? $childName : null,
    ':direction' => $direction !== '' ? $direction : null,
    ':desired_date' => $desiredDate !== '' ? $desiredDate : null,
    ':comment' => $comment !== '' ? $comment : null,
    ':consent' => 1,
    ':ip' => client_ip(),
    ':user_agent' => client_ua(),
]);

json_response(['ok' => true, 'id' => (int) $pdo->lastInsertId()]);
