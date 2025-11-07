FROM php:8.2-apache

# Instalar dependências e extensão ZIP
RUN apt-get update && \
    apt-get install -y \
    libzip-dev \
    zip \
    unzip && \
    docker-php-ext-install zip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Habilitar mod_rewrite
RUN a2enmod rewrite

# Configurar Apache
ENV APACHE_DOCUMENT_ROOT /var/www/html
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Definir diretório de trabalho
WORKDIR /var/www/html

# Expor porta 80
EXPOSE 80

