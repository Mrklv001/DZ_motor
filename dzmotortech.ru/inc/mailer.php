<?php
declare(strict_types=1);

/**
 * Minimal dependency-free SMTP client (AUTH LOGIN, SSL/STARTTLS).
 * Written by hand instead of pulling in PHPMailer because shared hosting
 * (reg.ru Host-0) may not offer SSH/Composer to install vendor packages.
 */
class SmtpMailer
{
    private string $host;
    private int $port;
    private string $secure; // 'ssl' or 'tls'
    private string $username;
    private string $password;
    private string $fromEmail;
    private string $fromName;

    public function __construct(array $smtpConfig)
    {
        $this->host = $smtpConfig['host'];
        $this->port = (int) $smtpConfig['port'];
        $this->secure = $smtpConfig['secure'] ?? 'ssl';
        $this->username = $smtpConfig['username'];
        $this->password = $smtpConfig['password'];
        $this->fromEmail = $smtpConfig['from_email'];
        $this->fromName = $smtpConfig['from_name'] ?? $smtpConfig['from_email'];
    }

    /**
     * @throws RuntimeException on any SMTP failure
     */
    public function send(string $toEmail, string $subject, string $body): void
    {
        $transport = $this->secure === 'ssl' ? 'ssl://' : 'tcp://'; // 'tls' upgrades via STARTTLS below; 'none' stays plain
        $errno = 0;
        $errstr = '';
        $socket = @stream_socket_client(
            $transport . $this->host . ':' . $this->port,
            $errno,
            $errstr,
            15,
            STREAM_CLIENT_CONNECT
        );
        if (!$socket) {
            throw new RuntimeException("SMTP connect failed: $errstr ($errno)");
        }

        $this->readResponse($socket, 220);
        $this->command($socket, 'EHLO ' . $this->host, 250);

        if ($this->secure === 'tls') {
            $this->command($socket, 'STARTTLS', 220);
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($socket);
                throw new RuntimeException('STARTTLS negotiation failed');
            }
            $this->command($socket, 'EHLO ' . $this->host, 250);
        }

        $this->command($socket, 'AUTH LOGIN', 334);
        $this->command($socket, base64_encode($this->username), 334);
        $this->command($socket, base64_encode($this->password), 235);

        $this->command($socket, 'MAIL FROM:<' . $this->fromEmail . '>', 250);
        $this->command($socket, 'RCPT TO:<' . $toEmail . '>', 250);
        $this->command($socket, 'DATA', 354);

        $headers = $this->buildHeaders($toEmail, $subject);
        $encodedBody = chunk_split(base64_encode($body));
        $message = $headers . "\r\n" . $encodedBody;
        // Escape lines that start with a lone dot, per SMTP DATA rules.
        $message = preg_replace('/^\./m', '..', $message);

        fwrite($socket, $message . "\r\n.\r\n");
        $this->readResponse($socket, 250);

        fwrite($socket, "QUIT\r\n");
        fclose($socket);
    }

    private function buildHeaders(string $toEmail, string $subject): string
    {
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $encodedFromName = '=?UTF-8?B?' . base64_encode($this->fromName) . '?=';
        $lines = [
            'From: ' . $encodedFromName . ' <' . $this->fromEmail . '>',
            'To: <' . $toEmail . '>',
            'Subject: ' . $encodedSubject,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            'Date: ' . date('r'),
        ];
        return implode("\r\n", $lines) . "\r\n";
    }

    /**
     * @param resource $socket
     */
    private function command($socket, string $command, int $expectedCode): string
    {
        fwrite($socket, $command . "\r\n");
        return $this->readResponse($socket, $expectedCode);
    }

    /**
     * @param resource $socket
     */
    private function readResponse($socket, int $expectedCode): string
    {
        $response = '';
        while (($line = fgets($socket, 515)) !== false) {
            $response .= $line;
            // Multi-line responses have a dash after the code; final line has a space.
            if (preg_match('/^\d{3} /', $line)) {
                break;
            }
        }
        $code = (int) substr($response, 0, 3);
        if ($code !== $expectedCode) {
            fclose($socket);
            throw new RuntimeException("SMTP error: expected $expectedCode, got: $response");
        }
        return $response;
    }
}

/**
 * SMTP settings editable in admin/settings.php (stored in the `settings` table)
 * take priority; inc/config.php values are only used as a fallback so the
 * site keeps working before the admin has filled in the settings page.
 */
function get_smtp_settings(): array
{
    $smtp = app_config()['smtp'];
    $overrides = [
        'host' => get_setting('smtp_host', ''),
        'port' => get_setting('smtp_port', ''),
        'secure' => get_setting('smtp_secure', ''),
        'username' => get_setting('smtp_username', ''),
        'password' => get_setting('smtp_password', ''),
        'from_email' => get_setting('smtp_from_email', ''),
        'from_name' => get_setting('smtp_from_name', ''),
    ];
    foreach ($overrides as $key => $value) {
        if ($value !== '') {
            $smtp[$key] = $key === 'port' ? (int) $value : $value;
        }
    }
    return $smtp;
}

function send_lead_notification(array $lead): void
{
    $smtp = get_smtp_settings();
    $toEmail = get_setting('notify_email', $smtp['from_email']);

    $subject = sprintf('Новая заявка с сайта (%s): %s', strtoupper($lead['lang']), $lead['name']);
    $bodyLines = [
        'Новая заявка с формы обратной связи.',
        '',
        'Имя: ' . $lead['name'],
        'Компания: ' . ($lead['company'] ?: '-'),
        'Телефон: ' . $lead['phone'],
        'Email: ' . $lead['email'],
        'Тип задачи: ' . ($lead['task_type'] ?: '-'),
        'Мощность/напряжение: ' . ($lead['power'] ?: '-'),
        'Комментарий: ' . ($lead['message'] ?: '-'),
        'Вложений: ' . (int) ($lead['attachments_count'] ?? 0),
        'Язык страницы: ' . $lead['lang'],
        'Дата: ' . date('Y-m-d H:i:s'),
    ];
    $body = implode("\n", $bodyLines);

    $mailer = new SmtpMailer($smtp);
    $mailer->send($toEmail, $subject, $body);
}
