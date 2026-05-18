<?php
/**
 * Оформление заказа в MySQL (orders + order_items).
 * POST JSON: { "email", "items": [{ title, subtitle, type, price, qty, lineTotal?, source? }] }
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/order_helpers.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json'], JSON_UNESCAPED_UNICODE);
    exit;
}

$email = gametech_normalize_email((string) ($payload['email'] ?? ''));
if (!gametech_valid_email($email)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_email'], JSON_UNESCAPED_UNICODE);
    exit;
}

$items = $payload['items'] ?? [];
if (!is_array($items) || count($items) === 0) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'empty_cart'], JSON_UNESCAPED_UNICODE);
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
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'user_not_found'], JSON_UNESCAPED_UNICODE);
    exit;
}

$userId = (int) $user['id'];
$total = 0.0;
$normalized = [];

foreach ($items as $it) {
    if (!is_array($it)) {
        continue;
    }
    $price = (float) ($it['price'] ?? 0);
    $qty = max(1, (int) ($it['qty'] ?? 1));
    $line = isset($it['lineTotal']) ? (float) $it['lineTotal'] : $price * $qty;
    $total += $line;
    $normalized[] = [
        'title' => mb_substr(trim((string) ($it['title'] ?? 'Товар')), 0, 255),
        'subtitle' => mb_substr(trim((string) ($it['subtitle'] ?? '')), 0, 500),
        'type' => mb_substr(trim((string) ($it['type'] ?? 'item')), 0, 32),
        'price' => $price,
        'qty' => $qty,
        'line' => $line,
    ];
}

if ($normalized === []) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'empty_cart'], JSON_UNESCAPED_UNICODE);
    exit;
}

$mysqli->begin_transaction();

$stmt = $mysqli->prepare(
    'INSERT INTO orders (user_id, total, status, placed_at) VALUES (?, ?, "completed", NOW())'
);
if (!$stmt) {
    $mysqli->rollback();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'prepare_failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt->bind_param('id', $userId, $total);
if (!$stmt->execute()) {
    $stmt->close();
    $mysqli->rollback();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'insert_failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$orderId = (int) $mysqli->insert_id;
$stmt->close();

$stmtItem = $mysqli->prepare(
    'INSERT INTO order_items (order_id, title, subtitle, item_type, unit_price, qty, line_total)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);
if (!$stmtItem) {
    $mysqli->rollback();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'prepare_failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

foreach ($normalized as $row) {
    $stmtItem->bind_param(
        'isssdid',
        $orderId,
        $row['title'],
        $row['subtitle'],
        $row['type'],
        $row['price'],
        $row['qty'],
        $row['line']
    );
    if (!$stmtItem->execute()) {
        $stmtItem->close();
        $mysqli->rollback();
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'insert_failed'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
$stmtItem->close();

$mysqli->commit();

$ts = time();
echo json_encode([
    'ok' => true,
    'orderId' => $orderId,
    'order' => [
        'id' => 'db_' . $orderId,
        'createdAt' => date('c', $ts),
        'total' => $total,
        'items' => array_map(static function (array $row): array {
            return [
                'title' => $row['title'],
                'subtitle' => $row['subtitle'],
                'type' => $row['type'],
                'price' => $row['price'],
                'qty' => $row['qty'],
                'lineTotal' => $row['line'],
            ];
        }, $normalized),
    ],
], JSON_UNESCAPED_UNICODE);
