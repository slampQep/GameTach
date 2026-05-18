<?php
declare(strict_types=1);

function gametech_normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function gametech_valid_email(string $email): bool
{
    return $email !== '' && strlen($email) <= 254 && (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $email);
}

/** @return array<string, mixed>|null */
function gametech_get_user_by_email(mysqli $mysqli, string $email): ?array
{
    $stmt = $mysqli->prepare(
        'SELECT id, email, display_name, role, created_at FROM users WHERE email = ? LIMIT 1'
    );
    if (!$stmt) {
        return null;
    }
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    $stmt->close();

    return $row ?: null;
}

/** @return array<int, array<string, mixed>> */
function gametech_fetch_orders_for_user(mysqli $mysqli, int $userId): array
{
    $stmt = $mysqli->prepare(
        'SELECT id, total, status, placed_at
         FROM orders
         WHERE user_id = ?
         ORDER BY placed_at DESC, id DESC'
    );
    if (!$stmt) {
        return [];
    }
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $ordersRes = $stmt->get_result();
    $orders = [];
    while ($o = $ordersRes->fetch_assoc()) {
        $ts = strtotime((string) $o['placed_at']);
        if ($ts === false) {
            $ts = time();
        }
        $orders[(int) $o['id']] = [
            'id' => 'db_' . $o['id'],
            'createdAt' => date('c', $ts),
            'total' => (float) $o['total'],
            'items' => [],
        ];
    }
    $stmt->close();

    if ($orders === []) {
        return [];
    }

    $ids = array_keys($orders);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $types = str_repeat('i', count($ids));
    $sql = "SELECT order_id, title, subtitle, item_type, unit_price, qty, line_total
            FROM order_items
            WHERE order_id IN ($placeholders)
            ORDER BY id ASC";

    $stmt = $mysqli->prepare($sql);
    if (!$stmt) {
        return array_values($orders);
    }

    $stmt->bind_param($types, ...$ids);
    $stmt->execute();
    $itemsRes = $stmt->get_result();
    while ($it = $itemsRes->fetch_assoc()) {
        $oid = (int) $it['order_id'];
        if (!isset($orders[$oid])) {
            continue;
        }
        $orders[$oid]['items'][] = [
            'title' => $it['title'],
            'subtitle' => $it['subtitle'],
            'type' => $it['item_type'],
            'price' => (float) $it['unit_price'],
            'qty' => (int) $it['qty'],
            'lineTotal' => (float) $it['line_total'],
        ];
    }
    $stmt->close();

    return array_values($orders);
}

/** @return array{orders_count:int,total_spent:float,items_count:int} */
function gametech_user_purchase_stats(mysqli $mysqli, int $userId): array
{
    $stmt = $mysqli->prepare(
        'SELECT COUNT(*) AS orders_count, COALESCE(SUM(total), 0) AS total_spent
         FROM orders WHERE user_id = ?'
    );
    if (!$stmt) {
        return ['orders_count' => 0, 'total_spent' => 0.0, 'items_count' => 0];
    }
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $ordersCount = (int) ($row['orders_count'] ?? 0);
    $totalSpent = (float) ($row['total_spent'] ?? 0);

    $stmt = $mysqli->prepare(
        'SELECT COALESCE(SUM(oi.qty), 0) AS items_count
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi.order_id
         WHERE o.user_id = ?'
    );
    $itemsCount = 0;
    if ($stmt) {
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $r2 = $stmt->get_result()->fetch_assoc();
        $itemsCount = (int) ($r2['items_count'] ?? 0);
        $stmt->close();
    }

    return [
        'orders_count' => $ordersCount,
        'total_spent' => $totalSpent,
        'items_count' => $itemsCount,
    ];
}
