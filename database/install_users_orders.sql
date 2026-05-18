-- Один файл для phpMyAdmin: БД gametech → вкладка SQL → вставить всё → Выполнить
-- Таблица components НЕ трогается.

USE gametech;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NOT NULL DEFAULT '',
  password_hash VARCHAR(128) NOT NULL DEFAULT '',
  salt VARCHAR(64) NOT NULL DEFAULT '',
  role VARCHAR(24) NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) NOT NULL DEFAULT 'completed',
  placed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  KEY idx_orders_user_time (user_id, placed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
DELETE FROM users;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO users (id, email, display_name, password_hash, salt, role, created_at) VALUES
(1, 'test@test.com', 'Тестовый Пользователь', '', '', 'user', '2025-01-10 12:00:00'),
(2, 'anna@gametech.local', 'Анна Клиент', '', '', 'user', '2025-02-01 10:00:00'),
(3, 'max@gametech.local', 'Максим Игровой', '', '', 'user', '2025-02-15 16:30:00');

INSERT INTO orders (id, user_id, total, status, placed_at) VALUES
(101, 1, 59990.00, 'completed', '2025-04-02 11:20:00'),
(102, 1, 184990.00, 'completed', '2025-04-18 09:45:00'),
(103, 2, 89990.00, 'completed', '2025-05-01 14:00:00'),
(104, 2, 32990.00, 'completed', '2025-05-03 19:10:00'),
(105, 3, 249990.00, 'completed', '2025-04-28 12:00:00');

INSERT INTO order_items (order_id, title, subtitle, item_type, unit_price, qty, line_total) VALUES
(101, 'CYBER GAMER', 'RTX 3050 • ENTRY GAMER', 'pc', 59990.00, 1, 59990.00),
(102, 'PRO STREAMER', 'RTX 4070 • для стримов', 'pc', 149990.00, 1, 149990.00),
(102, 'Монитор 27 дюймов 165 Гц', 'IPS, DisplayPort', 'item', 35000.00, 1, 35000.00),
(103, 'SHADOW ELITE', 'RTX 4060 • MID', 'pc', 89990.00, 1, 89990.00),
(104, 'Клавиатура механическая', 'Cherry MX Brown', 'peripheral', 10990.00, 1, 10990.00),
(104, 'Игровая мышь', '16000 DPI', 'peripheral', 4990.00, 1, 4990.00),
(104, 'Коврик XL', 'Ткань + прошивка', 'item', 6990.00, 1, 6990.00),
(104, 'Наушники 7.1', 'USB, микрофон', 'peripheral', 10020.00, 1, 10020.00),
(105, 'TITAN OVERKILL', 'RTX 4090 • ULTRA', 'pc', 219990.00, 1, 219990.00),
(105, 'Блок питания 1000W', '80+ Gold', 'component', 15000.00, 1, 15000.00),
(105, 'Система водяного охлаждения', '360 мм', 'component', 15000.00, 1, 15000.00);

ALTER TABLE users AUTO_INCREMENT = 4;
ALTER TABLE orders AUTO_INCREMENT = 106;
