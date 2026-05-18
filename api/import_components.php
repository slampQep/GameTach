<?php
/**
 * Однократный импорт из database/components.json в таблицу components.
 * Откройте в браузере после создания БД и таблицы (database/schema.sql).
 * После успешного импорта файл можно удалить с продакшена.
 */
require_once __DIR__ . "/bootstrap.php";

header("Content-Type: text/plain; charset=utf-8");

$mysqli = gametech_mysqli();
if (!$mysqli) {
    http_response_code(503);
    echo "Нет подключения к MySQL. Проверьте, что модуль MySQL в Open Server запущен и БД gametech создана.";
    exit;
}

$path = dirname(__DIR__) . DIRECTORY_SEPARATOR . "database" . DIRECTORY_SEPARATOR . "components.json";
if (!is_readable($path)) {
    http_response_code(404);
    echo "Не найден файл: database/components.json";
    exit;
}

$json = file_get_contents($path);
$list = json_decode($json, true);
if (!is_array($list)) {
    http_response_code(400);
    echo "Неверный JSON в components.json";
    exit;
}

$stmt = $mysqli->prepare(
    "INSERT INTO components (id, category, data) VALUES (?,?,?) ON DUPLICATE KEY UPDATE category = VALUES(category), data = VALUES(data)"
);
if (!$stmt) {
    http_response_code(500);
    echo "Ошибка prepare: " . $mysqli->error;
    exit;
}

$n = 0;
foreach ($list as $item) {
    if (!is_array($item) || !isset($item["id"], $item["category"])) {
        continue;
    }
    $id = (int) $item["id"];
    $cat = (string) $item["category"];
    $payload = json_encode($item, JSON_UNESCAPED_UNICODE);
    $stmt->bind_param("iss", $id, $cat, $payload);
    if ($stmt->execute()) {
        $n++;
    }
}

echo "Готово. Обработано записей: $n из " . count($list) . "\n";
echo "Проверка: откройте api/components.php?category=cpu\n";
