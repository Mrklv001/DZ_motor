<?php
declare(strict_types=1);

require_once __DIR__ . '/../../inc/db.php';
require_once __DIR__ . '/../../inc/helpers.php';

function current_admin(): ?array
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    if (empty($_SESSION['admin_id'])) {
        return null;
    }
    return ['id' => (int) $_SESSION['admin_id'], 'username' => (string) $_SESSION['admin_username']];
}

function require_login(): array
{
    $admin = current_admin();
    if ($admin === null) {
        redirect('login.php');
    }
    return $admin;
}
