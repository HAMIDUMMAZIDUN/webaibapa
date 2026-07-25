<?php
header('Content-Type: application/json');

// Membaca konfigurasi untuk allowed_origin
$config = [];
if (file_exists(__DIR__ . '/../../private/config.php')) {
    $config = include __DIR__ . '/../../private/config.php';
}

$allowedOrigin = $config['allowed_origin'] ?? '';
if (!empty($allowedOrigin)) {
    header("Access-Control-Allow-Origin: $allowedOrigin");
}

$q = $_GET['q'] ?? '';
$engine = $_GET['engine'] ?? 'wikipedia';
$type = $_GET['type'] ?? 'cepat';

if (empty($q)) {
    http_response_code(400);
    echo json_encode(['error' => 'Query pencarian kosong.']);
    exit;
}

$results = [];
$limit = ($type === 'dalam') ? 10 : 5;

if ($engine === 'wikipedia') {
    // Cari di Wikipedia Bahasa Indonesia dengan srlimit sesuai tipe riset
    $url = 'https://id.wikipedia.org/w/api.php?action=query&list=search&srlimit=' . $limit . '&srsearch=' . urlencode($q) . '&format=json';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    $res = curl_exec($ch);
    curl_close($ch);
    
    if ($res) {
        $data = json_decode($res, true);
        $search = $data['query']['search'] ?? [];
        foreach ($search as $item) {
            $results[] = [
                'title' => $item['title'],
                'snippet' => strip_tags($item['snippet']),
                'url' => 'https://id.wikipedia.org/wiki/' . rawurlencode($item['title']),
                'type' => 'wikipedia'
            ];
        }
    }
} else {
    // Cari menggunakan DuckDuckGo HTML search
    $url = 'https://html.duckduckgo.com/html/?q=' . urlencode($q);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    $html = curl_exec($ch);
    curl_close($ch);
    
    if ($html) {
        // Ekstraksi hasil pencarian dari HTML DuckDuckGo
        preg_match_all('/<a class="result__snippet"[^>]*>(.*?)<\/a>/is', $html, $snippetMatches);
        preg_match_all('/<a class="result__url"[^>]* href="([^"]+)"/is', $html, $linkMatches);
        preg_match_all('/<a class="result__a"[^>]*>(.*?)<\/a>/is', $html, $titleMatches);
        
        $count = min(count($titleMatches[1] ?? []), $limit);
        for ($i = 0; $i < $count; $i++) {
            $rawUrl = $linkMatches[1][$i] ?? '';
            // Bersihkan URL redirect DuckDuckGo jika ada
            if (preg_match('/uddg=([^&]+)/', $rawUrl, $m)) {
                $rawUrl = urldecode($m[1]);
            }
            $results[] = [
                'title' => strip_tags($titleMatches[1][$i] ?? 'Hasil Pencarian'),
                'snippet' => strip_tags($snippetMatches[1][$i] ?? ''),
                'url' => $rawUrl,
                'type' => 'web'
            ];
        }
    }
}

// Fallback jika tidak menemukan hasil apa pun
if (empty($results) && $engine !== 'wikipedia') {
    $url = 'https://id.wikipedia.org/w/api.php?action=query&list=search&srlimit=' . $limit . '&srsearch=' . urlencode($q) . '&format=json';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $res = curl_exec($ch);
    curl_close($ch);
    if ($res) {
        $data = json_decode($res, true);
        $search = $data['query']['search'] ?? [];
        foreach ($search as $item) {
            $results[] = [
                'title' => $item['title'],
                'snippet' => strip_tags($item['snippet']),
                'url' => 'https://id.wikipedia.org/wiki/' . rawurlencode($item['title']),
                'type' => 'wikipedia'
            ];
        }
    }
}

echo json_encode(['results' => $results]);
