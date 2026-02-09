<?php
header("Content-Type: application/json");

$body = file_get_contents("php://input");
$data = json_decode($body, true);

if (!$data || !isset($data["prompt"])) {
    echo json_encode(["error" => "Missing prompt"]);
    exit;
}

$prompt = $data["prompt"];

$OPENAI_KEY = ""; // Replace with your key or use environment variable

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
    "temperature" => 0.4
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);

if ($response === false) {
    echo json_encode(["error" => curl_error($ch)]);
    exit;
}

echo $response;
