# Syntiant Atlas

Enterprise Web3 Fractional Real Estate Investment Platform built with NestJS, Next.js 14, Prisma, and PostgreSQL.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Docker** (for PostgreSQL and Redis)

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd syntiantatlas2
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Open `.env` and update the values if needed. The defaults work with the Docker setup below:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/syntiant_atlas
REDIS_URL=redis://localhost:6379
JWT_SECRET=CHANGE_ME_IN_PRODUCTION_USE_LONG_RANDOM_STRING
JWT_REFRESH_SECRET=CHANGE_ME_DIFFERENT_FROM_JWT_SECRET
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 3. Start PostgreSQL and Redis

```bash
npm run docker:dev
```

This starts PostgreSQL 16, Redis 7, and PgBouncer via Docker Compose. Wait a few seconds for the containers to be healthy.

To verify they're running:

```bash
docker ps
```

You should see `syntiant-dev-postgres`, `syntiant-dev-redis`, and `syntiant-dev-pgbouncer`.

### 4. Set up the database

Generate the Prisma client and push the schema to the database:

```bash
npx prisma generate
npx prisma db push
```

### 5. Seed the database

This creates the admin account, roles, and default system settings:

```bash
npx prisma db seed
```

Default admin credentials (configurable via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`):

- Email: `admin@syntiantatlas.com`
- Password: `Admin@123456`

### 6. Start the development servers

```bash
npm run dev
```

This starts both apps concurrently via Turborepo:

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000         |
| API      | http://localhost:8080         |
| Swagger  | http://localhost:8080/api/docs |

## Project Structure

```
syntiantatlas2/
  apps/
    api/          # NestJS backend (TypeScript)
    web/          # Next.js 14 frontend (TypeScript)
  packages/
    shared/       # Shared types and constants
  prisma/
    schema.prisma # Database schema
    seed.ts       # Database seed script
  docker/
    docker-compose.dev.yml
```

## Common Commands

| Command                | Description                      |
|------------------------|----------------------------------|
| `npm run dev`          | Start all apps in dev mode       |
| `npm run build`        | Build all apps                   |
| `npm run docker:dev`   | Start Docker services            |
| `npm run docker:down`  | Stop Docker services             |
| `npx prisma studio`   | Open Prisma database GUI         |
| `npx prisma generate`  | Regenerate Prisma client         |
| `npx prisma db push`   | Push schema changes to database  |
| `npx prisma db seed`   | Run the seed script              |

## Stopping Everything

```bash
# Stop the dev servers (Ctrl+C in the terminal running npm run dev)

# Stop Docker services
npm run docker:down
```

## Troubleshooting

**Port already in use:** If port 3000 or 8080 is taken, stop the other process or change the port in `.env` (`API_PORT`) or `apps/web/package.json`.

**Prisma client out of date:** If you see type errors after pulling new changes, run `npx prisma generate` to regenerate the client.

**Database connection refused:** Make sure Docker is running and the containers are healthy (`docker ps`). If you just started Docker, wait a few seconds for PostgreSQL to initialize.

**Cannot find module errors:** Run `npm install` from the root directory to reinstall dependencies.
