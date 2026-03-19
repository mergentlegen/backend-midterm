# backend-midterm

Crowdfunding backend midterm project built with Node.js, Express, Prisma 5, and PostgreSQL on Neon.

This project is a small Kickstarter-like API where:
- creators can create projects
- projects can have reward tiers with limited quantities
- users can register and login with JWT authentication
- backers can create pledges
- projects can be finalized as successful or failed
- anyone can see current fundraising progress before final status

## What is implemented

### Part 1
- `users` table
- `projects` table
- `reward_tiers` table
- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `POST /projects/:id/tiers`

### Part 2
- `pledges` table
- `refunds` table
- `POST /projects/:id/pledges`
- `POST /projects/:id/finalize`

### Authentication and progress
- `POST /auth/register`
- `POST /auth/login`
- `GET /projects/:id/progress`

## Project structure

```text
src/
  app.js
  server.js
  controllers/
    pledgeController.js
    projectController.js
  db/
    pool.js
    schema.sql
    migrations/
      001_create_users_projects_reward_tiers.sql
      002_create_pledges_refunds.sql
  middlewares/
    errorHandler.js
    validators.js
  routes/
    pledgeRoutes.js
    projectRoutes.js
  services/
    pledgeService.js
    projectService.js
  utils/
    AppError.js
postman/
  Crowdfunding-Part1.postman_collection.json
  Crowdfunding-Backend-API.postman_collection.json
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in the root of the project:

```env
PORT=5000
DATABASE_URL=your_neon_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

3. Install Prisma client:

```bash
npx prisma generate
```

4. Apply database schema and migrations in Neon SQL Editor:
- first run `src/db/schema.sql` if the database is empty
- then run `src/db/migrations/002_create_pledges_refunds.sql` for Part 2

5. Start the server:

```bash
npm run dev
```

Server base URL:

```text
http://localhost:5000
```

## Main endpoints

### Projects
- `POST /projects`  `Authorization: Bearer <token>`
- `GET /projects`
- `GET /projects/:id`
- `GET /projects/:id/progress`

Example body:

```json
{
  "title": "Indie Game",
  "description": "A small indie game",
  "goal": 1000,
  "deadline": "2026-12-01T00:00:00",
  "status": "active"
}
```

### Reward tiers
- `POST /projects/:id/tiers`  `Authorization: Bearer <token>`

Example body:

```json
{
  "title": "Sticker Pack",
  "amount": 10,
  "quantity_total": 50
}
```

### Pledges
- `POST /projects/:id/pledges`  `Authorization: Bearer <token>`

Example with tier:

```json
{
  "tier_id": 1,
  "amount": 10
}
```

Example without tier:

```json
{
  "amount": 5
}
```

### Finalize
- `POST /projects/:id/finalize`  `Authorization: Bearer <token>`

This endpoint does not need a request body.

### Auth
- `POST /auth/register`
- `POST /auth/login`

Register example:

```json
{
  "full_name": "Test User",
  "email": "test@example.com",
  "password": "123456"
}
```

Login example:

```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

## Business rules

- A project must exist before reward tiers or pledges can be added.
- A pledge cannot be created after the deadline.
- If a tier is selected, it must belong to the same project.
- Tier quantity is decremented atomically inside a transaction.
- When a failed project is finalized, refund records are created and tier inventory is restored.
- A project cannot be finalized twice.
- Protected actions use JWT authentication.
- Project progress can be checked through `GET /projects/:id/progress`.

## Testing

Postman collections are included in the `postman/` folder:
- `Crowdfunding-Backend-API.postman_collection.json`

Recommended order for checking the full flow:
1. Create project
2. Add reward tier
3. Create pledge with tier
4. Create pledge without tier
5. Finalize project

## Notes

- `users` is used as a supporting table for creators and backers.
- Database access is handled through Prisma 5.
- Error handling is centralized through `AppError` and the error middleware.
