This project was split into two parts so that both team members could work in parallel and then combine the backend into one shared API.

## Mergen Tlegen

- database design for `projects` and `reward_tiers`
- project creation endpoint
- get all projects endpoint
- get project by id endpoint
- add reward tier endpoint
- initial Express backend structure
- PostgreSQL schema for the Part 1 entities

In short, this part covered the creator side of the platform: creating projects and managing reward tiers.

## Timur

- `pledges` and `refunds` logic
- pledge creation flow
- finalize project logic
- transaction handling for pledge creation
- failed project refund flow

This part covered the backer side and the end-of-campaign logic.

## Collaboration note

Even though the work was divided, the final project was tested together after merging so that the full flow works as one API:
- create project
- add tiers
- create pledges
- finalize project
