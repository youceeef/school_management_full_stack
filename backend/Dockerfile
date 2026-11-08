# Production image for the Laravel API
FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    unzip \
    zip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libsodium-dev \
    libpq-dev \
    default-mysql-client \
    default-libmysqlclient-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_pgsql pdo_mysql mbstring exif pcntl bcmath gd sodium \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set the working directory
WORKDIR /var/www/html

# Copy dependency manifests first so Docker can cache Composer packages
COPY composer.json composer.lock ./

# Install production PHP dependencies
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

# Copy the Laravel application files
COPY . .

RUN composer dump-autoload --no-dev --optimize --no-interaction \
    && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
    && php artisan storage:link \
    && chown -R www-data:www-data storage bootstrap/cache

USER www-data

# Expose the application port
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl --fail --silent http://127.0.0.1:${PORT:-8000}/ > /dev/null || exit 1

# Apply non-destructive migrations, seed idempotent roles/admin, and start the API.
CMD php artisan migrate --force && php artisan db:seed --force && php artisan optimize && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
