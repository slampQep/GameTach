<?php
/**
 * Регистрация пользователя в MySQL (таблица users).
 * POST JSON: { "email", "name", "passwordHash", "salt" }
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '', true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json'], JSON_UNESCAPED_UNICODE);
    exit;
}

$email = isset($payload['email']) ? strtolower(trim((string) $payload['email'])) : '';
$name = isset($payload['name']) ? trim((string) $payload['name']) : '';
$passwordHash = isset($payload['passwordHash']) ? trim((string) $payload['passwordHash']) : '';
$salt = isset($payload['salt']) ? trim((string) $payload['salt']) : '';

if ($email === '' || strlen($email) > 254 || !preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_email'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($name === '' || mb_strlen($name) < 2 || mb_strlen($name) > 120) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_name'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($passwordHash === '' || strlen($passwordHash) > 128 || $salt === '' || strlen($salt) > 64) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_credentials'], JSON_UNESCAPED_UNICODE);
    exit;
}

$mysqli = gametech_mysqli();
if (!$mysqli) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'database_unavailable'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt = $mysqli->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'prepare_failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
if ($res->fetch_assoc()) {
    $stmt->close();
    http_response_code(409);
    echo json_encode(['ok' => false, 'error' => 'email_exists'], JSON_UNESCAPED_UNICODE);
    exit;
}
$stmt->close();

$stmt = $mysqli->prepare(
    'INSERT INTO users (email, display_name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)'
);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'prepare_failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$role = 'user';
$stmt->bind_param('sssss', $email, $name, $passwordHash, $salt, $role);
if (!$stmt->execute()) {
    $stmt->close();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'insert_failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$newId = (int) $mysqli->insert_id;
$stmt->close();

echo json_encode(
    ['ok' => true, 'id' => $newId, 'email' => $email],
    JSON_UNESCAPED_UNICODE
);
