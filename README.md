# lab14.1 — Basic Login System

Express authentication API for the **Innovate Inc.** user portal. Provides the two
fundamental auth endpoints: user **registration** (with bcrypt-hashed passwords)
and **login** (credential validation + JWT issuance).

## Tech Stack

| Package        | Purpose                              |
| -------------- | ------------------------------------ |
| `express`      | HTTP server + routing                |
| `mongoose`     | MongoDB object modeling              |
| `bcrypt`       | Password hashing / comparison        |
| `jsonwebtoken` | JWT signing on successful login      |
| `dotenv`       | Env vars (`MONGO_URI`, `JWT_SECRET`, `PORT`) |
| `nodemon`      | Dev auto-reload (`pnpm dev`)         |

## Project Structure

```
lab14.1_BasicLogin/
├── server.js                    # Entry point: env, middleware, DB connect, listen
├── models/
│   └── User.js                  # User schema, pre-save hash hook, isCorrectPassword, toJSON
├── controllers/
│   └── userController.js        # register() + login() business logic
├── routes/
│   └── userRoutes.js            # URL → handler map (POST /register, POST /login)
├── .env                         # Secrets (git-ignored, never commit)
├── .gitignore                   # Ignores node_modules/ and .env
└── package.json                 # Scripts: pnpm dev (nodemon), pnpm start (node)
```

## Setup

```bash
pnpm install
```

Create a `.env` file in the project root (see `.env.example` values below —
use your own secrets):

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?appName=<app>
JWT_SECRET=<a-long-random-string>
PORT=3000
```

Run the server:

```bash
pnpm dev    # development (auto-reload)
pnpm start  # production
```

On boot you should see:

```
Connected to MongoDB
Server running on port 3000
```

## API Reference

### `GET /` — Health check

```bash
curl http://localhost:3000/
```

```json
{ "message": "Innovate Inc. Auth API running" }
```

### `POST /api/users/register` — Register a new user

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ana","email":"ana@example.com","password":"Secreto123"}'
```

Success — `201 Created` (note: no `password` field in the response):

```json
{
  "_id": "6ab9e51b2f7531acdcb7423a",
  "username": "ana",
  "email": "ana@example.com",
  "createdAt": "2026-09-28T03:55:07.503Z",
  "updatedAt": "2026-09-28T03:55:07.503Z",
  "__v": 0
}
```

Duplicate email — `400 Bad Request`:

```json
{ "message": "User with this email already exists." }
```

### `POST /api/users/login` — Authenticate and get a JWT

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"Secreto123"}'
```

Success — `200 OK`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "6ab9e51b2f7531acdcb7423a",
    "username": "ana",
    "email": "ana@example.com",
    "createdAt": "2026-09-28T03:55:07.503Z",
    "updatedAt": "2026-09-28T03:55:07.503Z",
    "__v": 0
  }
}
```

Wrong password or unknown email — `400 Bad Request` (same generic message
in both cases, so attackers can't tell whether an email is registered):

```json
{ "message": "Incorrect email or password." }
```

Tip: paste the `token` into [jwt.io](https://jwt.io) to inspect its payload
(`_id`, `username`, `iat`, `exp`).

## How It Works

1. **Registration:** the controller validates input and checks for duplicates,
   then `new User(...)` + `save()` triggers the model's `pre('save')` hook,
   which salts + hashes the password with bcrypt. Only the hash is stored.
2. **Login:** the controller finds the user by email and calls
   `user.isCorrectPassword()`, which uses `bcrypt.compare` (needed because
   salted hashes differ every time — plain `===` would never match).
3. **Token:** on success, `jsonwebtoken` signs `{ _id, username }` with
   `JWT_SECRET` (1h expiry). Only non-sensitive data goes in the payload.
4. **Hygiene:** the model's `toJSON()` strips `password` from every response,
   so hashes never leak over the API.

## Acceptance Criteria (Lab 14.1)

- [x] Express server runs without errors.
- [x] `POST /api/users/register` creates a user with a hashed password (`$2b$10$...` verified in DB) and returns user data.
- [x] `POST /api/users/login` validates credentials and returns a signed JWT.
- [x] Login rejects wrong passwords and non-existent users with `400`.

## Notes

- `.env` and `node_modules/` are git-ignored and must never be pushed.
- Known gotcha (documented in `models/User.js`): Mongoose 9 async `pre('save')`
  hooks take **no `next` parameter** — declaring it throws `next is not a function`.
