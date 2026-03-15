# backend-midterm

Crowdfunding backend midterm project built with Node.js, Express, and PostgreSQL.

This scaffold covers Part 1 only:
- projects
- reward tiers

It does not include pledges or refunds.

## Project structure

```text
src/
  app.js
  server.js
  controllers/
    projectController.js
  db/
    pool.js
    schema.sql
  middlewares/
    errorHandler.js
    validators.js
  routes/
    projectRoutes.js
  services/
    projectService.js
  utils/
    AppError.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from `.env.example`.

3. Create the PostgreSQL database and run:

```sql
\i src/db/schema.sql
```

4. Start the server:

```bash
npm run dev
```

## Endpoints

### Create project

`POST /projects`

Example body:

```json
{
  "title": "Smart Water Bottle",
  "description": "A bottle that tracks hydration and syncs with mobile apps.",
  "goal": 5000,
  "deadline": "2026-06-30T12:00:00.000Z",
  "status": "active",
  "creator_id": 1
}
```

### Get all projects

`GET /projects`

### Get project by id

`GET /projects/:id`

### Add reward tier to project

`POST /projects/:id/tiers`

Example body:

```json
{
  "title": "Early Bird Supporter",
  "amount": 25,
  "quantity_total": 100,
  "quantity_remaining": 100
}
```

## Notes

- `users` is included as a supporting table because `projects.creator_id` references it.
- Assumed user fields: `id`, `full_name`, `email`, `password_hash`, `created_at`.
- Allowed project status values: `draft`, `active`, `closed`, `cancelled`.
