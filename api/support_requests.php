<?php
/**
 * Заявки в поддержку GameTech.
 * POST JSON: { email, name, phone, category, description }
 * GET ?email=... — заявки пользователя
 * GET ?all=1 — все заявки (админка)
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/order_helpers.php';

header('Content-Type: application/json; charset=utf-8');

$mysqli = gametech_mysqli();
if (!$mysqli) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'database_unavailable'], JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'POST') {
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'invalid_json'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $email = gametech_normalize_email((string) ($payload['email'] ?? ''));
    $name = trim((string) ($payload['name'] ?? ''));
    $phone = trim((string) ($payload['phone'] ?? ''));
    $category = trim((string) ($payload['category'] ?? 'other'));
    $description = trim((string) ($payload['description'] ?? ''));

    $allowed = ['order', 'build', 'payment', 'warranty', 'other'];
    if (!in_array($category, $allowed, true)) {
        $category = 'other';
    }

    if (!gametech_valid_email($email) || $name === '' || mb_strlen($description) < 10) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'validation_failed'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $user = gametech_get_user_by_email($mysqli, $email);
    $userId = $user ? (int) $user['id'] : null;
    $status = 'new';

    if ($userId) {
        $stmt = $mysqli->prepare(
            'INSERT INTO support_requests (user_id, user_email, user_name, phone, category, description, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'prepare_failed'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $stmt->bind_param('issssss', $userId, $email, $name, $phone, $category, $description, $status);
    } else {
        $stmt = $mysqli->prepare(
            'INSERT INTO support_requests (user_email, user_name, phone, category, description, status)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'prepare_failed'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $stmt->bind_param('ssssss', $email, $name, $phone, $category, $description, $status);
    }
    if (!$stmt->execute()) {
        $stmt->close();
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'insert_failed'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $id = (int) $mysqli->insert_id;
    $stmt->close();

    echo json_encode(['ok' => true, 'id' => $id], JSON_UNESCAPED_UNICODE);
    exit;
}

if (isset($_GET['all']) && $_GET['all'] === '1') {
    $res = $mysqli->query(
        'SELECT id, user_email, user_name, phone, category, description, status, created_at
         FROM support_requests ORDER BY created_at DESC, id DESC LIMIT 200'
    );
    $rows = [];
    if ($res) {
        while ($r = $res->fetch_assoc()) {
            $rows[] = [
                'id' => (int) $r['id'],
                'email' => $r['user_email'],
                'name' => $r['user_name'],
                'phone' => $r['phone'],
                'category' => $r['category'],
                'description' => $r['description'],
                'status' => $r['status'],
                'createdAt' => date('c', strtotime((string) $r['created_at']) ?: time()),
            ];
        }
        $res->free();
    }
    echo json_encode(['ok' => true, 'requests' => $rows], JSON_UNESCAPED_UNICODE);
    exit;
}

$email = gametech_normalize_email((string) ($_GET['email'] ?? ''));
if (!gametech_valid_email($email)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_email'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt = $mysqli->prepare(
    'SELECT id, category, description, status, created_at
     FROM support_requests WHERE user_email = ? ORDER BY created_at DESC LIMIT 50'
);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'prepare_failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
$rows = [];
while ($r = $res->fetch_assoc()) {
    $rows[] = [
        'id' => (int) $r['id'],
        'category' => $r['category'],
        'description' => $r['description'],
        'status' => $r['status'],
        'createdAt' => date('c', strtotime((string) $r['created_at']) ?: time()),
    ];
}
$stmt->close();

echo json_encode(['ok' => true, 'requests' => $rows], JSON_UNESCAPED_UNICODE);
