<?php
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);
$prompt = $data["prompt"];

$OPENAI_KEY = "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";  // ← APIキーをここに入れる

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
    ]
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);

echo $response;
