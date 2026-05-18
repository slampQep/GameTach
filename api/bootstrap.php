<?php
/**
 * Подключение к MySQL (локально Open Server или облако на хостинге).
 *
 * 1) api/config.local.php — для продакшена (скопировать из config.local.php.example)
 * 2) переменные окружения GAMETECH_DB_* — если хостинг их поддерживает
 * 3) по умолчанию — Open Server: 127.0.0.1, root, БД gametech
 */
function gametech_db_config(): array
{
    $config = [
        'host' => '127.0.0.1',
        'user' => 'root',
        'pass' => '',
        'name' => 'gametech',
        'port' => 3306,
    ];

    $localFile = __DIR__ . '/config.local.php';
    if (is_file($localFile)) {
        $local = require $localFile;
        if (is_array($local)) {
            $config = array_merge($config, $local);
        }
    }

    if (getenv('GAMETECH_DB_HOST')) {
        $config['host'] = getenv('GAMETECH_DB_HOST');
    }
    if (getenv('GAMETECH_DB_USER')) {
        $config['user'] = getenv('GAMETECH_DB_USER');
    }
    if (getenv('GAMETECH_DB_PASS') !== false) {
        $config['pass'] = getenv('GAMETECH_DB_PASS');
    }
    if (getenv('GAMETECH_DB_NAME')) {
        $config['name'] = getenv('GAMETECH_DB_NAME');
    }
    if (getenv('GAMETECH_DB_PORT')) {
        $config['port'] = (int) getenv('GAMETECH_DB_PORT');
    }

    return $config;
}

function gametech_mysqli(): ?mysqli
{
    $c = gametech_db_config();

    $mysqli = @new mysqli(
        $c['host'],
        $c['user'],
        $c['pass'],
        $c['name'],
        (int) $c['port']
    );
    if ($mysqli->connect_errno) {
        return null;
    }
    $mysqli->set_charset('utf8mb4');
    return $mysqli;
}
