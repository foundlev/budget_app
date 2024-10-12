<?php
// Включаем заголовки для поддержки CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Чтение API ключа и пароля из файлов
$apiKey = trim(file_get_contents('currencies-api-key.txt'));
$passwordFromFile = trim(file_get_contents('currencies-password.txt'));

// Файл для хранения кэша
$cacheFile = 'currencies_stored.json';

// Проверка пароля
if (!isset($_GET['password']) || $_GET['password'] !== $passwordFromFile) {
    http_response_code(401); // Неправильный пароль
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Проверяем, есть ли кэш и не устарел ли он (менее 1 часа)
if (file_exists($cacheFile)) {
    $cache = json_decode(file_get_contents($cacheFile), true);
    $cacheTime = $cache['timestamp'] ?? 0;
    if (time() - $cacheTime < 3600) {
        // Если данные актуальны, возвращаем кэшированные данные
        echo json_encode($cache['data']);
        exit;
    }
}

// Функция для выполнения запроса к CoinMarketCap API
function fetch_crypto_data($url, $apiKey) {
    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "X-CMC_PRO_API_KEY: $apiKey",
            "Accept: application/json"
        ],
    ]);

    $response = curl_exec($curl);
    curl_close($curl);

    return json_decode($response, true);
}

// Запрос на получение котировок BTC, ETH, TON в USDT
$cryptoUrl1 = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=TON,BTC,ETH&convert=USDT";
$data1 = fetch_crypto_data($cryptoUrl1, $apiKey);

// Запрос на получение котировки USDT в USD
$cryptoUrl2 = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=USDT&convert=USD";
$data2 = fetch_crypto_data($cryptoUrl2, $apiKey);

// Запрос на получение котировки USDT в RUB
$cryptoUrl3 = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=USDT&convert=RUB";
$data3 = fetch_crypto_data($cryptoUrl3, $apiKey);

// Объединение данных
$result = [];

if (isset($data1['data']['BTC']['quote']['USDT']['price'])) {
    $result['BTC'] = [
        'rate' => $data1['data']['BTC']['quote']['USDT']['price'],
        'currency' => 'USDT'
    ];
}

if (isset($data1['data']['ETH']['quote']['USDT']['price'])) {
    $result['ETH'] = [
        'rate' => $data1['data']['ETH']['quote']['USDT']['price'],
        'currency' => 'USDT'
    ];
}

if (isset($data1['data']['TON']['quote']['USDT']['price'])) {
    $result['TON'] = [
        'rate' => $data1['data']['TON']['quote']['USDT']['price'],
        'currency' => 'USDT'
    ];
}

if (isset($data2['data']['USDT']['quote']['USD']['price'])) {
    $result['USDT_USD'] = [
        'rate' => $data2['data']['USDT']['quote']['USD']['price'],
        'currency' => 'USD'
    ];
}

if (isset($data3['data']['USDT']['quote']['RUB']['price'])) {
    $result['USDT_RUB'] = [
        'rate' => $data3['data']['USDT']['quote']['RUB']['price'],
        'currency' => 'RUB'
    ];
}

// Сохранение нового кэша с текущим временем запроса
$cacheData = [
    'timestamp' => time(),
    'data' => $result
];
file_put_contents($cacheFile, json_encode($cacheData));

// Возврат результата в формате JSON
echo json_encode($result);
