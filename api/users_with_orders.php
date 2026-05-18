<?php
/**
 * Список пользователей и сводка по покупкам (для админки).
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

$mysqli = gametech_mysqli();
if (!$mysqli) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'database_unavailable'], JSON_UNESCAPED_UNICODE);
    exit;
}

$sql = 'SELECT u.id, u.email, u.display_name, u.role, u.created_at,
        COUNT(DISTINCT o.id) AS orders_count,
        COALESCE(SUM(o.total), 0) AS total_spent
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id
        GROUP BY u.id, u.email, u.display_name, u.role, u.created_at
        ORDER BY total_spent DESC, u.id ASC';

$res = $mysqli->query($sql);
if (!$res) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'query_failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$users = [];
while ($row = $res->fetch_assoc()) {
    $uid = (int) $row['id'];
    $created = $row['created_at'] ?? '';
    $users[] = [
        'id' => $uid,
        'email' => $row['email'],
        'name' => $row['display_name'],
        'role' => $row['role'],
        'registeredAt' => $created ? date('c', strtotime((string) $created) ?: time()) : null,
        'ordersCount' => (int) $row['orders_count'],
        'totalSpent' => (float) $row['total_spent'],
    ];
}
$res->free();

echo json_encode(['ok' => true, 'users' => $users], JSON_UNESCAPED_UNICODE);
