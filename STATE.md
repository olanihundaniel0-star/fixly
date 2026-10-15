# Project State & Memory

## Current Goal
Comprehensive code review and architectural hardening of the Fixly backend API (Express + MongoDB).

## Key Decisions & Rationale
- Soft deletion implemented using `isDeleted` and `deletedAt` flags on `User` and `Profile` collections.
- Role-based separation (`house_owner`, `artisan`, `admin`) requires authentication and authorization middleware prior to production exposure.

## What Is Done
- [x] Initial Express server setup and MongoDB connection
- [x] User registration endpoint (`/api/v1/auth/register`)
- [x] Artisan profile creation, update, and search/listing endpoints
- [x] Admin endpoints for user retrieval and update
- [x] Admin endpoints for user hard deletion, soft deletion, and restoration
- [x] Fixed middleware import paths following relocation to `src/middleware/`

## What Is Next
- [ ] Implement password hashing (bcrypt/argon2) during user registration
- [ ] Prevent self-registration of `admin` roles in registration schema
- [ ] Implement authentication (JWT) and RBAC authorization middleware for admin and user-specific endpoints
- [ ] Sanitize search regex input in artisan profile queries to prevent ReDoS/syntax crashes
- [ ] Fix soft-delete edge cases (MongoDB partial unique index on email/user_id, atomic transactions on cascade operations)
- [ ] Return deletion metadata (`isDeleted`, `deletedAt`) in admin `getUser` endpoint and fetch matching profile state
- [ ] Set up automated test suite (Jest / Supertest)

## Known Gotchas & Constraints
- `Profile.updateProfile` validation is partially eclipsed by Joi middleware stripping unknown keys.
- Search queries with regex characters like `(`, `[` currently trigger unhandled syntax errors.
