FROM php:8.4-cli

RUN apt-get update && apt-get install -y git unzip libzip-dev

RUN docker-php-ext-install pdo_mysql bcmath pcntl opcache

RUN pecl install redis && docker-php-ext-enable redis

WORKDIR /app

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]