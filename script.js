// Variáveis globais
let currentPhotoIndex = 0;
let selectedPhotos = new Set();
let slideshowInterval = null;
let slideshowPaused = false;
let slideshowIndex = 0;

// Renderização sob demanda
let renderedCount = 0;
let observer = null;
let sentinel = null;
const BATCH_SIZE = 30; // quantidade de thumbs por lote

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initInfiniteGrid();
    setupEventListeners();
    updateSelectedCount();
    updateToolbarButtons();
});

// Gerar poster (thumb) para vídeos via canvas
async function generateVideoPoster(foto, width = 400, height = 400) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = foto.caminho;
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';

        const onError = () => reject(new Error('Falha ao carregar vídeo'));
        video.addEventListener('error', onError, { once: true });

        video.addEventListener('loadeddata', () => {
            try {
                const targetTime = Math.min(1, (video.duration || 2) / 2);
                video.currentTime = targetTime;
            } catch (e) {
                reject(e);
            }
        }, { once: true });

        video.addEventListener('seeked', () => {
            try {
                const vw = video.videoWidth || 640;
                const vh = video.videoHeight || 360;

                const scale = Math.max(width / vw, height / vh);
                const scaledW = Math.floor(vw * scale);
                const scaledH = Math.floor(vh * scale);
                const offsetX = Math.floor((scaledW - width) / 2);
                const offsetY = Math.floor((scaledH - height) / 2);

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Desenha centralizado (cover)
                ctx.drawImage(video, -offsetX, -offsetY, scaledW, scaledH);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            } catch (e) {
                reject(e);
            }
        }, { once: true });
    });
}

// Criar item de foto (thumb) dinamicamente
function createPhotoItem(index, foto) {
    const item = document.createElement('div');
    item.className = 'photo-item';
    item.setAttribute('data-index', index);
    item.setAttribute('data-path', foto.caminho);
    item.addEventListener('click', () => openLightbox(index));

    const checkboxWrap = document.createElement('div');
    checkboxWrap.className = 'photo-checkbox';
    checkboxWrap.addEventListener('click', (e) => e.stopPropagation());

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'photo-select';
    checkbox.setAttribute('data-path', foto.caminho);
    checkbox.addEventListener('change', function() {
        const path = this.getAttribute('data-path');
        if (this.checked) {
            selectedPhotos.add(path);
            item.classList.add('selected');
        } else {
            selectedPhotos.delete(path);
            item.classList.remove('selected');
        }
        updateSelectedCount();
        updateToolbarButtons();
    });

    checkboxWrap.appendChild(checkbox);
    item.appendChild(checkboxWrap);

    if (foto.tipo === 'video') {
        const wrapper = document.createElement('div');
        wrapper.className = 'video-thumb';

        const img = document.createElement('img');
        img.className = 'video-img shimmer';
        img.alt = foto.nome || 'Vídeo';

        const play = document.createElement('span');
        play.className = 'play-badge';
        play.textContent = '▶';

        const cacheKey = 'poster:' + foto.caminho;
        let cached = null;
        try { cached = localStorage.getItem(cacheKey); } catch {}

        if (cached) {
            img.src = cached;
            img.classList.add('loaded');
        } else {
            generateVideoPoster(foto, 400, 400)
                .then((dataUrl) => {
                    img.src = dataUrl;
                    img.classList.add('loaded');
                    try { localStorage.setItem(cacheKey, dataUrl); } catch {}
                })
                .catch(() => {
                    img.alt = 'Sem poster do vídeo';
                });
        }

        wrapper.appendChild(img);
        wrapper.appendChild(play);
        item.appendChild(wrapper);
    } else {
        const img = document.createElement('img');
        img.src = foto.thumb || foto.caminho;
        img.alt = foto.nome || '';
        img.loading = 'lazy';

        if (img.complete && img.naturalHeight !== 0) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            }, { once: true });
            img.addEventListener('error', function() {
                this.alt = 'Erro ao carregar imagem';
            }, { once: true });
        }
        item.appendChild(img);
    }

    return item;
}

// Renderizar próximo lote de fotos
function renderNextBatch() {
    const grid = document.getElementById('photosGrid');
    if (!grid || !Array.isArray(fotos)) return;

    const start = renderedCount;
    const end = Math.min(renderedCount + BATCH_SIZE, fotos.length);
    for (let i = start; i < end; i++) {
        const el = createPhotoItem(i, fotos[i]);
        grid.appendChild(el);
    }
    renderedCount = end;

    // Quando terminar, parar observação
    if (renderedCount >= fotos.length) {
        if (observer) observer.disconnect();
        if (sentinel && sentinel.parentNode) {
            sentinel.parentNode.removeChild(sentinel);
        }
    }
}

// Inicializar grid com scroll infinito
function initInfiniteGrid() {
    const grid = document.getElementById('photosGrid');
    if (!grid) return;

    // Renderizar primeiro lote
    renderNextBatch();

    // Sentinel para IntersectionObserver
    sentinel = document.createElement('div');
    sentinel.id = 'scrollSentinel';
    sentinel.style.height = '1px';
    sentinel.style.width = '100%';
    sentinel.style.gridColumn = '1 / -1';
    grid.appendChild(sentinel);

    // Observer dentro do container que rola
    observer = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
            renderNextBatch();
        }
    }, {
        root: grid,
        rootMargin: '200px',
        threshold: 0
    });
    observer.observe(sentinel);

    // Fallback: checar proximidade do fim ao rolar
    grid.addEventListener('scroll', function() {
        const nearEnd = grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 200;
        if (nearEnd) renderNextBatch();
    });
}

// Configurar carregamento de imagens
function setupImageLoading() {
    const images = document.querySelectorAll('.photo-item img');
    
    images.forEach(img => {
        // Se a imagem já está carregada
        if (img.complete && img.naturalHeight !== 0) {
            img.classList.add('loaded');
        } else {
            // Aguardar o carregamento
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            }, { once: true });
            
            img.addEventListener('error', function() {
                this.alt = 'Erro ao carregar imagem';
            }, { once: true });
        }
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Seleção de fotos
    document.querySelectorAll('.photo-select').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const path = this.getAttribute('data-path');
            const photoItem = this.closest('.photo-item');
            
            if (this.checked) {
                selectedPhotos.add(path);
                photoItem.classList.add('selected');
            } else {
                selectedPhotos.delete(path);
                photoItem.classList.remove('selected');
            }
            
            updateSelectedCount();
            updateToolbarButtons();
        });
    });
    
    // Botões da toolbar
    document.getElementById('selectAllBtn')?.addEventListener('click', selectAll);
    document.getElementById('deselectAllBtn')?.addEventListener('click', deselectAll);
    document.getElementById('downloadSelectedBtn')?.addEventListener('click', downloadSelected);
    document.getElementById('downloadAllBtn')?.addEventListener('click', downloadAll);
    document.getElementById('slideshowBtn')?.addEventListener('click', startSlideshow);
    
    // Teclado
    document.addEventListener('keydown', handleKeyboard);
}

// Selecionar todas as fotos
function selectAll() {
    document.querySelectorAll('.photo-select').forEach(checkbox => {
        checkbox.checked = true;
        const path = checkbox.getAttribute('data-path');
        const photoItem = checkbox.closest('.photo-item');
        selectedPhotos.add(path);
        photoItem.classList.add('selected');
    });
    updateSelectedCount();
    updateToolbarButtons();
}

// Deselecionar todas as fotos
function deselectAll() {
    document.querySelectorAll('.photo-select').forEach(checkbox => {
        checkbox.checked = false;
        const photoItem = checkbox.closest('.photo-item');
        photoItem.classList.remove('selected');
    });
    selectedPhotos.clear();
    updateSelectedCount();
    updateToolbarButtons();
}

// Atualizar contador de selecionadas
function updateSelectedCount() {
    const count = selectedPhotos.size;
    const countElement = document.getElementById('selectedCount');
    if (countElement) {
        countElement.textContent = count;
    }
}

// Atualizar botões da toolbar
function updateToolbarButtons() {
    const count = selectedPhotos.size;
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
    
    if (count > 0) {
        if (selectAllBtn) selectAllBtn.style.display = 'none';
        if (deselectAllBtn) deselectAllBtn.style.display = 'inline-block';
        if (downloadSelectedBtn) downloadSelectedBtn.style.display = 'inline-block';
    } else {
        if (selectAllBtn) selectAllBtn.style.display = 'inline-block';
        if (deselectAllBtn) deselectAllBtn.style.display = 'none';
        if (downloadSelectedBtn) downloadSelectedBtn.style.display = 'none';
    }
}

// Abrir lightbox
function openLightbox(index) {
    if (fotos.length === 0) return;

    currentPhotoIndex = index;
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxVideo = document.getElementById('lightboxVideo');
    const lightboxCounter = document.getElementById('lightboxCounter');
    const lightboxDownloadBtn = document.getElementById('lightboxDownloadBtn');
    const item = fotos[index];

    // Atualiza e mostra
    if (lightboxDownloadBtn && item) {
        const filename = (item.caminho || '').split('/').pop() || 'arquivo';
        lightboxDownloadBtn.href = item.caminho;
        lightboxDownloadBtn.setAttribute('download', filename);
        lightboxDownloadBtn.title = `Baixar ${filename}`;
        lightboxDownloadBtn.style.display = 'grid'; // aparece só com o lightbox
    }

    if (item.tipo === 'video') {
        if (lightboxImage) {
            lightboxImage.style.display = 'none';
            lightboxImage.src = '';
        }
        if (lightboxVideo) {
            lightboxVideo.style.display = 'block';
            lightboxVideo.muted = false;
            lightboxVideo.playsInline = true;
            lightboxVideo.removeAttribute('src');
            lightboxVideo.src = item.caminho;
            try { lightboxVideo.load(); } catch (e) {}
        }
    } else {
        if (lightboxVideo) {
            try { lightboxVideo.pause(); } catch (e) {}
            lightboxVideo.style.display = 'none';
            lightboxVideo.removeAttribute('src');
        }
        if (lightboxImage) {
            lightboxImage.style.display = 'block';
            lightboxImage.src = item.caminho;
        }
    }

    if (lightboxCounter) {
        lightboxCounter.textContent = `${index + 1} / ${fotos.length}`;
    }
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Fechar lightbox
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxVideo = document.getElementById('lightboxVideo');
    const lightboxDownloadBtn = document.getElementById('lightboxDownloadBtn');

    // Parar e descarregar vídeo para não continuar tocando
    if (lightboxVideo) {
        try { lightboxVideo.pause(); } catch (e) {}
        try { lightboxVideo.currentTime = 0; } catch (e) {}
        lightboxVideo.removeAttribute('src');
        lightboxVideo.src = '';
        try { lightboxVideo.load(); } catch (e) {}
        lightboxVideo.style.display = 'none';
    }
    if (lightboxDownloadBtn) {
        lightboxDownloadBtn.style.display = 'none'; // oculta ao fechar
        lightboxDownloadBtn.removeAttribute('href');
        lightboxDownloadBtn.removeAttribute('download');
    }

    if (lightbox) { lightbox.style.display = 'none'; }
    document.body.style.overflow = '';
}

// Mudar foto no lightbox
function changePhoto(direction) {
    if (fotos.length === 0) return;

    currentPhotoIndex = (currentPhotoIndex + direction + fotos.length) % fotos.length;
    const item = fotos[currentPhotoIndex];
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxVideo = document.getElementById('lightboxVideo');
    const lightboxCounter = document.getElementById('lightboxCounter');
    const lightboxDownloadBtn = document.getElementById('lightboxDownloadBtn');

    if (lightboxDownloadBtn && item) {
        const filename = (item.caminho || '').split('/').pop() || 'arquivo';
        lightboxDownloadBtn.href = item.caminho;
        lightboxDownloadBtn.setAttribute('download', filename);
        lightboxDownloadBtn.title = `Baixar ${filename}`;
        lightboxDownloadBtn.style.display = 'grid'; // mantém visível enquanto navega
    }

    if (item && item.tipo === 'video') {
        if (lightboxImage) {
            lightboxImage.style.display = 'none';
            lightboxImage.src = '';
        }
        if (lightboxVideo) {
            lightboxVideo.style.display = 'block';
            lightboxVideo.removeAttribute('src');
            lightboxVideo.src = item.caminho;
            try { lightboxVideo.load(); } catch (e) {}
        }
    } else {
        if (lightboxVideo) {
            try { lightboxVideo.pause(); } catch (e) {}
            lightboxVideo.style.display = 'none';
            lightboxVideo.removeAttribute('src');
        }
        if (lightboxImage) {
            lightboxImage.style.display = 'block';
            lightboxImage.src = item.caminho;
        }
    }

    if (lightboxCounter) {
        lightboxCounter.textContent = `${currentPhotoIndex + 1} / ${fotos.length}`;
    }
}

// Download de foto individual
function downloadPhoto(path) {
    const link = document.createElement('a');
    link.href = path;
    link.download = path.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download da foto atual no lightbox
function downloadCurrentPhoto() {
    if (fotos.length > 0 && currentPhotoIndex >= 0) {
        downloadPhoto(fotos[currentPhotoIndex].caminho);
    }
}

// Download de fotos selecionadas
function downloadSelected() {
    if (selectedPhotos.size === 0) return;
    
    // Se for apenas uma foto, usar download direto
    if (selectedPhotos.size === 1) {
        downloadPhoto(Array.from(selectedPhotos)[0]);
        return;
    }
    
    // Múltiplas fotos: criar ZIP
    downloadAsZip(Array.from(selectedPhotos));
}

// Download de todas as fotos
function downloadAll() {
    if (fotos.length === 0) return;
    
    // Se for apenas uma foto, usar download direto
    if (fotos.length === 1) {
        downloadPhoto(fotos[0].caminho);
        return;
    }
    
    // Múltiplas fotos: criar ZIP
    const todasFotos = fotos.map(foto => foto.caminho);
    downloadAsZip(todasFotos);
}

// Download como ZIP
function downloadAsZip(fotosArray) {
    fetch('download.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fotos: fotosArray })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao criar ZIP');
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'fotos_' + new Date().getTime() + '.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao fazer download. Tentando método alternativo...');
        // Fallback: download individual
        fotosArray.forEach((path, index) => {
            setTimeout(() => {
                downloadPhoto(path);
            }, 200 * index);
        });
    });
}

// Iniciar slideshow
function startSlideshow() {
    if (fotos.length === 0) return;
    
    slideshowIndex = 0;
    slideshowPaused = false;
    const slideshow = document.getElementById('slideshow');
    const slideshowImage = document.getElementById('slideshowImage');
    const slideshowCounter = document.getElementById('slideshowCounter');
    
    slideshow.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    function showSlide() {
        if (slideshowPaused) return;
        
        slideshowImage.src = fotos[slideshowIndex].caminho;
        slideshowCounter.textContent = `${slideshowIndex + 1} / ${fotos.length}`;
        
        slideshowIndex++;
        if (slideshowIndex >= fotos.length) {
            slideshowIndex = 0;
        }
    }
    
    showSlide();
    slideshowInterval = setInterval(showSlide, 3000); // 3 segundos por foto
}

// Parar slideshow
function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
    slideshowPaused = false;
    const slideshow = document.getElementById('slideshow');
    slideshow.style.display = 'none';
    document.body.style.overflow = '';
}

// Pausar/Retomar slideshow
function toggleSlideshowPause() {
    slideshowPaused = !slideshowPaused;
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (slideshowPaused) {
        pauseBtn.textContent = '▶️ Retomar';
    } else {
        pauseBtn.textContent = '⏸️ Pausar';
    }
}

// Navegar slideshow
function slideshowPrev() {
    if (fotos.length === 0) return;
    
    slideshowIndex--;
    if (slideshowIndex < 0) {
        slideshowIndex = fotos.length - 1;
    }
    
    const slideshowImage = document.getElementById('slideshowImage');
    const slideshowCounter = document.getElementById('slideshowCounter');
    
    slideshowImage.src = fotos[slideshowIndex].caminho;
    slideshowCounter.textContent = `${slideshowIndex + 1} / ${fotos.length}`;
}

function slideshowNext() {
    if (fotos.length === 0) return;
    
    slideshowIndex++;
    if (slideshowIndex >= fotos.length) {
        slideshowIndex = 0;
    }
    
    const slideshowImage = document.getElementById('slideshowImage');
    const slideshowCounter = document.getElementById('slideshowCounter');
    
    slideshowImage.src = fotos[slideshowIndex].caminho;
    slideshowCounter.textContent = `${slideshowIndex + 1} / ${fotos.length}`;
}

// Manipular teclado
function handleKeyboard(e) {
    const lightbox = document.getElementById('lightbox');
    const slideshow = document.getElementById('slideshow');

    // Lightbox
    if (lightbox && lightbox.style.display === 'flex') {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft') {
            changePhoto(-1);
        } else if (e.key === 'ArrowRight') {
            changePhoto(1);
        }
    }

    // Slideshow
    if (slideshow && slideshow.style.display === 'flex') {
        if (e.key === 'Escape') {
            stopSlideshow();
        } else if (e.key === 'ArrowLeft') {
            slideshowPrev();
        } else if (e.key === 'ArrowRight') {
            slideshowNext();
        } else if (e.key === ' ') {
            e.preventDefault();
            toggleSlideshowPause();
        }
    }
}

