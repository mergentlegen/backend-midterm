# backend-midterm

Crowdfunding backend midterm project built with Node.js, Express, and PostgreSQL.

This version covers the combined MVP:
- projects
- reward tiers
- pledges
- refunds on failed project finalization

## Project structure

```text
migrations/
  002_pledges_refunds.sql
src/
  app.js
  db.js
  server.js
  controllers/
    pledgeController.js
    projectController.js
  db/
    pool.js
    schema.sql
    migrations/
      001_create_users_projects_reward_tiers.sql
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
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create PostgreSQL database.

3. Run schema/migrations in order:

```sql
\i src/db/migrations/001_create_users_projects_reward_tiers.sql
\i migrations/002_pledges_refunds.sql
```

4. Start the server:

```bash
npm run dev
```

## Tables

- `users(id, name, email)`
- `projects(id, creator_id, title, description, goal, deadline, status, created_at)`
- `reward_tiers(id, project_id, title, amount, quantity_total, quantity_remaining, created_at)`
- `pledges(id, project_id, backer_id, tier_id, amount, status, created_at)`
- `refunds(id, pledge_id, amount, status, created_at)`

## Endpoints

- `POST /projects`
- `GET /projects`
- `GET /projects/:id`
- `POST /projects/:id/tiers`
- `POST /projects/:id/pledges`
- `POST /projects/:id/finalize`

## Notes

- Reward tier selection during pledge creation uses `SELECT ... FOR UPDATE` to prevent overselling.
- Pledge creation and project finalization both use database transactions.
- Finalization marks a project as `successful` when pledged total reaches the goal, otherwise `failed`.
- Failed finalization creates refund records, marks pledges as `refunded`, and restores tier inventory.
