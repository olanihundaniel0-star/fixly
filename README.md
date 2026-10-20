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
MONGODB_URI=mongodb://127.0.0.1:27017/fixly-backend
JWT_SECRET=replace-with-long-random-secret
JWT_EXPIRES_IN=1d
```

Start the development server:

```bash
npm run dev
```

The API runs at `http://localhost:5000` by default. Use `npm start` to run it without automatic restarts.

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
| `/api/v1/users` | Update your user account |
| `/api/v1/admin` | Manage users as an administrator |

Protected endpoints require an `Authorization: Bearer <token>` header.
