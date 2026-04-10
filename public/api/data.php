<?php
/**
 * data.php — PHP API for CoreServer (MariaDB backend)
 *
 * Endpoint:
 *   /api/data.php?key={assetKey}    — returns JSON for the specified dataset
 *   /api/data.php                   — returns list of all active datasets
 *
 * Returns the raw JSON content from dataset_assets table,
 * fully compatible with the original static JSON files.
 *
 * DB config is read from .env.local in the same directory:
 *   DB_HOST=localhost
 *   DB_NAME=carapicha_dbt
 *   DB_USER=carapicha_dbt
 *   DB_PASS=xxxxx
 */

// ---- Load config from .env.local ----
$envFile = __DIR__ . '/.env.local';
$config = [];
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || $trimmed[0] === '#') continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $config[trim($parts[0])] = trim($parts[1]);
        }
    }
}

$dbHost = isset($config['DB_HOST']) ? $config['DB_HOST'] : 'localhost';
$dbName = isset($config['DB_NAME']) ? $config['DB_NAME'] : 'carapicha_dbt';
$dbUser = isset($config['DB_USER']) ? $config['DB_USER'] : '';
$dbPass = isset($config['DB_PASS']) ? $config['DB_PASS'] : '';

// ---- Parse request ----
$assetKey = '';
if (isset($_GET['key'])) {
    $assetKey = trim($_GET['key']);
} elseif (isset($_SERVER['PATH_INFO'])) {
    $assetKey = trim($_SERVER['PATH_INFO'], '/');
}

// ---- CORS headers ----
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---- List mode (no key) ----
if ($assetKey === '') {
    header('Content-Type: application/json; charset=utf-8');
    try {
        $pdo = buildConnection($dbHost, $dbName, $dbUser, $dbPass);
        $stmt = $pdo->query("
            SELECT asset_key, version_no, content_hash, source_name, updated_at, notes
            FROM dataset_assets
            WHERE is_active = 1
            ORDER BY asset_key
        ");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($rows, JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(array('error' => 'Database error: ' . $e->getMessage()));
    }
    exit;
}

// ---- Validate key ----
if (!preg_match('/^[a-z0-9_]+$/', $assetKey)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(array('error' => 'Invalid asset key format.'));
    exit;
}

// ---- Fetch dataset ----
try {
    $pdo = buildConnection($dbHost, $dbName, $dbUser, $dbPass);

    $stmt = $pdo->prepare("
        SELECT json_content
        FROM dataset_assets
        WHERE asset_key = :key AND is_active = 1
    ");
    $stmt->execute(array(':key' => $assetKey));
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(array('error' => "Dataset '$assetKey' not found or inactive."));
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    echo $row['json_content'];

} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(array('error' => 'Database error: ' . $e->getMessage()));
}

// =============================================================================
function buildConnection($host, $dbName, $user, $password) {
    $dsn = "mysql:host=$host;dbname=$dbName;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $password, array(
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ));
    return $pdo;
}
