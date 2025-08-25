# Use the official PHP 8.2 FPM image
FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
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
    && docker-php-ext-install pdo_pgsql pdo_mysql mbstring exif pcntl bcmath gd sodium

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set the working directory
WORKDIR /var/www/html

# Copy the Laravel application files
COPY . .

# Expose the application port
EXPOSE 8000

# Install PHP dependencies using Composer
RUN composer install

# Run database migrations and start the Laravel server
CMD php artisan migrate:fresh --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=8000
