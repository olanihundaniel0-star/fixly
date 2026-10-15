# Fixly Backend - Endpoint Audit

Base URL: http://localhost:5000
API prefix: /api/v1

Note: No auth middleware yet. All routes are open.

## Schemas

User (src/models/users.js):
- firstName: string, required
- lastName: string, required
- email: string, required, unique, valid email
- password: string, required, min 10 chars, lowercase + uppercase + digit, max 100
- role: string, required, house_owner (default), artisan, admin
- isDeleted: boolean, default false, indexed (soft-delete flag)
- deletedAt: Date, default null (soft-delete timestamp)
- timestamps: createdAt, updatedAt

ArtisanProfile (src/models/artisanProfile.js):
- user_id: ObjectId ref User, required, unique (one profile per user)
- professional_headline: string, required
- profession: string, required, Carpenter, Plumber, Welder, Brick Layer, Electrician, Auto Mechanic, Painter, Others
- experience_years: number, required
- rating: array of numbers, optional, create only (immutable on update)
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
- POST /api/v1/artisan/profile - Create profile. Body: user_id, professional_headline, profession, experience_years, phone_number, starting_price, residential_address, office_address, rating (optional). Artisan only (user.role must be artisan). 201 on success, 400 invalid user_id, 403 non-artisan, 404 user not found, 409 profile exists.
- PATCH /api/v1/artisan/profile/:id - Update profile by profile _id (partial or full). Body: any of professional_headline, profession, experience_years, phone_number, starting_price, residential_address, office_address. Immutable: user_id, rating, _id, __v (400 if sent). Empty strings rejected. Artisan owner, admin. 200 on success, 400 invalid id / empty body, 404 not found.
- GET /api/v1/artisan/profiles - List all artisan profiles (phone/address excluded, user populated with firstName, lastName, role). Soft-deleted excluded. Query: profession (must be valid enum), search (matches professional_headline, profession, case-insensitive), page (default 1), limit (default 20, max 100), sortBy (createdAt, experience_years, starting_price; default createdAt), order (asc else desc). Returns data + meta { total, page, limit, totalPages }. Public. 400 invalid profession.
- GET /api/v1/artisan/profile/:id - Get one profile by profile _id (phone/address excluded, user populated). Returns 404 if missing or soft-deleted. Public.
- GET /api/v1/admin/users - List all users (password excluded, sorted createdAt desc). Query: page (default 1), limit (default 20, max 100), includeDeleted=true to show soft-deleted (default hides them). Returns data + meta { total, page, limit, totalPages }. Admin only.
- GET /api/v1/admin/user/:id - Get one user by user _id, includes artisanProfile for artisans (non-deleted only). Query: includeDeleted=true to view soft-deleted (default hides them with 404). Returns { id, firstName, lastName, email, role, createdAt, updatedAt, artisanProfile }. 400 invalid id, 404 not found. Admin only.
- PATCH /api/v1/admin/user/:id - Update any user by user _id. Allowed: firstName, lastName, role. 400 invalid id / empty body / no allowed fields, 404 not found. Admin only.
- PATCH /api/v1/admin/user/:id/soft-delete - Soft-delete user by user _id. Sets isDeleted=true, deletedAt=now on user and its artisan profile (if role is artisan). Idempotent: returns 200 "User already soft-deleted" if already flagged. 400 invalid id, 404 not found. Admin only.
- PATCH /api/v1/admin/user/:id/restore - Restore soft-deleted user by user _id. Clears isDeleted/deletedAt on user and its artisan profile (if role is artisan). Idempotent: returns 200 "User is not soft-deleted" if not flagged. 400 invalid id, 404 not found. Admin only.
- DELETE /api/v1/admin/user/:id - Hard-delete (permanent) user by user _id. Cascade-deletes artisan profile via Profile.deleteOne({ user_id }) if role is artisan, then User.deleteOne. Returns { id }. 400 invalid id, 404 not found. Admin only.
- PATCH /api/v1/users/:id - Update own name by user _id. Allowed: firstName, lastName. 400 invalid id / empty body / no allowed fields, 404 not found. Any logged in user (self).
- All unmatched routes - 404 { statusCode: 404, success: false, message: "Route not found" }.

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
