# Galeria de Fotos - Estilo Lightroom

Uma galeria de fotos moderna e elegante com visual inspirado no Adobe Lightroom, desenvolvida em PHP e JavaScript.

## 🎨 Características

- **Visual Moderno**: Interface escura e minimalista estilo Lightroom
- **Organização por Álbuns**: Cada pasta dentro de `fotos/` é um álbum
- **Visualização em Grid**: Grid responsivo com imagens otimizadas
- **Lightbox**: Visualização ampliada com navegação por teclado
- **Slideshow**: Apresentação automática das fotos
- **Download**: Download individual, selecionadas ou todas as fotos
- **Responsivo**: Funciona perfeitamente em desktop e mobile

## 📁 Estrutura de Pastas

```
galeriafotos/
├── index.php          # Página principal
├── style.css          # Estilos
├── script.js          # Funcionalidades JavaScript
├── README.md          # Este arquivo
└── fotos/             # Pasta principal de fotos
    ├── album1/        # Álbum 1
    │   ├── foto1.jpg
    │   └── foto2.jpg
    ├── album2/        # Álbum 2
    │   └── foto3.jpg
    └── ...
```

## 🚀 Instalação

### Opção 1: Docker Compose (Recomendado)

1. Certifique-se de ter Docker e Docker Compose instalados

2. Execute o comando:
   ```bash
   docker-compose up -d
   ```

3. Acesse `http://localhost:8080` no navegador

4. Para parar o servidor:
   ```bash
   docker-compose down
   ```

### Opção 2: Instalação Manual

1. Coloque os arquivos na pasta do seu servidor web (Apache/Nginx com PHP)

2. Crie a pasta `fotos` na raiz do projeto:
   ```bash
   mkdir fotos
   ```

3. Crie pastas dentro de `fotos` para cada álbum:
   ```bash
   mkdir fotos/album1
   mkdir fotos/album2
   ```

4. Adicione suas fotos nas pastas dos álbuns

5. Acesse `http://seu-servidor/galeriafotos/` no navegador

## 📝 Formatos Suportados

- JPG/JPEG
- PNG
- GIF
- WEBP
- BMP

## ⌨️ Atalhos de Teclado

### Lightbox
- `Esc`: Fechar lightbox
- `←`: Foto anterior
- `→`: Próxima foto

### Slideshow
- `Esc`: Parar slideshow
- `←`: Foto anterior
- `→`: Próxima foto
- `Espaço`: Pausar/Retomar

## 🎯 Funcionalidades

### Seleção de Fotos
- Clique no checkbox de cada foto para selecionar
- Use "Selecionar Todas" para selecionar todas as fotos
- Use "Deselecionar Todas" para limpar a seleção

### Download
- **Individual**: Clique no ícone de download na foto ou no lightbox
- **Selecionadas**: Selecione as fotos e clique em "Download Selecionadas"
- **Todas**: Clique em "Download Todas" para baixar todas as fotos do álbum

### Slideshow
- Clique em "Slideshow" para iniciar a apresentação automática
- Use os controles para pausar, retomar ou navegar manualmente
- As fotos avançam automaticamente a cada 3 segundos

## 🔧 Requisitos

### Com Docker
- Docker
- Docker Compose

### Sem Docker
- PHP 7.0 ou superior
- Servidor web (Apache/Nginx)
- Navegador moderno com suporte a JavaScript

## 📱 Responsividade

A galeria é totalmente responsiva e se adapta a diferentes tamanhos de tela:
- Desktop: Grid com múltiplas colunas
- Tablet: Grid ajustado
- Mobile: Layout otimizado para telas pequenas

## 🎨 Personalização

Você pode personalizar as cores editando as variáveis CSS em `style.css`:

```css
:root {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2a2a2a;
    --accent: #4a9eff;
    /* ... */
}
```

## 📄 Licença

Este projeto é de código aberto e está disponível para uso livre.

