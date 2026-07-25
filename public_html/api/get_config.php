<?php
header('Content-Type: application/json');

$config = [];
if (file_exists(__DIR__ . '/../../private/config.php')) {
    $config = include __DIR__ . '/../../private/config.php';
}

$allowedOrigin = $config['allowed_origin'] ?? '';
if (!empty($allowedOrigin)) {
    header("Access-Control-Allow-Origin: $allowedOrigin");
}

echo json_encode([
    'supabase_url' => $config['supabase_url'] ?? '',
    'supabase_anon_key' => $config['supabase_anon_key'] ?? '',
]);
