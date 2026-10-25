# Fixly Backend - Endpoint Audit

Base URL: http://localhost:5000
API prefix: /api/v1

## Authentication

Protected routes require:

```
Authorization: Bearer <token>
```

Tokens are issued by POST /api/v1/auth/login. The JWT payload is `{ id, role }` and expires after `JWT_EXPIRES_IN` (default `1d`). If `JWT_SECRET` is not configured, login succeeds without a token.

Middleware (src/middleware/authentication.js):
- requireAuth: Requires a valid Bearer token. Loads the user (password excluded), rejects missing/expired/invalid tokens and soft-deleted users with 401, then sets `req.user`.
- optionalAuth: Attaches `req.user` when a valid token is supplied; otherwise continues as a guest. Invalid or expired tokens are ignored.
- requireRole(...roles): Requires an authenticated user with one of the allowed roles. Returns 401 if not authenticated, 403 for the wrong role.
- requireOwnership({ model, ownerField, param, bypassRoles }): Requires `req.user` and verifies the resource identified by `req.params[param]` belongs to the user. Roles in `bypassRoles` (default `["admin"]`) skip the ownership check. Returns 403 for a non-owner.

Standard failures:
- 401: missing/malformed Authorization header, invalid or expired token, user no longer exists or is soft-deleted.
- 403: authenticated but role is not allowed, or caller does not own the resource.

## Schemas

User (src/models/users.js):
- firstName: string, required
- lastName: string, required
- email: string, required, unique, valid email
- password: string, required, min 10 / max 100 chars; registration validation additionally requires lowercase, uppercase and a digit
- role: string, required, house_owner (default), artisan, admin
- isDeleted: boolean, default false, indexed (soft-delete flag)
- deletedAt: Date, default null (soft-delete timestamp)
- timestamps: createdAt, updatedAt

ArtisanProfile (src/models/artisanProfile.js):
- user_id: ObjectId ref User, required, unique (one profile per user)
- professional_headline: string, required
- profession: string, required, Carpenter, Plumber, Welder, Brick Layer, Electrician, Auto Mechanic, Painter, Others
- experience_years: number, required
- rating: array of numbers, initialized to [] by the server (forbidden on create and update)
- phone_number: string, required
- starting_price: number, required
- residential_address: string, required
- office_address: string, required
- isDeleted: boolean, default false, indexed (soft-delete flag)
- deletedAt: Date, default null (soft-delete timestamp)
- timestamps: createdAt, updatedAt

## Endpoints

- GET / - Welcome message. Public.
- POST /api/v1/auth/register - Register. Body: firstName, lastName, email, password, confirmPassword, role (optional, defaults to house_owner). Public. 201 on success, 400 validation, 409 duplicate email.
- POST /api/v1/auth/login - Login. Body: email, password. Public. 200 on success with data { id, firstName, lastName, email, role, token }, 400 validation, 401 invalid credentials.
- POST /api/v1/artisan/profile - Create profile owned by the authenticated artisan. Requires Bearer auth + artisan role. Body: professional_headline, profession, experience_years, phone_number, starting_price, residential_address, office_address. Supplying user_id or rating is rejected. 201 on success, 400 validation, 401 unauthenticated, 403 non-artisan, 404 user not found, 409 profile exists.
- PATCH /api/v1/artisan/profile/:id - Update profile by profile _id (partial or full). Requires Bearer auth; owner or admin. Body: any of professional_headline, profession, experience_years, phone_number, starting_price, residential_address, office_address. Immutable: user_id, rating, _id, __v (400 if sent). Empty strings rejected. 200 on success, 400 invalid id / empty body, 401 unauthenticated, 403 non-owner, 404 not found.
- GET /api/v1/artisan/profiles - List all artisan profiles (phone/address excluded, user populated with firstName, lastName, role). Soft-deleted excluded. Query: profession (must be valid enum), search (matches professional_headline, profession, case-insensitive), page (default 1), limit (default 20, max 100), sortBy (createdAt, experience_years, starting_price; default createdAt), order (asc else desc). Returns data + meta { total, page, limit, totalPages }. Public; optional auth populates req.user for valid tokens. 400 invalid profession.
- GET /api/v1/artisan/profile/:id - Get one profile by profile _id (phone/address excluded, user populated). 400 invalid id, 404 if missing or soft-deleted. Public; optional auth populates req.user for valid tokens.
- GET /api/v1/admin/users - List all users (password excluded, sorted createdAt desc). Query: page (default 1), limit (default 20, max 100), includeDeleted=true to show soft-deleted (default hides them). Returns data + meta { total, page, limit, totalPages }. Requires Bearer auth + admin role.
- GET /api/v1/admin/user/:id - Get one user by user _id, includes artisanProfile for artisans (non-deleted only). Query: includeDeleted=true to view soft-deleted (default hides them with 404). Returns { id, firstName, lastName, email, role, createdAt, updatedAt, artisanProfile }. 400 invalid id, 404 not found. Requires Bearer auth + admin role.
- PATCH /api/v1/admin/user/:id - Update any user by user _id. Allowed: firstName, lastName, role. 400 invalid id / empty body / no allowed fields, 404 not found. Requires Bearer auth + admin role.
- PATCH /api/v1/admin/user/:id/soft-delete - Soft-delete user by user _id. Sets isDeleted=true, deletedAt=now on user and its artisan profile (if role is artisan). Idempotent: returns 200 "User already soft-deleted" if already flagged. 400 invalid id, 404 not found. Requires Bearer auth + admin role.
- PATCH /api/v1/admin/user/:id/restore - Restore soft-deleted user by user _id. Clears isDeleted/deletedAt on user and its artisan profile (if role is artisan). Idempotent: returns 200 "User is not soft-deleted" if not flagged. 400 invalid id, 404 not found. Requires Bearer auth + admin role.
- DELETE /api/v1/admin/user/:id - Hard-delete (permanent) user by user _id. Cascade-deletes artisan profile via Profile.deleteOne({ user_id }) if role is artisan, then User.deleteOne. Returns { id }. 400 invalid id, 404 not found. Requires Bearer auth + admin role.
- PATCH /api/v1/users/:id - Update own name by user _id. Allowed: firstName, lastName. 400 invalid id / empty body / no allowed fields, 404 not found. Requires Bearer auth; self or admin.
- All unmatched routes - 404 { statusCode: 404, success: false, message: "Route not found" }.

## Request Body Schemas

POST /api/v1/auth/register (Joi: registerValidationSchema):
- firstName: string, trimmed, required
- lastName: string, trimmed, required
- email: string, trimmed, lowercased, valid email, required
- password: string, required, 10-100 chars, must contain lowercase, uppercase and a digit
- confirmPassword: must match password when provided
- role: "house_owner" | "artisan", default "house_owner"; public admin registration is rejected
- Unknown fields are stripped.

POST /api/v1/auth/login (Joi: loginValidationSchema):
- email: string, trimmed, lowercased, valid email, required
- password: string, required

POST /api/v1/artisan/profile (Joi: profileCreateSchema):
- user_id: forbidden; ownership comes from the authenticated user
- professional_headline: string, trimmed, min 3 chars, required
- profession: one of Carpenter, Plumber, Welder, Brick Layer, Electrician, Auto Mechanic, Painter, Others, required
- experience_years: number >= 0, required
- phone_number: string, trimmed, min 7 chars, required
- starting_price: number >= 0, required
- residential_address: string, trimmed, min 3 chars, required
- office_address: string, trimmed, min 3 chars, required
- rating: forbidden; new profiles use the model default []

PATCH /api/v1/artisan/profile/:id (Joi: profileUpdateSchema):
- At least one of: professional_headline (min 3), profession (valid enum), experience_years (>= 0), phone_number (min 7), starting_price (>= 0), residential_address (min 3), office_address (min 3)
- Immutable: user_id, rating, _id, __v (400 if sent)
- Empty strings for updatable fields are rejected by the controller

PATCH /api/v1/admin/user/:id (controller-level validation):
- At least one of: firstName (string), lastName (string), role ("house_owner" | "artisan" | "admin")
- Other fields are ignored; 400 if no allowed field is supplied

PATCH /api/v1/users/:id (controller-level validation):
- At least one of: firstName (string), lastName (string)
- Other fields are ignored; 400 if no allowed field is supplied

## DB Snapshot (fixly-backend @ 2026-10-12, passwords omitted)

15 users, 5 profiles.

```json
{
  "users": [
    {
      "_id": "6ac7b039ffc97119b1c64a0b",
      "firstName": "daniel",
      "lastName": "Adeyemi",
      "email": "ada.adeyemi0@fixly.test",
      "role": "house_owner",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.914Z",
      "updatedAt": "2026-10-08T15:20:19.458Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a0c",
      "firstName": "Bola",
      "lastName": "Balogun",
      "email": "bola.balogun1@fixly.test",
      "role": "artisan",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.915Z",
      "updatedAt": "2026-10-08T15:01:13.915Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a0d",
      "firstName": "Chidi",
      "lastName": "Okafor",
      "email": "chidi.okafor2@fixly.test",
      "role": "admin",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.915Z",
      "updatedAt": "2026-10-08T15:01:13.915Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a0e",
      "firstName": "Dora",
      "lastName": "Eze",
      "email": "dora.eze3@fixly.test",
      "role": "house_owner",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.915Z",
      "updatedAt": "2026-10-08T15:01:13.915Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a0f",
      "firstName": "Emeka",
      "lastName": "Ibrahim",
      "email": "emeka.ibrahim4@fixly.test",
      "role": "artisan",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.915Z",
      "updatedAt": "2026-10-08T15:01:13.915Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a10",
      "firstName": "Fatima",
      "lastName": "Sule",
      "email": "fatima.sule5@fixly.test",
      "role": "admin",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.915Z",
      "updatedAt": "2026-10-08T15:01:13.915Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a11",
      "firstName": "Gbenga",
      "lastName": "Ojo",
      "email": "gbenga.ojo6@fixly.test",
      "role": "house_owner",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.915Z",
      "updatedAt": "2026-10-08T15:01:13.915Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a12",
      "firstName": "Hauwa",
      "lastName": "Daniels",
      "email": "hauwa.daniels7@fixly.test",
      "role": "artisan",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.915Z",
      "updatedAt": "2026-10-08T15:01:13.915Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a13",
      "firstName": "Ibrahim",
      "lastName": "Bello",
      "email": "ibrahim.bello8@fixly.test",
      "role": "admin",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.915Z",
      "updatedAt": "2026-10-08T15:01:13.915Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a14",
      "firstName": "Jide",
      "lastName": "Alabi",
      "email": "jide.alabi9@fixly.test",
      "role": "house_owner",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.916Z",
      "updatedAt": "2026-10-08T15:01:13.916Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a15",
      "firstName": "Kemi",
      "lastName": "Ogunleye",
      "email": "kemi.ogunleye10@fixly.test",
      "role": "artisan",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.916Z",
      "updatedAt": "2026-10-08T15:01:13.916Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a16",
      "firstName": "Lanre",
      "lastName": "Adebayo",
      "email": "lanre.adebayo11@fixly.test",
      "role": "admin",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.916Z",
      "updatedAt": "2026-10-08T15:01:13.916Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a17",
      "firstName": "Musa",
      "lastName": "Yusuf",
      "email": "musa.yusuf12@fixly.test",
      "role": "house_owner",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.916Z",
      "updatedAt": "2026-10-08T15:01:13.916Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a18",
      "firstName": "Ngozi",
      "lastName": "Nwosu",
      "email": "ngozi.nwosu13@fixly.test",
      "role": "artisan",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.916Z",
      "updatedAt": "2026-10-08T15:01:13.916Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a19",
      "firstName": "Olumide",
      "lastName": "Bakare",
      "email": "olumide.bakare14@fixly.test",
      "role": "admin",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.916Z",
      "updatedAt": "2026-10-08T15:01:13.916Z"
    }
  ],
  "profiles": [
    {
      "_id": "6ac7b039ffc97119b1c64a1d",
      "user_id": "6ac7b039ffc97119b1c64a15",
      "professional_headline": "Expert Brick Layer with 5+ years experience",
      "profession": "Brick Layer",
      "experience_years": 6,
      "rating": [],
      "phone_number": "08031333333",
      "starting_price": 9500,
      "residential_address": "15 Allen Avenue, Ikeja, Lagos",
      "office_address": "8 Workshop Road, Yaba, Lagos",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.994Z",
      "updatedAt": "2026-10-08T15:01:13.994Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a1a",
      "user_id": "6ac7b039ffc97119b1c64a0c",
      "professional_headline": "Expert Carpenter with 5+ years experience",
      "profession": "Carpenter",
      "experience_years": 3,
      "rating": [],
      "phone_number": "08031000000",
      "starting_price": 5000,
      "residential_address": "12 Allen Avenue, Ikeja, Lagos",
      "office_address": "5 Workshop Road, Yaba, Lagos",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.993Z",
      "updatedAt": "2026-10-08T15:01:13.993Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a1e",
      "user_id": "6ac7b039ffc97119b1c64a18",
      "professional_headline": "Expert Electrician with 5+ years experience",
      "profession": "Electrician",
      "experience_years": 7,
      "rating": [],
      "phone_number": "08031444444",
      "starting_price": 11000,
      "residential_address": "16 Allen Avenue, Ikeja, Lagos",
      "office_address": "9 Workshop Road, Yaba, Lagos",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.994Z",
      "updatedAt": "2026-10-08T15:01:13.994Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a1b",
      "user_id": "6ac7b039ffc97119b1c64a0f",
      "professional_headline": "Expert Plumber with 5+ years experience",
      "profession": "Plumber",
      "experience_years": 4,
      "rating": [],
      "phone_number": "08031111111",
      "starting_price": 6500,
      "residential_address": "13 Allen Avenue, Ikeja, Lagos",
      "office_address": "6 Workshop Road, Yaba, Lagos",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.994Z",
      "updatedAt": "2026-10-08T15:01:13.994Z"
    },
    {
      "_id": "6ac7b039ffc97119b1c64a1c",
      "user_id": "6ac7b039ffc97119b1c64a12",
      "professional_headline": "Expert Welder with 5+ years experience",
      "profession": "Welder",
      "experience_years": 5,
      "rating": [],
      "phone_number": "08031222222",
      "starting_price": 8000,
      "residential_address": "14 Allen Avenue, Ikeja, Lagos",
      "office_address": "7 Workshop Road, Yaba, Lagos",
      "__v": 0,
      "createdAt": "2026-10-08T15:01:13.994Z",
      "updatedAt": "2026-10-08T15:01:13.994Z"
    }
  ]
}
```
