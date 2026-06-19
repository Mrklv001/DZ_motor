<?php
declare(strict_types=1);

require_once __DIR__ . '/includes/auth.php';
$admin = require_login();

$blocks = require __DIR__ . '/../inc/content_blocks.php';
$key = (string) ($_GET['key'] ?? '');
$flash = '';
$flashType = 'success';

function read_block_content(array $block): ?string
{
    $html = file_get_contents($block['file']);
    if ($html === false) {
        return null;
    }
    $start = strpos($html, $block['marker_start']);
    $end = strpos($html, $block['marker_end']);
    if ($start === false || $end === false || $end < $start) {
        return null;
    }
    $start += strlen($block['marker_start']);
    return trim(substr($html, $start, $end - $start));
}

function write_block_content(array $block, string $newContent): bool
{
    $html = file_get_contents($block['file']);
    if ($html === false) {
        return false;
    }
    $start = strpos($html, $block['marker_start']);
    $end = strpos($html, $block['marker_end']);
    if ($start === false || $end === false || $end < $start) {
        return false;
    }
    $start += strlen($block['marker_start']);
    $updated = substr($html, 0, $start) . "\n" . $newContent . "\n\t\t  \t" . substr($html, $end);

    copy($block['file'], $block['file'] . '.bak');
    return file_put_contents($block['file'], $updated) !== false;
}

if ($key !== '' && isset($blocks[$key]) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verify_csrf()) {
        $flash = 'Сессия истекла, попробуйте снова.';
        $flashType = 'error';
    } else {
        $blockType = $blocks[$key]['type'] ?? 'richtext';
        $newContent = (string) ($_POST['content'] ?? '');
        if ($blockType === 'text') {
            $newContent = e(trim($newContent));
        }
        if (write_block_content($blocks[$key], $newContent)) {
            $flash = 'Сохранено. Изменения уже опубликованы на сайте.';
        } else {
            $flash = 'Не удалось сохранить — маркеры контента не найдены в файле.';
            $flashType = 'error';
        }
    }
}

$activeNav = 'content';
$pageTitle = 'Контент';
require __DIR__ . '/includes/layout_top.php';
?>

<?php if ($flash !== ''): ?>
	<div class="flash-<?= e($flashType) ?>"><?= e($flash) ?></div>
<?php endif; ?>

<?php if ($key !== '' && isset($blocks[$key])): ?>
	<?php $block = $blocks[$key]; $content = read_block_content($block); ?>
	<p><a href="content.php">&larr; Назад к списку блоков</a></p>
	<div class="admin-card">
		<h3><?= e($block['label']) ?></h3>
		<?php $blockType = $block['type'] ?? 'richtext'; ?>
		<?php if ($content === null): ?>
			<div class="flash-error">Не удалось найти маркеры контента в файле <?= e($block['file']) ?>.</div>
		<?php elseif ($blockType === 'text'): ?>
			<form method="post">
				<?= csrf_field() ?>
				<div class="admin-form-row">
					<label>Текст</label>
					<input type="text" name="content" value="<?= $content ?>">
				</div>
				<button type="submit" class="btn">Сохранить</button>
			</form>
		<?php else: ?>
			<link rel="stylesheet" href="assets/vendor/quill.snow.css">
			<form method="post" id="content-form">
				<?= csrf_field() ?>
				<div class="admin-form-row">
					<label>Текст страницы</label>
					<div id="editor-content"><?= $content ?></div>
					<textarea name="content" id="editor-source" style="display:none"></textarea>
				</div>
				<button type="submit" class="btn">Сохранить</button>
			</form>
			<script src="assets/vendor/quill.min.js"></script>
			<script>
				var quill = new Quill('#editor-content', {
					theme: 'snow',
					modules: {
						toolbar: [
							[{ header: [2, 3, false] }],
							['bold', 'italic', 'underline'],
							[{ list: 'ordered' }, { list: 'bullet' }],
							[{ align: [] }],
							['link'],
							['clean']
						]
					}
				});
				document.getElementById('content-form').addEventListener('submit', function () {
					document.getElementById('editor-source').value = document.getElementById('editor-content').querySelector('.ql-editor').innerHTML;
				});
			</script>
		<?php endif; ?>
	</div>
<?php else: ?>
	<?php
	$langs = [];
	foreach ($blocks as $blockKey => $block) {
		$lang = $block['lang'] ?? 'RU';
		$group = $block['group'] ?? 'Прочее';
		$langs[$lang][$group][$blockKey] = $block;
	}
	?>
	<?php foreach ($langs as $langName => $groups): ?>
		<h2 class="lang-section-title"><?= e($langName) ?></h2>
		<?php foreach ($groups as $groupName => $groupBlocks): ?>
			<div class="admin-card">
				<h3><?= e($groupName) ?></h3>
				<table class="admin-table">
					<thead><tr><th></th><th></th></tr></thead>
					<tbody>
						<?php foreach ($groupBlocks as $blockKey => $block): ?>
							<tr>
								<td><?= e($block['label']) ?></td>
								<td><a href="content.php?key=<?= e($blockKey) ?>">Редактировать</a></td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			</div>
		<?php endforeach; ?>
	<?php endforeach; ?>
<?php endif; ?>

<?php require __DIR__ . '/includes/layout_bottom.php'; ?>
