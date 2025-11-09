<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
  <a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
  <a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
  <a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers" /></a>
  <a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate"/></a>
</p>

---

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

---

## 🚀 Project Setup (Local)

### 1. Install dependencies
```bash
npm install
```

### 2. Run the project
```bash
# development
npm run start

# watch mode
npm run start:dev

# production
npm run start:prod
```

---

## 🐳 Running with Docker

This project includes a full Docker setup for **NestJS + PostgreSQL + TypeORM migrations & seeders**.

### 1. Build and start containers
```bash
docker compose up -d
```
This command will:
- Start the **NestJS app** container (`insurance_policy_app`)
- Start the **PostgreSQL** container (`insurance_policy_postgres`)

### 2. Run database migrations
```bash
docker compose run --rm migrate
```
This will execute all pending TypeORM migrations inside the container.

### 3. Run database seeders
```bash
docker compose run --rm seed
```
Runs the seeders defined in `src/db/seeders/` (e.g. `role.seeder.ts`, `user.seeder.ts`, etc.).

### 4. Verify containers
```bash
docker compose ps
```

You should see something like:
```
insurance_policy_postgres   Up   0.0.0.0:5432->5432/tcp
insurance_policy_app        Up   0.0.0.0:3000->3000/tcp
```

### 5. Access the application
Once containers are up, the app is available at:
```
http://localhost:3000
```

### 6. Access Swagger API docs
```
http://localhost:3000/api
```

### 7. Stop all containers
```bash
docker compose down
```

To reset all data (remove database volume):
```bash
docker compose down -v
```

---

## 🗄️ Database Management

### Database Migrations

| Script | Command | Description |
|--------|----------|-------------|
| `npm run migration:generate <name>` | Generate new migration | Creates a migration from entity changes |
| `npm run migration:create <name>` | Create empty migration | Creates an empty migration file |
| `npm run migration:run` | Run migrations | Executes pending migrations |
| `npm run migration:revert` | Revert migration | Reverts the last executed migration |
| `npm run migration:show` | Show migrations | Lists all migrations and their status |

**Example:**
```bash
npm run migration:generate src/db/migrations/AddUserColumn
npm run migration:run
```

> 🧠 **Note:** In Docker, you can also run migrations using:
> ```bash
> docker compose run --rm migrate
> ```

---

### Database Seeders

Seeders populate initial data in the application.

#### Available Seeder Commands

```bash
# Local (requires npm dependencies)
npm run seed
npm run seed:dev

# Dockerized environment
docker compose run --rm seed
```

#### Seeder Flow
1. `role.seeder.ts` → create default roles
2. `user.seeder.ts` → create admin & default users
3. All seeders registered in `main.seeder.ts`

---

## 📜 API Documentation

Once running, Swagger is available at:

```
http://localhost:3000/api
```

### Features
- JWT Authentication
- File Upload (JPEG, PNG, PDF)
- CORS Enabled
- Validation using class-validator

---

## 🧰 Development Notes

### Environment Files
- `.env` is automatically loaded into Docker containers.
- Example configuration:
  ```env
  DB_HOST=db
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=postgres
  DB_NAME=insurance_policy_db
  ```

### Volume Persistence
Database data is stored in Docker volume `pgdata`:
```bash
docker volume ls
```

To clear database data:
```bash
docker compose down -v
```

---

## ✅ Production Checklist

- [ ] `synchronize: false` in `data-source.ts`
- [ ] Test migrations before deployment
- [ ] Backup production DB before running migrations
- [ ] Use strong passwords & secrets
- [ ] Set proper CORS origins
- [ ] Enable HTTPS in production

---

## 🧠 Quick Summary

| Task | Local Command | Docker Command |
|------|----------------|----------------|
| Run App | `npm run start:dev` | `docker compose up -d` |
| Run Migrations | `npm run migration:run` | `docker compose run --rm migrate` |
| Run Seeders | `npm run seed:dev` | `docker compose run --rm seed` |
| Stop All | `Ctrl + C` | `docker compose down` |

---

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
