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
- timestamps: createdAt, updatedAt

ArtisanProfile (src/models/artisanProfile.js):
- user_id: ObjectId ref User, required, unique (one profile per user)
- professional_headline: string, required
- profession: string, required, Carpenter, Plumber, Welder, Brick Layer, Electrician, Auto Mechanic, Painter, Others
- experience_years: number, required
- rating: array of numbers, optional, create only
- phone_number: string, required
- starting_price: number, required
- residential_address: string, required
- office_address: string, required
- timestamps: createdAt, updatedAt

## Endpoints

- GET / - Welcome message. Public.
- POST /api/v1/auth/register - Register. Body: firstName, lastName, email, password, confirmPassword, role (optional, defaults to house_owner). Public.
- POST /api/v1/artisan/profile - Create profile. Body: user_id, professional_headline, profession, experience_years, phone_number, starting_price, residential_address, office_address, rating (optional). Artisan only.
- PUT /api/v1/artisan/profile/:id - Update profile by profile _id. Body: any of professional_headline, profession, experience_years, phone_number, starting_price, residential_address, office_address. Artisan owner, admin.
- PATCH /api/v1/artisan/profile/:id - Partial update, same as PUT. Artisan owner, admin.
- GET /api/v1/admin/users - List all users (password excluded). Admin only.
- GET /api/v1/admin/user/:id - Get one user by user _id, includes artisanProfile for artisans. Admin only.
- PATCH /api/v1/admin/user/:id - Update any user by user _id. Allowed: firstName, lastName, role. Admin only.
- PATCH /api/v1/users/:id - Update own name by user _id. Allowed: firstName, lastName. Any logged in user (self).
