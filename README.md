# Tidewrk — Multi-Tenant SaaS

A small multi-tenant project and task management application built with **Next.js**, **Laravel**, and **MySQL**. The application supports user authentication, organization (tenant) membership, role-based access, projects, and tasks.

This repository is configured to run locally with Docker Compose. It includes MySQL, Redis, and phpMyAdmin so the development environment can be started without installing PHP, Node.js, or MySQL directly on the host machine.

## Features

- User registration and login using Laravel Sanctum.
- Creates an organization (tenant) and assigns the registering user the `admin` role.
- Tenant membership with per-tenant roles (`admin`, `manager`, and `employee`).
- Users can belong to more than one tenant, with a role for each membership.
- Tenant-scoped project and task operations.
- Project and task access is restricted to tenants the authenticated user belongs to.
- Docker Compose development environment.

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Laravel 13, PHP 8.4 |
| Authentication | Laravel Sanctum |
| Database | MySQL 8 (tested with MySQL 8.4.13) |
| Cache | Redis 7 |
| Database administration | phpMyAdmin |
| Development environment | Docker, Docker Compose |
| JavaScript runtime | Node.js 22 |

## Project Structure

```text
tidewrk-multi-saas/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   └── Middleware/
│   │   └── Models/
│   ├── database/
│   │   └── migrations/
│   ├── routes/
│   │   └── api.php
│   └── Dockerfile
├── frontend/                # Next.js application
├── docker-compose.yml
├── .env                     # Local Docker Compose variables (not committed)
└── README.md
```

## Requirements

- Docker Desktop with Docker Compose.
- Git, if cloning the repository.

PHP, Composer, Node.js, and MySQL do not need to be installed locally when using the provided Docker setup.

## Getting Started

### 1. Get the source code

Clone the repository and enter the project directory:

```bash
git clone <repository-url>
cd tidewrk-multi-saas
```

If you received the project as a ZIP file, extract it and open a terminal in the extracted project directory.

### 2. Configure the root environment file

Create a `.env` file in the project root (the same directory as `docker-compose.yml`):

```dotenv
MYSQL_DATABASE=saas_db
MYSQL_USER=saas_user
MYSQL_PASSWORD=saas_password_123
MYSQL_ROOT_PASSWORD=root_password_123
MYSQL_PORT=3306
REDIS_PORT=6379
```

These are local development credentials. Change them if you use this configuration outside a local development environment.

### 3. Configure Laravel

Create or update `backend/.env` with the database and Redis connection settings:

```dotenv
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=saas_db
DB_USERNAME=saas_user
DB_PASSWORD=saas_password_123

SESSION_DRIVER=file
CACHE_STORE=redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_CLIENT=phpredis

QUEUE_CONNECTION=sync
```

The hostnames `mysql` and `redis` are the Docker Compose service names. They are used for communication between containers; do not replace them with `localhost` inside the Laravel container.

Make sure the Laravel application has its normal application settings configured in `backend/.env`, including `APP_KEY`. If an application key has not yet been generated, generate it after the containers are running:

```bash
docker compose exec backend php artisan key:generate
```

### 4. Start the application

From the project root, run:

```bash
docker compose up -d --build
```

Docker Compose starts the following services:

| Service | Local address |
|---|---|
| Next.js frontend | http://localhost:3000 |
| Laravel API | http://localhost:8000 |
| phpMyAdmin | http://localhost:8080 |
| MySQL | `127.0.0.1:3306` |
| Redis | `127.0.0.1:6379` |

The frontend container installs its npm dependencies when it starts.

### 5. Run database migrations

After the backend container is running, apply the Laravel migrations:

```bash
docker compose exec backend php artisan migrate
```

### 6. Open the application

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- phpMyAdmin: http://localhost:8080

To log in to phpMyAdmin, use:

| Field | Value |
|---|---|
| Server | `mysql` |
| Username | `saas_user` |
| Password | `saas_password_123` |

Select the `saas_db` database to browse its tables.

## Database Overview

The main application tables are:

| Table | Purpose |
|---|---|
| `users` | User accounts and authentication details. |
| `tenants` | Organizations using the application. |
| `tenant_user` | Many-to-many relationship between users and tenants; stores the user's role within each tenant. |
| `projects` | Projects owned by a tenant. |
| `tasks` | Tasks associated with projects and, where applicable, assigned to users. |

Laravel and Sanctum also use supporting tables for migrations, sessions, API tokens, cache, and queue infrastructure. These include `migrations`, `sessions`, `personal_access_tokens`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, and `password_reset_tokens`.

### Multi-Tenancy

The application uses a shared database with tenant ownership recorded on application data.

- A user can be a member of multiple tenants.
- The `tenant_user` pivot table stores the user's role for each tenant membership.
- A newly registered user is assigned the `admin` role in the tenant created during registration.
- The tenant middleware establishes the active tenant context for protected tenant routes.
- An optional `X-Tenant-ID` request header can select a tenant only if the authenticated user is already a member of it.
- Project and task queries are scoped to the active tenant to prevent users from accessing another tenant's records.

### Roles

The application uses tenant-specific roles:

| Role | Intended access |
|---|---|
| `admin` | Tenant administrator; can manage projects and tasks, including deletion. |
| `manager` | Can create and update projects and tasks, and delete tasks. |
| `employee` | Can work with tasks according to the implemented authorization rules. |

A user's role belongs to their tenant membership, not globally to their user account. The same user may have different roles in different tenants.

## Authentication and API

The backend exposes API routes defined in `backend/routes/api.php`.

Authentication is handled with Laravel Sanctum bearer tokens. The frontend uses the API for registration, login, authenticated user information, logout, and tenant-scoped project and task operations.

The API base URL used by the frontend is:

```text
http://localhost:8000/api
```

If the frontend uses an environment variable for the API base URL, check `frontend/.env.example` and configure `frontend/.env.local` accordingly.

## Useful Docker Commands

Run these commands from the project root:

```bash
# Start services
docker compose up -d

# Rebuild images and start services
docker compose up -d --build

# View running services
docker compose ps

# View logs
docker compose logs -f

# View backend logs only
docker compose logs -f backend

# Run Laravel commands
docker compose exec backend php artisan <command>

# Stop and remove containers and the Compose network
docker compose down
```

**Database persistence:** `docker compose down` does not delete the named database volumes. Do not use `docker compose down -v` unless you intentionally want to delete the persisted MySQL, Redis, and frontend dependency volumes.

## Notes and Scope

This project was built as a time-limited practical assessment. The implementation focuses on the requested core application flow and a straightforward Laravel MVC structure rather than adding unnecessary architectural layers.

It is a development/assessment project, not a production-hardened SaaS deployment. Before production use, review and strengthen items such as:

- Authorization policies and record-level permissions, especially which tasks an employee may update.
- Automated tests for authentication, tenant isolation, and role permissions.
- Secure token storage and the overall browser authentication strategy.
- Password reset, email verification, and tenant invitation workflows if required.
- Production secrets, HTTPS, database backups, monitoring, and restricted access to phpMyAdmin.
- Production deployment configuration for queues and background workers if asynchronous jobs are introduced.

Redis is available in the Docker environment and configured as Laravel's cache store. The current queue connection is synchronous (`QUEUE_CONNECTION=sync`); queued background processing is not part of the current implementation.

## Development Notes

- Keep local `.env` files and secrets out of version control.
- Do not commit `vendor/`, `node_modules/`, database files, or generated build output.
- Use migrations to manage schema changes.
- Keep tenant scoping and authorization checks in place when adding new tenant-owned resources.
