<?php
declare(strict_types=1);

// Copy this file to config.php and fill in real values. Do NOT commit config.php.

return [
    'db' => [
        'host' => '127.0.0.1',
        'name' => 'dzmotortech',
        'user' => 'dzmotortech',
        'pass' => 'change-me',
        'charset' => 'utf8mb4',
    ],
    'smtp' => [
        'host' => 'smtp.yandex.ru',
        'port' => 465,
        'secure' => 'ssl', // 'ssl' for port 465, 'tls' for port 587
        'username' => 'mrklv001@yandex.ru',
        'password' => 'change-me-app-password',
        'from_email' => 'mrklv001@yandex.ru',
        'from_name' => 'DZ Motor Tech',
    ],
    'site' => [
        // Base URL used to build absolute redirect/email links.
        'ru_base' => 'https://dzmotortech.ru',
        'en_base' => 'https://dzmotortech.ru/en',
    ],
];
