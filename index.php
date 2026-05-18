<?php
/**
 * Запасная главная для Open Server: отдаёт тот же HTML, что index.html
 * (если в настройках Apache сначала выбирается index.php).
 */
header("Content-Type: text/html; charset=UTF-8");
readfile(__DIR__ . DIRECTORY_SEPARATOR . "index.html");
