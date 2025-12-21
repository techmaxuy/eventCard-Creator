# AI Coding Guidelines for EventCard Creator

## Architecture Overview
- **Framework**: Next.js 16 with App Router, TypeScript, Tailwind CSS
- **Authentication**: NextAuth v5 with JWT sessions, multi-provider OAuth (Google, GitHub, Microsoft), custom credentials
- **Database**: Prisma ORM with PostgreSQL (Neon), custom adapter for serverless
- **Storage**: Azure Blob Storage for avatars, images
- **Email**: Resend for verification and notifications
- **Internationalization**: next-intl with English/Spanish locales
- **Features**: User auth, profiles, admin panel, event cards creation with guest management

## Key Patterns
- **File Structure**: Features in `src/features/`, core modules in `src/core/`, shared libs in `src/core/shared/lib/`
- **Server Actions**: Async functions in `actions/` folders, use Zod schemas from `src/schemas/`
- **Database Access**: Import `prisma` from `src/core/shared/lib/db.ts`, use transactions for multi-step operations
- **Auth Checks**: Use `req.auth` in middleware/actions, check `session.user.role` for ADMIN routes
- **Error Handling**: Return error objects like `{ error: "ErrorType" }` from actions, handle in components
- **Styling**: Tailwind with `clsx` for conditional classes, dark mode support
- **Components**: Reusable in `components/` folders, use Lucide icons

## Development Workflow
- **Start Dev**: `npm run dev` (generates Prisma client)
- **Build**: `npm run build` (runs migrations, builds app)
- **Database**: Migrations in `prisma/migrations/`, test with `npm run test:db-full`
- **Linting**: `npm run lint` with ESLint

## Conventions
- **Imports**: Use `@/` for src, absolute paths
- **Naming**: PascalCase for components, camelCase for functions
- **Schemas**: Zod in `src/schemas/`, validate inputs in actions
- **Environment**: Use `.env.example` as template, required vars: DATABASE_URL, NEXTAUTH_SECRET, etc.
- **Routes**: Protected by middleware, admin routes check role
- **Event Cards**: Admins create EventTypes, users create Events with unique slugs, guests RSVP

## Examples
- Auth action: Validate with schema, check db, return error or success
- Component: Use `useTranslations` from next-intl, handle loading states
- DB query: `await prisma.user.findUnique({ where: { email } })`