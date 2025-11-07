<?php
// Função para listar álbuns (pastas dentro de 'fotos')
function listarAlbuns() {
    $albuns = [];
    $fotosDir = 'fotos';
    
    if (is_dir($fotosDir)) {
        $diretorios = scandir($fotosDir);
        foreach ($diretorios as $dir) {
            if ($dir != '.' && $dir != '..' && is_dir($fotosDir . '/' . $dir)) {
                $albuns[] = $dir;
            }
        }
    }
    
    return $albuns;
}

// Função para listar fotos de um álbum
function listarFotos($album) {
    $fotos = [];
    $albumPath = 'fotos/' . $album;
    
    if (is_dir($albumPath)) {
        $arquivos = scandir($albumPath);
        $extensoesPermitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        
        foreach ($arquivos as $arquivo) {
            $extensao = strtolower(pathinfo($arquivo, PATHINFO_EXTENSION));
            if (in_array($extensao, $extensoesPermitidas)) {
                $fotos[] = [
                    'nome' => $arquivo,
                    'caminho' => $albumPath . '/' . $arquivo,
                    'url' => urlencode($albumPath . '/' . $arquivo)
                ];
            }
        }
    }
    
    return $fotos;
}

// Obter álbum atual
$albumAtual = isset($_GET['album']) ? $_GET['album'] : null;
$albuns = listarAlbuns();
$fotos = $albumAtual ? listarFotos($albumAtual) : [];

// Metadados de compartilhamento (Open Graph / Twitter)
// Construir URL absoluta atual
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
$basePath = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
$currentUrl = $scheme . '://' . $host . (isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '/');

// Escolher imagem para preview: primeira foto do álbum atual, ou do primeiro álbum disponível
$previewImagePath = null;
if ($albumAtual && !empty($fotos)) {
    $previewImagePath = $fotos[0]['caminho'];
} else {
    if (!empty($albuns)) {
        $fotosPrimeiroAlbum = listarFotos($albuns[0]);
        if (!empty($fotosPrimeiroAlbum)) {
            $previewImagePath = $fotosPrimeiroAlbum[0]['caminho'];
        }
    }
}

// Converter caminho relativo em URL absoluta; fallback para placeholder caso não haja fotos
if ($previewImagePath) {
    $absoluteImageUrl = $scheme . '://' . $host . ($basePath ? '/' . $basePath : '') . '/' . ltrim($previewImagePath, '/');
    // Normalizar barras duplicadas
    $absoluteImageUrl = preg_replace('#(?<!:)//+#', '/', $absoluteImageUrl);
} else {
    $absoluteImageUrl = 'https://via.placeholder.com/1200x630.png?text=Galeria+de+Fotos';
}

$ogTitle = $albumAtual ? ('Galeria: ' . $albumAtual) : 'Galeria de Fotos';
$ogDescription = $albumAtual
    ? ('Veja o álbum "' . $albumAtual . '" — ' . count($fotos) . ' foto(s).')
    : 'Explore os álbuns e veja todas as fotos.';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($ogTitle); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($ogDescription); ?>">

    <!-- Open Graph -->
    <meta property="og:title" content="<?php echo htmlspecialchars($ogTitle); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($ogDescription); ?>">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Galeria de Fotos">
    <meta property="og:url" content="<?php echo htmlspecialchars($currentUrl); ?>">
    <meta property="og:image" content="<?php echo htmlspecialchars($absoluteImageUrl); ?>">
    <meta property="og:locale" content="pt_BR">

    <!-- Twitter Card (usado por vários apps de chat também) -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($ogTitle); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($ogDescription); ?>">
    <meta name="twitter:image" content="<?php echo htmlspecialchars($absoluteImageUrl); ?>">
    <link rel="canonical" href="<?php echo htmlspecialchars($currentUrl); ?>">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <!-- Sidebar com álbuns -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <h1>📷 Galeria</h1>
            </div>
            <nav class="albuns-list">
                <?php if (empty($albuns)): ?>
                    <p class="no-albums">Nenhum álbum encontrado</p>
                    <p class="hint">Crie pastas dentro de 'fotos' para organizar suas fotos</p>
                <?php else: ?>
                    <a href="?" class="album-item <?php echo !$albumAtual ? 'active' : ''; ?>">
                        <span>🏠 Todos os Álbuns</span>
                    </a>
                    <?php foreach ($albuns as $album): ?>
                        <a href="?album=<?php echo urlencode($album); ?>" 
                           class="album-item <?php echo $albumAtual === $album ? 'active' : ''; ?>">
                            <span>📁 <?php echo htmlspecialchars($album); ?></span>
                        </a>
                    <?php endforeach; ?>
                <?php endif; ?>
            </nav>
        </aside>

        <!-- Área principal -->
        <main class="main-content">
            <?php if ($albumAtual && !empty($fotos)): ?>
                <!-- Barra de ferramentas -->
                <div class="toolbar">
                    <div class="toolbar-left">
                        <h2><?php echo htmlspecialchars($albumAtual); ?></h2>
                        <span class="photo-count"><?php echo count($fotos); ?> foto(s)</span>
                    </div>
                    <div class="toolbar-right">
                        <button class="btn btn-secondary" id="selectAllBtn">Selecionar Todas</button>
                        <button class="btn btn-secondary" id="deselectAllBtn" style="display:none;">Deselecionar Todas</button>
                        <button class="btn btn-primary" id="downloadSelectedBtn" style="display:none;">
                            📥 Download Selecionadas (<span id="selectedCount">0</span>)
                        </button>
                        <button class="btn btn-primary" id="downloadAllBtn">📥 Download Todas</button>
                        <button class="btn btn-accent" id="slideshowBtn">▶️ Slideshow</button>
                    </div>
                </div>

                <!-- Grid de fotos (renderização sob demanda via JS) -->
                <div class="photos-grid" id="photosGrid"></div>
            <?php elseif ($albumAtual && empty($fotos)): ?>
                <div class="empty-state">
                    <p>📭 Este álbum está vazio</p>
                </div>
            <?php else: ?>
                <div class="welcome-screen">
                    <h2>Bem-vindo à Galeria de Fotos</h2>
                    <p>Selecione um álbum na barra lateral para começar</p>
                    <?php if (!empty($albuns)): ?>
                        <div class="albums-preview">
                            <?php foreach ($albuns as $album): ?>
                                <a href="?album=<?php echo urlencode($album); ?>" class="album-card">
                                    <div class="album-card-icon">📁</div>
                                    <div class="album-card-name"><?php echo htmlspecialchars($album); ?></div>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </main>
    </div>

    <!-- Lightbox -->
    <div class="lightbox" id="lightbox" style="display:none;">
        <button class="lightbox-close" onclick="closeLightbox()">×</button>
        <button class="lightbox-nav lightbox-prev" onclick="changePhoto(-1)"><span class="arrow-left"></span></button>
        <button class="lightbox-nav lightbox-next" onclick="changePhoto(1)"><span class="arrow-right"></span></button>
        <div class="lightbox-content">
            <img id="lightboxImage" src="" alt="">
            <div class="lightbox-info">
                <span id="lightboxCounter"></span>
                <button class="btn-icon" onclick="downloadCurrentPhoto()" title="Download">📥</button>
            </div>
        </div>
    </div>

    <!-- Slideshow -->
    <div class="slideshow" id="slideshow" style="display:none;">
        <button class="slideshow-close" onclick="stopSlideshow()">×</button>
        <button class="slideshow-nav slideshow-prev" onclick="slideshowPrev()"><span class="arrow-left"></span></button>
        <button class="slideshow-nav slideshow-next" onclick="slideshowNext()"><span class="arrow-right"></span></button>
        <div class="slideshow-content">
            <img id="slideshowImage" src="" alt="">
            <div class="slideshow-controls">
                <button class="btn btn-secondary" onclick="toggleSlideshowPause()" id="pauseBtn">⏸️ Pausar</button>
                <span id="slideshowCounter"></span>
            </div>
        </div>
    </div>

    <script>
        // Dados das fotos para JavaScript
        const fotos = <?php echo json_encode($fotos); ?>;
    </script>
    <script src="script.js"></script>
</body>
</html>

