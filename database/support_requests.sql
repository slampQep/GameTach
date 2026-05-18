-- Заявки в поддержку (аналог «заявка плотнику» из диплома общежития)
USE gametech;

CREATE TABLE IF NOT EXISTS support_requests (
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
  KEY idx_support_user (user_id),
  KEY idx_support_email (user_email),
  CONSTRAINT fk_support_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
