<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}
$_SESSION = [];
session_destroy();
redirect('login.php');
