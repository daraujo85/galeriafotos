<?php
// Script para download de múltiplas fotos em ZIP
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['fotos']) || !is_array($input['fotos'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Lista de fotos não fornecida']);
    exit;
}

$fotos = $input['fotos'];

// Criar ZIP temporário
$zipFile = tempnam(sys_get_temp_dir(), 'galeria_');
$zip = new ZipArchive();

if ($zip->open($zipFile, ZipArchive::CREATE) !== TRUE) {
    http_response_code(500);
    echo json_encode(['error' => 'Não foi possível criar o arquivo ZIP']);
    exit;
}

$added = 0;
foreach ($fotos as $foto) {
    // Validar caminho (segurança)
    $foto = str_replace('..', '', $foto); // Prevenir directory traversal
    $fotoPath = $foto;
    
    if (file_exists($fotoPath) && is_file($fotoPath)) {
        $zip->addFile($fotoPath, basename($fotoPath));
        $added++;
    }
}

$zip->close();

if ($added === 0) {
    unlink($zipFile);
    http_response_code(404);
    echo json_encode(['error' => 'Nenhuma foto válida encontrada']);
    exit;
}

// Enviar ZIP
$zipName = 'fotos_' . date('Y-m-d_His') . '.zip';

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $zipName . '"');
header('Content-Length: ' . filesize($zipFile));

readfile($zipFile);
unlink($zipFile);
exit;

