<?php
header('Content-Type: application/json');

// Membaca konfigurasi untuk allowed_origin
$config = [];
if (file_exists(__DIR__ . '/../../private/config.php')) {
    $config = include __DIR__ . '/../../private/config.php';
}

// Set CORS headers jika ada konfigurasi allowed_origin
$allowedOrigin = $config['allowed_origin'] ?? '';
if (!empty($allowedOrigin)) {
    header("Access-Control-Allow-Origin: $allowedOrigin");
}

$url = $_GET['url'] ?? '';
$url = str_replace(' ', '%20', $url);
if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'URL tidak valid.']);
    exit;
}

// Inisialisasi cURL untuk mengunduh halaman web
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
$html = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($html === false || $httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'Gagal mengunduh halaman web. Pastikan URL dapat diakses publik.']);
    exit;
}

// Bersihkan HTML dari skrip, gaya, dan tag
$html = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $html);
$html = preg_replace('/<style\b[^>]*>(.*?)<\/style>/is', '', $html);
$text = strip_tags($html);
$text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
$text = preg_replace('/[ \t]+/', ' ', $text);
$text = preg_replace('/\n\s*\n+/', "\n\n", $text);
$text = trim($text);

// Batasi panjang teks untuk menghemat token input
if (mb_strlen($text) > 30000) {
    $text = mb_substr($text, 0, 30000) . '... [Teks dipotong karena terlalu panjang]';
}

echo json_encode(['text' => $text]);
