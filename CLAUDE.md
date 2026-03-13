# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Build for production
pnpm build:standalone # Build standalone output for deployment
pnpm start        # Start production server
pnpm lint         # Run ESLint (eslint.config.mjs)
pnpm generate:api # Generate API client from openapi.json
```

## Architecture Overview

This is a Next.js 16.1 application with App Router, React 19, TypeScript, and Tailwind CSS 4.

### Key Technologies

- **UI Framework**: React 19 with Next.js App Router
- **Styling**: Tailwind CSS 4 + shadcn/ui components (new-york style)
- **State Management**: React Query (@tanstack/react-query)
- **Internationalization**: next-intl with zh (default) and en locales
- **API Client**: Auto-generated from OpenAPI spec using @hey-api/openapi-ts

### Directory Structure

```
src/
├── api/              # Auto-generated API client (openapi-ts)
├── app/              # Next.js App Router
│   ├── [locale]/     # Locale-based routing (zh/en)
│   │   ├── (main)/   # Public pages (home, login, profile, etc.)
│   │   └── dashboard/ # Admin dashboard (protected)
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── providers/    # React Query, Theme providers
│   └── layout/       # Layout components
├── contexts/         # React contexts (AuthContext, SiteConfigContext)
├── hooks/            # Custom hooks
├── i18n/             # Internationalization config
├── lib/              # Utilities (hey-api client, auth, seo-utils)
├── messages/         # i18n translation files (zh.json, en.json)
└── middleware.ts     # Auth protection and locale routing
```

### Route Groups

- `(main)`: Public-facing pages - home, article, cosers, login, register, profile, settings, vip, search
- `dashboard`: Admin area - articles, cosers, users, roles, permissions, tags, orders, payments, settings

### Authentication Flow

1. Tokens stored in both cookies and localStorage (access_token, refresh_token)
2. Middleware (`src/middleware.ts`) protects routes:
   - AUTH_PATHS (`/login`, `/register`) - redirects authenticated users to home
   - PROTECTED_PATHS (`/profile`, `/settings`, `/wallet`, `/dashboard`) - requires authentication
3. `AuthContext` manages client-side auth state with SSR support via `serverUser` prop
4. API client interceptors (`src/lib/hey-api.ts`) handle:
   - Automatic token injection (Authorization header)
   - Device-Id and Device-Type headers
   - Token refresh on 401 responses
5. Server-side auth: `src/lib/auth.ts` provides `getServerUser()` and `isServerAuthenticated()`

### API Integration

- OpenAPI spec: `openapi.json` at project root
- Generated client: `src/api/` (types.gen.ts, sdk.gen.ts, client.gen.ts)
- Client config: `src/lib/hey-api.ts` - base URL from `NEXT_PUBLIC_API_BASE_URL`
- Run `pnpm generate:api` after updating openapi.json

### i18n Setup

- Config: `src/i18n/routing.ts` defines locales (zh, en) with zh as default
- Navigation: Use `Link`, `useRouter`, `usePathname` from `@/i18n/routing` (not next/navigation)
- Translations: `src/messages/zh.json` and `src/messages/en.json`
- Server components use `setRequestLocale(locale)` and `getMessages()`

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- `NEXT_PUBLIC_SITE_URL` - Public site URL for SEO metadata

### Code Conventions

- Path alias: `@/*` maps to `./src/*`
- Generated API files (`*.gen.ts`) are ignored by ESLint
- Use shadcn/ui components from `@/components/ui/`
- Theme provider supports light/dark/system modes

### shadcn/ui Components

Components are managed via the `shadcn` CLI. Available components are installed in `src/components/ui/`.
To add new components: `npx shadcn add <component-name>`

## Performance Optimization

### Network-Aware Loading

The app implements network-aware performance optimizations:

- **Network Detection Hook** (`src/hooks/useNetwork.ts`): Detects connection type (slow-2g, 2g, 3g, 4g) and data saver mode
- **LazyImage Component** (`src/components/LazyImage.tsx`): Progressive loading with quality adjustment based on network speed
- **QueryProvider** (`src/components/providers/QueryProvider.tsx`): React Query with retry logic, exponential backoff, and cache optimizations for weak networks

### React Optimization Patterns

- Use `Suspense` with skeleton fallbacks for async components (HomePage, DiscoverPage, ProfilePage, etc.)
- Use `dynamic = 'force-dynamic'` for layouts that require fresh data on each request
- Image loading: First 6 images use `loading="eager"`, others use `loading="lazy"`

### Image Optimization

- Supports AVIF and WebP formats
- Multiple device sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
- Network-aware quality: 50% (slow-2g/2g), 75% (3g), 85% (4g+)
- Progressive loading with blur placeholder