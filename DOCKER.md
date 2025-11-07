# 🐳 Guia Docker - Galeria de Fotos

## Requisitos

- Docker instalado
- Docker Compose instalado

## Comandos Rápidos

### Iniciar a galeria
```bash
docker-compose up -d
```

### Parar a galeria
```bash
docker-compose down
```

### Ver logs
```bash
docker-compose logs -f
```

### Reconstruir a imagem
```bash
docker-compose build --no-cache
```

### Reiniciar o container
```bash
docker-compose restart
```

## Acesso

Após iniciar, acesse: **http://localhost:8080**

## Estrutura

- **Porta**: 8080 (pode ser alterada no `docker-compose.yml`)
- **PHP**: 8.2
- **Servidor**: Apache
- **Extensões**: ZIP (para downloads)

## Volumes

- `./` → `/var/www/html` (código da aplicação)
- `./fotos` → `/var/www/html/fotos` (fotos e álbuns)

## Solução de Problemas

### Porta já em uso
Se a porta 8080 estiver em uso, altere no `docker-compose.yml`:
```yaml
ports:
  - "8081:80"  # Use 8081 ou outra porta disponível
```

### Permissões
Se houver problemas de permissão, ajuste as permissões da pasta `fotos`:
```bash
chmod -R 755 fotos
```

### Rebuild completo
Se precisar reconstruir tudo do zero:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

