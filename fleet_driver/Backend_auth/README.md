# Backend_auth (Node.js + PostgreSQL)

This backend exposes real authentication and trip APIs for the Fleet Driver Flutter app.

## 1) Prerequisites

- Node.js 18+
- PostgreSQL running locally
- Database name: postgres

## 2) Configure environment

Create a file named .env in Backend_auth and copy values from .env.example.

Example:

PORT=4000
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/postgres
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

## 3) Install dependencies

Run inside Backend_auth:

npm install

## 4) Run SQL migrations

This executes all SQL files in Backend_auth/database in filename order:

npm run migrate

## 5) Seed demo login

This creates/updates a real chauffeur account and demo trips:

npm run seed

Default login after seed:
- employee_id: DRV-00412
- password: AA123456 (cin)

## 6) Start backend

npm run dev

Health check:
- GET http://localhost:4000/health

## 7) API endpoints

- POST /api/auth/login
- GET /api/auth/me
- GET /api/trips/active
- POST /api/trips/:tripId/start
- POST /api/trips/:tripId/end
- POST /api/trips/:tripId/locations
- GET /api/trips/history

Database tables used by this backend:
- chauffeurs (with auth columns)
- driver_trips
- driver_trip_locations

## 8) Flutter connection

The Flutter app now calls this backend.

For Android emulator, run Flutter with:

flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000

For desktop/iOS simulator, localhost usually works:

flutter run --dart-define=API_BASE_URL=http://localhost:4000
