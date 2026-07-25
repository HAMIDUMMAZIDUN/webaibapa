<?php
/**
 * Salin file ini menjadi config.php, lalu isi kunci API OpenAI/GPT.
 * Letakkan folder private sejajar dengan public_html, bukan di dalam public_html.
 */
return [
    'openai_api_key' => 'ISI_OPENAI_API_KEY_DI_SINI',
    'openai_model' => 'gpt-4o-mini',
    'max_prompt_chars' => 2000000,
    'requests_per_hour_per_ip' => 30,
    // Kosongkan agar otomatis memakai host saat ini. Contoh: https://ai.domainanda.id
    'allowed_origin' => '',
    'supabase_url' => '',
    'supabase_anon_key' => '',
];
