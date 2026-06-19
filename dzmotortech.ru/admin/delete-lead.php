<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !verify_csrf()) {
    http_response_code(400);
    exit('Bad request');
}

$id = (int) ($_POST['id'] ?? 0);

if ($id > 0) {
    $stmt = get_pdo()->prepare('DELETE FROM leads WHERE id = ?');
    $stmt->execute([$id]);

    $uploadDir = __DIR__ . '/../leads_uploads/' . $id;
    if (is_dir($uploadDir)) {
        foreach (glob($uploadDir . '/*') ?: [] as $file) {
            @unlink($file);
        }
        @rmdir($uploadDir);
    }
}

$redirect = (string) ($_POST['redirect'] ?? 'leads.php');
if (strpos($redirect, '://') !== false || strpos($redirect, '//') === 0) {
    $redirect = 'leads.php';
}
redirect($redirect);
