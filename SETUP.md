# Setup Instructions

This project uses Node.js 20 and npm 10.

## Run locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The app starts on port 5000. For local database-backed functionality, set
`DATABASE_URL` and `SESSION_SECRET` before running it.

## Build and production start

```bash
npm run build
npm start
```

`npm start` synchronizes the PostgreSQL schema with Drizzle before starting
the compiled server. The database URL must be available when this command runs.

## Railway commands

Use these service settings:

- **Build Command:** `npm run build`
- **Start Command:** `npm start`

Railway installs dependencies before the build, so do not put `npm install` in
the Build Command. Configure `DATABASE_URL`, `SESSION_SECRET`, and
`NODE_ENV=production` as Railway variables.
