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
- [x] Password hashing (bcrypt, salt 12) during user registration
- [x] Authentication (JWT) and RBAC authorization middleware for admin and user-specific endpoints
- [x] Sanitized search regex input in artisan profile queries (ReDoS/injection fixed)
- [x] Automated test suite (node:test + supertest, `npm test`, separate test DB)
- [x] Security middleware: helmet, cors (CLIENT_ORIGIN allowlist), express-rate-limit on /api/v1 and stricter on /api/v1/auth
- [x] JWT startup guard (refuses to start without JWT_SECRET), role dropped from token payload
- [x] Soft-deleted profiles/users blocked from update + profile creation (`isDeleted` checks)
- [x] Shared pagination util, shared PROFESSIONS constant, prod-safe error responses

## What Is Next
- [ ] Prevent self-registration of `admin` roles in registration schema (deferred; known critical)
- [ ] Reject trusting `user_id` from request body in artisan profile creation (deferred; known critical — use `req.user._id`)
- [ ] Fix soft-delete edge cases (MongoDB partial unique index on email/user_id, atomic transactions on cascade operations)
- [ ] Return deletion metadata (`isDeleted`, `deletedAt`) in admin `getUser` endpoint and fetch matching profile state
- [ ] `braces` dev-only advisory via nodemon has no upstream fix; revisit when fixed

## Known Gotchas & Constraints
- `Profile.updateProfile` validation is partially eclipsed by Joi middleware stripping unknown keys.
- Search queries with regex characters like `(`, `[` currently trigger unhandled syntax errors.
