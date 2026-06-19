<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
require_login();

$id = (int) ($_GET['id'] ?? 0);
$requestedFile = (string) ($_GET['file'] ?? '');

$stmt = get_pdo()->prepare('SELECT attachments FROM leads WHERE id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch();

if (!$row) {
    http_response_code(404);
    exit('Not found');
}

$attachments = json_decode((string) $row['attachments'], true) ?: [];
$match = null;
foreach ($attachments as $file) {
    if (($file['stored'] ?? '') === $requestedFile) {
        $match = $file;
        break;
    }
}

if (!$match) {
    http_response_code(404);
    exit('Not found');
}

$path = __DIR__ . '/../leads_uploads/' . $id . '/' . $match['stored'];
if (!is_file($path)) {
    http_response_code(404);
    exit('File missing on disk');
}

$mime = (new finfo(FILEINFO_MIME_TYPE))->file($path) ?: 'application/octet-stream';
header('Content-Type: ' . $mime);
header('Content-Disposition: attachment; filename="' . str_replace('"', '', $match['original']) . '"');
header('Content-Length: ' . (string) filesize($path));
readfile($path);
