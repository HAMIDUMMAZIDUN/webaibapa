<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'Metode tidak diizinkan.']);
}

$configPath = dirname(__DIR__, 2) . '/private/config.php';
if (!is_file($configPath)) {
    respond(503, [
        'error' => 'Konfigurasi AI belum dipasang. Salin private/config.example.php menjadi private/config.php.',
        'setup_required' => true,
    ]);
}

$config = require $configPath;
if (!is_array($config)) {
    respond(500, ['error' => 'Format konfigurasi server tidak valid.']);
}

$allowedOrigin = trim((string)($config['allowed_origin'] ?? ''));
$requestOrigin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
if ($allowedOrigin !== '' && $requestOrigin !== '' && !hash_equals(rtrim($allowedOrigin, '/'), rtrim($requestOrigin, '/'))) {
    respond(403, ['error' => 'Origin permintaan tidak diizinkan.']);
}

$contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
if ($contentType !== '' && !str_contains($contentType, 'application/json')) {
    respond(415, ['error' => 'Content-Type harus application/json.']);
}

$rawBody = file_get_contents('php://input');
if ($rawBody === false || strlen($rawBody) > 10000000) {
    respond(413, ['error' => 'Ukuran permintaan terlalu besar (maksimal 10 MB).']);
}

try {
    $payload = json_decode($rawBody ?: '{}', true, 32, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    respond(400, ['error' => 'Format JSON tidak valid.']);
}

if (!is_array($payload)) {
    respond(400, ['error' => 'Format permintaan tidak valid.']);
}

$prompt = trim((string)($payload['prompt'] ?? ''));
$category = trim((string)($payload['category'] ?? 'Umum'));
$language = trim((string)($payload['language'] ?? 'Bahasa Indonesia'));
$tone = trim((string)($payload['tone'] ?? 'Profesional'));
$maxPromptChars = max(1000, (int)($config['max_prompt_chars'] ?? 12000));

$promptLength = function_exists('mb_strlen') ? mb_strlen($prompt) : strlen($prompt);
if ($promptLength < 5) {
    respond(400, ['error' => 'Tuliskan kebutuhan minimal 5 karakter.']);
}
if ($promptLength > $maxPromptChars) {
    respond(413, ['error' => "Teks terlalu panjang. Batas versi ini {$maxPromptChars} karakter."]);
}

// Rate limit sederhana berbasis berkas untuk melindungi kuota API pada shared hosting.
$limit = max(1, (int)($config['requests_per_hour_per_ip'] ?? 30));
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$window = gmdate('YmdH');
$rateDir = sys_get_temp_dir() . '/hidayat-ai-rate';
if (!is_dir($rateDir)) {
    @mkdir($rateDir, 0700, true);
}
$rateFile = $rateDir . '/' . hash('sha256', $ip . '|' . $window) . '.json';
$count = 0;
if (is_file($rateFile)) {
    $rateData = json_decode((string)@file_get_contents($rateFile), true);
    $count = is_array($rateData) ? (int)($rateData['count'] ?? 0) : 0;
}
if ($count >= $limit) {
    respond(429, ['error' => 'Batas penggunaan per jam tercapai. Silakan coba kembali pada jam berikutnya.']);
}
@file_put_contents($rateFile, json_encode(['count' => $count + 1, 'updated_at' => time()]), LOCK_EX);

$apiKey = trim((string)($config['openai_api_key'] ?? ''));
$model = trim((string)($config['openai_model'] ?? 'gpt-4o-mini'));
if ($apiKey === '' || str_contains($apiKey, 'ISI_OPENAI_API_KEY')) {
    respond(503, ['error' => 'OPENAI_API_KEY belum diisi pada private/config.php.', 'setup_required' => true]);
}
if (!function_exists('curl_init')) {
    respond(500, ['error' => 'Ekstensi PHP cURL belum aktif pada hosting.']);
}

$instructions = "Anda adalah Hidayat AI Generator, asisten profesional untuk akademik, pendidikan, penelitian, administrasi, presentasi, desain, dan kebutuhan umum. Jawab dalam {$language}. Gaya: {$tone}. Kategori pekerjaan: {$category}. Susun hasil yang jelas, sistematis, dapat langsung digunakan, dan jangan mengarang sumber atau data. Bila data penting belum tersedia, gunakan penanda [ISI DATA].";

$requestBody = [
    'model' => $model,
    'messages' => [
        [
            'role' => 'system',
            'content' => $instructions
        ],
        [
            'role' => 'user',
            'content' => $prompt
        ]
    ]
];

$ch = curl_init("https://api.openai.com/v1/chat/completions");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_TIMEOUT => 120,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($requestBody, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
]);

$responseBody = curl_exec($ch);
$curlError = curl_error($ch);
$statusCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($responseBody === false) {
    respond(502, ['error' => 'Tidak dapat terhubung ke layanan AI: ' . ($curlError ?: 'kesalahan jaringan.')]);
}

try {
    $response = json_decode($responseBody, true, 128, JSON_THROW_ON_ERROR);
} catch (JsonException) {
    respond(502, ['error' => 'Respons layanan AI tidak dapat dibaca.']);
}

if ($statusCode < 200 || $statusCode >= 300) {
    $message = (string)($response['error']['message'] ?? 'Layanan AI gagal memproses permintaan.');
    respond($statusCode >= 400 && $statusCode < 600 ? $statusCode : 502, ['error' => $message]);
}

$choices = $response['choices'] ?? null;
if (!$choices || !is_array($choices) || !isset($choices[0])) {
    respond(502, ['error' => 'Layanan AI tidak mengembalikan jawaban. Harap periksa pembatasan konten/keamanan.']);
}
$text = trim((string)($choices[0]['message']['content'] ?? ''));
if ($text === '') {
    $finishReason = $choices[0]['finish_reason'] ?? 'UNKNOWN';
    respond(502, ['error' => "Layanan AI tidak menghasilkan teks. Alasan: {$finishReason}."]);
}

respond(200, [
    'text' => $text,
    'model' => $model,
    'request_id' => '',
]);
