# Monteiro Corretora - Insurance Broker Website

## Overview

This is a modern insurance broker website for "Monteiro Corretora," a São Paulo-based insurance company. The application is a full-stack TypeScript project featuring a React frontend with a polished, professional design and an Express.js backend with PostgreSQL database storage. The site includes a home page with hero section and services, an about page, a blog with individual post pages, and a contact form for client inquiries.

## User Preferences

Preferred communication style: Simple, everyday language.

## How to Run

```bash
npm install
npm run dev
```

The app starts on port 5000. The `npm run dev` script uses `node_modules/.bin/tsx server/index.ts` (tsx must be referenced via node_modules path, not global).

Database schema is auto-synced on startup. To push schema changes manually:
```bash
npm run db:push
```

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for page transitions and scroll animations
- **State Management**: TanStack React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Typography**: Custom fonts (Manrope for body, Playfair Display for headings)

### Backend Architecture
- **Runtime**: Node.js with TypeScript (tsx for development)
- **Framework**: Express.js 5
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Validation**: Zod schemas shared between frontend and backend
- **API Design**: REST API with typed route definitions in `shared/routes.ts`

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route page components
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utilities and query client
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route handlers
│   ├── storage.ts    # Database storage layer
│   └── db.ts         # Database connection
├── shared/           # Shared types and schemas
│   ├── schema.ts     # Drizzle database schema
│   └── routes.ts     # API route definitions with Zod schemas
└── migrations/       # Drizzle database migrations
```

### Data Flow
1. Frontend uses custom hooks (`use-content.ts`, `use-inquiries.ts`) that wrap TanStack Query
2. Hooks call REST API endpoints defined in `shared/routes.ts`
3. Backend routes in `server/routes.ts` handle requests using the storage layer
4. Storage layer (`server/storage.ts`) uses Drizzle ORM to interact with PostgreSQL

### Database Schema
Key tables:
- **contacts**: CRM contacts (PF and PJ) with anniversaryDate for commemorative dates and age display
- **clientes**: Insurance clients linked to contacts base for pre-filling
- **leads**: Sales opportunities in pipeline
- **apolices**: Insurance policies
- **posts**: Blog posts
- **services**: Insurance services
- **inquiries**: Contact form submissions

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Database**: `npm run db:push` uses Drizzle Kit to push schema changes

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable (auto-configured by Replit)

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (provided by Replit)
- `SESSION_SECRET` — Express session secret (set in Replit Secrets)
- `PORT` — Server port (defaults to 5000)
