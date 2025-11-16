<?php
$src = isset($_GET['src']) ? $_GET['src'] : null;
$w = isset($_GET['w']) ? (int)$_GET['w'] : 400;
$h = isset($_GET['h']) ? (int)$_GET['h'] : 400;

if (!$src) { http_response_code(400); exit('src não informado'); }
$src = str_replace(['..', '\\'], ['', '/'], $src);
if (strpos($src, 'fotos/') !== 0) { http_response_code(403); exit('src inválido'); }

$path = $src;
if (!file_exists($path) || !is_file($path)) { http_response_code(404); exit('arquivo não encontrado'); }

$cacheDir = 'fotos/.cache/thumbs';
if (!is_dir($cacheDir)) { @mkdir($cacheDir, 0777, true); }
$cacheKey = md5($path . '|' . $w . 'x' . $h);
$cacheFile = $cacheDir . '/' . $cacheKey . '.jpg';

header('Cache-Control: max-age=31536000, public');

if (file_exists($cacheFile)) {
    header('Content-Type: image/jpeg');
    readfile($cacheFile);
    exit;
}

$ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
$supported = ['jpg','jpeg','png','gif','webp','bmp'];

if (!extension_loaded('gd') || !in_array($ext, $supported)) {
    header('Content-Type: ' . mime_content_type($path));
    readfile($path);
    exit;
}

switch ($ext) {
    case 'jpg':
    case 'jpeg': $srcImg = imagecreatefromjpeg($path); break;
    case 'png':  $srcImg = imagecreatefrompng($path); break;
    case 'gif':  $srcImg = imagecreatefromgif($path); break;
    case 'webp':
        if (function_exists('imagecreatefromwebp')) { $srcImg = imagecreatefromwebp($path); }
        else { header('Content-Type: ' . mime_content_type($path)); readfile($path); exit; }
        break;
    case 'bmp':
        if (function_exists('imagecreatefrombmp')) { $srcImg = imagecreatefrombmp($path); }
        else { header('Content-Type: ' . mime_content_type($path)); readfile($path); exit; }
        break;
}

if (!$srcImg) { http_response_code(500); exit('falha ao ler imagem'); }

$srcW = imagesx($srcImg);
$srcH = imagesy($srcImg);
$scale = max($w / $srcW, $h / $srcH);
$scaledW = (int)floor($srcW * $scale);
$scaledH = (int)floor($srcH * $scale);

$tmp = imagecreatetruecolor($scaledW, $scaledH);
imagecopyresampled($tmp, $srcImg, 0, 0, 0, 0, $scaledW, $scaledH, $srcW, $srcH);

$dst = imagecreatetruecolor($w, $h);
$offsetX = (int)floor(($scaledW - $w) / 2);
$offsetY = (int)floor(($scaledH - $h) / 2);
imagecopy($dst, $tmp, 0, 0, $offsetX, $offsetY, $w, $h);

imagejpeg($dst, $cacheFile, 80);

header('Content-Type: image/jpeg');
readfile($cacheFile);

imagedestroy($srcImg);
imagedestroy($tmp);
imagedestroy($dst);