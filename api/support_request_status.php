<?php
/**
 * Обновление статуса заявки (админка).
 * POST JSON: { id, status }
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
$id = isset($payload['id']) ? (int) $payload['id'] : 0;
$status = trim((string) ($payload['status'] ?? ''));

$allowed = ['new', 'in_progress', 'done', 'cancelled'];
if ($id < 1 || !in_array($status, $allowed, true)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'validation_failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$mysqli = gametech_mysqli();
if (!$mysqli) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'database_unavailable'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt = $mysqli->prepare('UPDATE support_requests SET status = ? WHERE id = ? LIMIT 1');
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'prepare_failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt->bind_param('si', $status, $id);
$ok = $stmt->execute();
$stmt->close();

echo json_encode(['ok' => $ok], JSON_UNESCAPED_UNICODE);
