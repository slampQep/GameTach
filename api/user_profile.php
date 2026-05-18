<?php
/**
 * Профиль пользователя и его покупки из MySQL.
 * GET ?email=...
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/order_helpers.php';

header('Content-Type: application/json; charset=utf-8');

$email = gametech_normalize_email((string) ($_GET['email'] ?? ''));
if (!gametech_valid_email($email)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_email'], JSON_UNESCAPED_UNICODE);
    exit;
}

$mysqli = gametech_mysqli();
if (!$mysqli) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'database_unavailable'], JSON_UNESCAPED_UNICODE);
    exit;
}

$user = gametech_get_user_by_email($mysqli, $email);
if (!$user) {
    echo json_encode([
        'ok' => true,
        'user' => null,
        'orders' => [],
        'stats' => ['orders_count' => 0, 'total_spent' => 0, 'items_count' => 0],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$userId = (int) $user['id'];
$stats = gametech_user_purchase_stats($mysqli, $userId);
$orders = gametech_fetch_orders_for_user($mysqli, $userId);

$created = $user['created_at'] ?? '';
$createdIso = $created ? date('c', strtotime((string) $created) ?: time()) : null;

echo json_encode([
    'ok' => true,
    'user' => [
        'id' => $userId,
        'email' => $user['email'],
        'name' => $user['display_name'],
        'role' => $user['role'],
        'registeredAt' => $createdIso,
    ],
    'stats' => $stats,
    'orders' => $orders,
], JSON_UNESCAPED_UNICODE);
