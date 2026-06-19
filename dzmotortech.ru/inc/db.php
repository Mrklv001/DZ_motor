<?php
declare(strict_types=1);

function app_config(): array
{
    static $config = null;
    if ($config === null) {
        $path = __DIR__ . '/config.php';
        if (!file_exists($path)) {
            http_response_code(500);
            exit('Missing inc/config.php. Copy inc/config.example.php and fill in real values.');
        }
        $config = require $path;
    }
    return $config;
}

function get_pdo(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $db = app_config()['db'];
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            $db['host'],
            $db['name'],
            $db['charset'] ?? 'utf8mb4'
        );
        $pdo = new PDO($dsn, $db['user'], $db['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function get_setting(string $name, string $default = ''): string
{
    $stmt = get_pdo()->prepare('SELECT value FROM settings WHERE name = ?');
    $stmt->execute([$name]);
    $value = $stmt->fetchColumn();
    return $value === false ? $default : (string) $value;
}

function set_setting(string $name, string $value): void
{
    $stmt = get_pdo()->prepare(
        'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?'
    );
    $stmt->execute([$name, $value, $value]);
}
