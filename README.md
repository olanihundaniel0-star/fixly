# Fixly

Fixly is a project for connecting homeowners with artisans such as plumbers, electricians, carpenters, and painters. It includes an Express API backed by MongoDB and a React frontend.

The backend supports user accounts and artisan profiles. The frontend is currently a Vite starter page, with the application interface still to be built.

## Features

- User registration and login with JWT authentication.
- Roles for homeowners (`house_owner`), artisans, and administrators.
- Artisan profiles with profession, experience, contact details, and starting prices.
- Browsing artisan profiles and updating owned profiles.
- User account updates.
- Admin user management, including deletion, soft deletion, and restoration.

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, Joi, JWT, and bcryptjs.
- **Frontend:** React and Vite.

## Project Structure

```text
backend/src/    API routes, controllers, models, middleware, and configuration
frontend/src/  React components, styles, and assets
```

## Getting Started

You need Node.js, npm, and a running MongoDB instance or a MongoDB Atlas connection string.

### Backend

From the project root:

```bash
cd backend
npm install
cp -n .env.example .env
```

Update `backend/.env` with your MongoDB connection string and a long, random JWT secret:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/fixly-backend
JWT_SECRET=replace-with-long-random-secret
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:5173
```

`CLIENT_ORIGIN` is the comma-separated list of browser origins allowed to call the API (e.g. your Vite dev server). Leave it empty to block cross-origin browser requests.

Start the development server:

```bash
npm run dev
```

The API runs at `http://localhost:5000` by default. Use `npm start` to run it without automatic restarts.

### Security middleware

The API ships with `helmet` (security headers), `cors` (origin gating via `CLIENT_ORIGIN`), and `express-rate-limit` (a general limiter on `/api/v1` plus a stricter one on `/api/v1/auth`; see `AUTH_RATE_LIMIT_MAX` / `API_RATE_LIMIT_MAX` in `.env.example`). The server refuses to start without `JWT_SECRET`.

### Tests

From `backend`:

```bash
npm test
```

The suite (`backend/tests/`) runs with Node's built-in test runner and Supertest. Each integration run creates a unique `fixly-test-<random-id>` database and only drops that database during cleanup. Set `MONGODB_URI_TEST` to select a test server; the database name in that URI is overridden. The default server is `mongodb://127.0.0.1:27017`.

### Frontend

In a separate terminal, from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite. To create a production build, run `npm run build` inside `frontend`.

## API Routes

| Base path | Purpose |
| --- | --- |
| `/api/v1/auth` | Register and log in |
| `/api/v1/artisan` | Create, browse, and update artisan profiles |
| `/api/v1/users` | Update your user account and manage your avatar |
| `/api/v1/admin` | Manage users as an administrator |
| `/api/v1/uploads` | Upload images to Cloudinary (auth required) |

Protected endpoints require an `Authorization: Bearer <token>` header.

Public registration accepts only `house_owner` and `artisan` roles. An existing administrator can promote a registered account through `PATCH /api/v1/admin/user/:id`; the first administrator must be provisioned by a trusted database operator.

Profile creation uses the authenticated artisan as its owner. Omit `user_id` from the request body; supplying it returns `400`.
Ratings are initialized to an empty array by the server. Supplying `rating` when creating or updating a profile returns `400`.

Accounts with an artisan profile, including a soft-deleted profile, must retain the `artisan` role; changing them to another role returns `409`. Public profile reads require an active artisan owner and an active profile. Admin user details with `includeDeleted=true` include deletion metadata and any soft-deleted profile.

User deletion and restoration work with standalone MongoDB. They update the user first, then its profile regardless of the user's current role. These writes are not atomic: if the second write fails, the endpoint returns `500` and the same request can be retried to finish the operation. Public reads hide profiles belonging to deactivated, missing, or non-artisan users, including when a cascade is incomplete. A replica set and transactions are required if atomic multi-document changes become a deployment requirement.

### Image uploads

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env` to enable uploads. While they are missing, upload endpoints respond with `503`. Accepted format: `POST /api/v1/uploads/image` as `multipart/form-data` with an `image` field (JPEG/PNG/WEBP, up to 5MB); the response returns the Cloudinary `url` and `publicId`.

### User profile pictures

Avatars belong to the user account and work for homeowners, artisans, and administrators. All avatar routes require a Bearer token and operate on the authenticated account.

| Method and path | Behavior |
| --- | --- |
| `GET /api/v1/users/me/avatar` | Returns `data.avatar` as `{ "url": "https://..." }` or `null` |
| `PUT /api/v1/users/me/avatar` | Creates or replaces the picture; returns `201` for a first upload and `200` for a replacement |
| `DELETE /api/v1/users/me/avatar` | Removes the picture; returns `200` with `data.avatar: null`, including when there is no picture |

Upload exactly one JPEG, PNG, or WEBP image, up to 5MB, as the multipart field `image`. Additional fields and files are rejected. Cloudinary validates the image format and stores a 512 by 512 WEBP image with automatic crop positioning and quality. Upload attempts are limited to 10 per account in 15 minutes.

```bash
curl -X PUT http://localhost:5000/api/v1/users/me/avatar \
  -H 'Authorization: Bearer <token>' \
  -F 'image=@/path/to/photo.jpg'
```

The server saves the new image before removing the previous one. A failed database save or a conflicting account change triggers cleanup of the unattached upload. Concurrent changes return `409`; reload the avatar before retrying. Existing accounts need no data migration.

Cloudinary public IDs, avatar revisions, and pending cleanup records remain internal. Login and admin responses include `avatar`, and public artisan responses include it under `user_id.avatar`. A missing picture is represented by `null`, allowing clients to display a default image. The generic `/uploads/image` endpoint only uploads an image; use the avatar routes to attach a picture to an account.

Failed cleanup is retained on the account and retried during the next avatar change or permanent account deletion. Replacing a picture still succeeds if only the previous image's cleanup fails. Deleting a picture returns `503` if external cleanup is pending; the account already has `avatar: null`, and repeating DELETE finishes cleanup. If MongoDB is unavailable while an unattached upload needs cleanup, the server logs its public ID for recovery. There is no background cleanup worker.

Soft deletion retains pictures for restoration. Permanent deletion first deactivates the account and removes its current and pending avatar images; if Cloudinary cleanup fails, it returns `503` and retains the deactivated account for retry.

Cloudinary configuration is checked for presence at startup. The configured cloud name, API key, and API secret must also be valid for real uploads. Avatar tests exercise multipart requests and MongoDB persistence with the Cloudinary upload and deletion methods mocked, so they do not upload files to a real cloud account.
