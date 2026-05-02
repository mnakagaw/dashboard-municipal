<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$body = file_get_contents("php://input");
$data = json_decode($body, true);

if (!$data || !isset($data["prompt"])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing prompt"]);
    exit;
}

$prompt = $data["prompt"];

// Leer la API key desde variable de entorno del servidor
$OPENAI_KEY = getenv('OPENAI_API_KEY');

// Fallback: leer desde .env.local en el mismo directorio
if (!$OPENAI_KEY && file_exists(__DIR__ . '/.env.local')) {
    $lines = file(__DIR__ . '/.env.local', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '#') === 0)
            continue; // Ignorar comentarios
        if (strpos($line, 'OPENAI_API_KEY=') === 0) {
            $OPENAI_KEY = trim(substr($line, strlen('OPENAI_API_KEY=')));
        }
    }
}

if (!$OPENAI_KEY) {
    http_response_code(500);
    echo json_encode([
        "error" => "API key not configured. Set OPENAI_API_KEY environment variable or create
api/.env.local"
    ]);
    exit;
}

$ch = curl_init("https://api.openai.com/v1/chat/completions");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $OPENAI_KEY
]);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "model" => "gpt-4o-mini",
    "messages" => [
        ["role" => "user", "content" => $prompt]
    ],
    "temperature" => 0.4,
    "max_tokens" => 1800
], JSON_UNESCAPED_UNICODE));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($response === false) {
    http_response_code(502);
    echo json_encode(["error" => curl_error($ch)]);
    exit;
}

if ($httpCode >= 400) {
    http_response_code($httpCode);
    $decoded = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        echo json_encode($decoded, JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(["error" => "OpenAI API error", "status" => $httpCode]);
    }
    exit;
}

echo $response;
