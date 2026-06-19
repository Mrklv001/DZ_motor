<?php
declare(strict_types=1);

// LOCAL TESTING CONFIG ONLY. On the production server, create this file from
// config.example.php with real DB credentials and the real Yandex app password.

return [
    'db' => [
        'host' => '127.0.0.1',
        'name' => 'dzmotortech',
        'user' => 'dzmotortech',
        'pass' => 'localtestpass',
        'charset' => 'utf8mb4',
    ],
    'smtp' => [
        'host' => 'smtp.yandex.ru',
        'port' => 465,
        'secure' => 'ssl',
        'username' => 'mrklv001@yandex.ru',
        'password' => 'REPLACE_WITH_YANDEX_APP_PASSWORD',
        'from_email' => 'mrklv001@yandex.ru',
        'from_name' => 'DZ Motor Tech',
    ],
    'site' => [
        'ru_base' => 'http://localhost:8089',
        'en_base' => 'http://localhost:8089/en',
    ],
];
