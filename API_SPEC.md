# API_SPEC

This document describes the main API routes for the Crowdfunding backend.

Base URL:

```text
http://localhost:5000
```

## 1. Register user

**POST** `/auth/register`

Request body:

```json
{
  "full_name": "Test User",
  "email": "test@example.com",
  "password": "123456"
}
```

Success response:
- `201 Created`

## 2. Login user

**POST** `/auth/login`

Request body:

```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

Success response:
- `200 OK`
- returns JWT token

## 3. Create project

**POST** `/projects`

Authorization:
- `Bearer token`

Request body:

```json
{
  "title": "Indie Game",
  "description": "A small indie game",
  "goal": 1000,
  "deadline": "2026-12-01T00:00:00",
  "status": "active"
}
```

Success response:
- `201 Created`

## 4. Get all projects

**GET** `/projects`

Optional query params:
- `finalized=true`
- `status=successful`
- `status=failed`

Success response:
- `200 OK`

## 5. Get project by id

**GET** `/projects/:id`

Success response:
- `200 OK`

Not found:
- `404 Not Found`

## 6. Get project progress

**GET** `/projects/:id/progress`

Success response:
- `200 OK`

Returns:
- project id
- goal
- pledged amount
- remaining amount
- project status
- whether the project is finalized

## 7. Add reward tier

**POST** `/projects/:id/tiers`

Authorization:
- `Bearer token`

Request body:

```json
{
  "title": "Sticker Pack",
  "amount": 10,
  "quantity_total": 50
}
```

Success response:
- `201 Created`

## 8. Create pledge

**POST** `/projects/:id/pledges`

Authorization:
- `Bearer token`

With tier:

```json
{
  "tier_id": 1,
  "amount": 10
}
```

Without tier:

```json
{
  "amount": 5
}
```

Rules:
- project must exist
- deadline must not be passed
- if `tier_id` is provided, the tier must belong to the same project
- if `tier_id` is provided, `quantity_remaining` must be available
- pledge creation runs inside a transaction

Success response:
- `201 Created`

## 9. Finalize project

**POST** `/projects/:id/finalize`

Authorization:
- `Bearer token`

Request body:
- none

Behavior:
- if total pledged amount is greater than or equal to project goal:
  - project becomes `successful`
  - pledges become `confirmed`
- if total pledged amount is below project goal:
  - project becomes `failed`
  - refunds are created
  - pledges become `refunded`
  - tier quantities are restored

Success response:
- `200 OK`

If the project was already finalized:
- `400 Bad Request`

## Main entities

### users
- `id`
- `full_name`
- `email`
- `password_hash`
- `created_at`

### projects
- `id`
- `title`
- `description`
- `goal`
- `deadline`
- `status`
- `creator_id`
- `created_at`

### reward_tiers
- `id`
- `project_id`
- `title`
- `amount`
- `quantity_total`
- `quantity_remaining`

### pledges
- `id`
- `project_id`
- `backer_id`
- `tier_id`
- `amount`
- `status`
- `created_at`

### refunds
- `id`
- `pledge_id`
- `amount`
- `status`
- `created_at`
