<?php
/**
 * Установка таблиц users / orders / order_items и демо-данных.
 * Откройте один раз: http://gametach/api/install_users_orders.php
 */
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

header('Content-Type: text/html; charset=utf-8');

$mysqli = gametech_mysqli();
if (!$mysqli) {
    http_response_code(503);
    echo '<h1>Ошибка</h1><p>Не удалось подключиться к MySQL (БД gametech).</p>';
    exit;
}

$mysqli->set_charset('utf8mb4');

$ddl = [
    "CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      display_name VARCHAR(120) NOT NULL DEFAULT '',
      password_hash VARCHAR(128) NOT NULL DEFAULT '',
      salt VARCHAR(64) NOT NULL DEFAULT '',
      role VARCHAR(24) NOT NULL DEFAULT 'user',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    "CREATE TABLE IF NOT EXISTS orders (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NOT NULL,
      total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      status VARCHAR(32) NOT NULL DEFAULT 'completed',
      placed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      KEY idx_orders_user_time (user_id, placed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    "CREATE TABLE IF NOT EXISTS order_items (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      order_id INT UNSIGNED NOT NULL,
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(500) NOT NULL DEFAULT '',
      item_type VARCHAR(32) NOT NULL DEFAULT 'item',
      unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      qty INT UNSIGNED NOT NULL DEFAULT 1,
      line_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      KEY idx_order_items_order (order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
    "CREATE TABLE IF NOT EXISTS support_requests (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NULL,
      user_email VARCHAR(255) NOT NULL DEFAULT '',
      user_name VARCHAR(120) NOT NULL DEFAULT '',
      phone VARCHAR(40) NOT NULL DEFAULT '',
      category VARCHAR(50) NOT NULL DEFAULT 'other',
      description TEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'new',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_support_status (status),
      KEY idx_support_email (user_email),
      CONSTRAINT fk_support_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
];

$users = [
    [1, 'test@test.com', 'Тестовый Пользователь', '2025-01-10 12:00:00'],
    [2, 'anna@gametech.local', 'Анна Клиент', '2025-02-01 10:00:00'],
    [3, 'max@gametech.local', 'Максим Игровой', '2025-02-15 16:30:00'],
];

$orders = [
    [101, 1, 59990.00, '2025-04-02 11:20:00'],
    [102, 1, 184990.00, '2025-04-18 09:45:00'],
    [103, 2, 89990.00, '2025-05-01 14:00:00'],
    [104, 2, 32990.00, '2025-05-03 19:10:00'],
    [105, 3, 249990.00, '2025-04-28 12:00:00'],
];

$items = [
    [101, 'CYBER GAMER', 'RTX 3050 • ENTRY GAMER', 'pc', 59990.00, 1, 59990.00],
    [102, 'PRO STREAMER', 'RTX 4070 • для стримов', 'pc', 149990.00, 1, 149990.00],
    [102, 'Монитор 27 дюймов 165 Гц', 'IPS, DisplayPort', 'item', 35000.00, 1, 35000.00],
    [103, 'SHADOW ELITE', 'RTX 4060 • MID', 'pc', 89990.00, 1, 89990.00],
    [104, 'Клавиатура механическая', 'Cherry MX Brown', 'peripheral', 10990.00, 1, 10990.00],
    [104, 'Игровая мышь', '16000 DPI', 'peripheral', 4990.00, 1, 4990.00],
    [104, 'Коврик XL', 'Ткань + прошивка', 'item', 6990.00, 1, 6990.00],
    [104, 'Наушники 7.1', 'USB, микрофон', 'peripheral', 10020.00, 1, 10020.00],
    [105, 'TITAN OVERKILL', 'RTX 4090 • ULTRA', 'pc', 219990.00, 1, 219990.00],
    [105, 'Блок питания 1000W', '80+ Gold', 'component', 15000.00, 1, 15000.00],
    [105, 'Система водяного охлаждения', '360 мм', 'component', 15000.00, 1, 15000.00],
];

$errors = [];

foreach ($ddl as $sql) {
    if (!$mysqli->query($sql)) {
        $errors[] = $mysqli->error;
    }
}

$mysqli->query('SET FOREIGN_KEY_CHECKS = 0');
$mysqli->query('TRUNCATE TABLE order_items');
$mysqli->query('TRUNCATE TABLE orders');
$mysqli->query('DELETE FROM users');
$mysqli->query('SET FOREIGN_KEY_CHECKS = 1');

$stmtUser = $mysqli->prepare(
    'INSERT INTO users (id, email, display_name, password_hash, salt, role, created_at) VALUES (?, ?, ?, "", "", "user", ?)'
);
if (!$stmtUser) {
    $errors[] = $mysqli->error;
} else {
    foreach ($users as $u) {
        $stmtUser->bind_param('isss', $u[0], $u[1], $u[2], $u[3]);
        if (!$stmtUser->execute()) {
            $errors[] = $stmtUser->error;
        }
    }
    $stmtUser->close();
}

$stmtOrder = $mysqli->prepare(
    'INSERT INTO orders (id, user_id, total, status, placed_at) VALUES (?, ?, ?, "completed", ?)'
);
if (!$stmtOrder) {
    $errors[] = $mysqli->error;
} else {
    foreach ($orders as $o) {
        $stmtOrder->bind_param('iids', $o[0], $o[1], $o[2], $o[3]);
        if (!$stmtOrder->execute()) {
            $errors[] = $stmtOrder->error;
        }
    }
    $stmtOrder->close();
}

$stmtItem = $mysqli->prepare(
    'INSERT INTO order_items (order_id, title, subtitle, item_type, unit_price, qty, line_total) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
if (!$stmtItem) {
    $errors[] = $mysqli->error;
} else {
    foreach ($items as $it) {
        $stmtItem->bind_param('isssdid', $it[0], $it[1], $it[2], $it[3], $it[4], $it[5], $it[6]);
        if (!$stmtItem->execute()) {
            $errors[] = $stmtItem->error;
        }
    }
    $stmtItem->close();
}

$mysqli->query('ALTER TABLE users AUTO_INCREMENT = 4');
$mysqli->query('ALTER TABLE orders AUTO_INCREMENT = 106');

$cntUsers = 0;
$cntOrders = 0;
$cntItems = 0;
if ($r = $mysqli->query('SELECT COUNT(*) AS c FROM users')) {
    $cntUsers = (int) ($r->fetch_assoc()['c'] ?? 0);
}
if ($r = $mysqli->query('SELECT COUNT(*) AS c FROM orders')) {
    $cntOrders = (int) ($r->fetch_assoc()['c'] ?? 0);
}
if ($r = $mysqli->query('SELECT COUNT(*) AS c FROM order_items')) {
    $cntItems = (int) ($r->fetch_assoc()['c'] ?? 0);
}

echo '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Установка GameTech</title>';
echo '<style>body{font-family:sans-serif;max-width:640px;margin:40px auto;padding:0 16px;} .ok{color:#0a0;} .err{color:#c00;}</style></head><body>';

if ($errors === []) {
    echo '<h1 class="ok">База заполнена</h1>';
    echo '<p>Таблицы: <strong>users</strong> (' . $cntUsers . '), <strong>orders</strong> (' . $cntOrders . '), <strong>order_items</strong> (' . $cntItems . ').</p>';
    echo '<p>Обновите phpMyAdmin (F5) — слева в gametech должны быть 4 таблицы.</p>';
    echo '<p>Вход: <code>test@test.com</code> / <code>Test123!</code> → <a href="../account.html">личный кабинет</a></p>';
    echo '<p><a href="user_orders.php?email=test@test.com">Проверить API</a></p>';
} else {
    echo '<h1 class="err">Ошибки</h1><ul>';
    foreach ($errors as $e) {
        echo '<li class="err">' . htmlspecialchars($e, ENT_QUOTES, 'UTF-8') . '</li>';
    }
    echo '</ul><p>users: ' . $cntUsers . ', orders: ' . $cntOrders . ', items: ' . $cntItems . '</p>';
}

echo '</body></html>';
