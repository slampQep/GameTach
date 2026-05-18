<?php
/**
 * Проверка: PHP работает и есть связь с MySQL.
 * Откройте в браузере: https://ваш-сайт.ru/api/health.php
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/bootstrap.php';

$out = [
    'ok' => true,
    'php' => PHP_VERSION,
    'database' => 'unknown',
];

$mysqli = gametech_mysqli();
if (!$mysqli) {
    $out['ok'] = false;
    $out['database'] = 'connection_failed';
    http_response_code(503);
    echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$res = $mysqli->query('SELECT DATABASE() AS db, COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE()');
$row = $res ? $res->fetch_assoc() : null;
$mysqli->close();

$out['database'] = 'connected';
$out['db_name'] = $row['db'] ?? null;
$out['tables_count'] = isset($row['c']) ? (int) $row['c'] : null;

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
