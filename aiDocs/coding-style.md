# Coding Style

## Language & Tooling

- TypeScript throughout — no `any`, prefer explicit types on function signatures
- React Router v7 (file-based routing), Drizzle ORM, Neon Postgres, Resend, Tailwind CSS
- Prettier defaults; single quotes in TS/TSX, double quotes in JSX attributes

## File & Folder Conventions

- Route files in `app/routes/` following React Router v7 conventions
- Shared components in `app/components/`
- DB schema and queries in `app/db/`
- Seed data in `app/db/seed.ts`
- Email templates (preview routes) in `app/routes/preview/`
- kebab-case for file names: `checkin-confirmation.tsx`, `manager-email.tsx`
- PascalCase for component names; camelCase for everything else

## Components

- Prefer small, focused components; co-locate markup and styles unless reused
- Export named components (not default) except for route modules (route files use default export per RR7)
- Props types declared inline above the component, not in a separate types file unless shared

## Styling (Tailwind)

Visual language mirrors leaderfactor.com:

- **Background:** warm off-white (`bg-[#F5F2EC]` or `bg-stone-50`)
- **Text:** near-black navy (`text-[#1A1F2E]`)
- **Primary accent:** medium blue (`bg-[#4A6CF7]` or `bg-blue-600`) for interactive elements
- **Cards:** white with subtle border and rounded-lg (`bg-white border border-stone-200 rounded-lg`)
- **Dark cards:** deep navy (`bg-[#1A2744]`) for featured/hero cards
- **Section labels:** small uppercase tracking-widest with a `■` prefix (e.g., `■ RESOURCES`)
- **Headings:** serif font for display text; mix roman + italic for key word emphasis (e.g., "Where learning becomes *behavior.*")
- **Buttons:** pill shape, primary = dark fill + arrow `→`, secondary = outlined pill
- **Spacing:** generous padding; let content breathe — prefer `p-8`/`p-12` over tight layouts
- **Typography scale:** use Tailwind defaults; `text-4xl`+ for hero headings, `text-sm` for labels/meta

Font stack: system serif for display (`font-serif`), system sans for body/UI (`font-sans`).

## Comments

- Only comment non-obvious intent or constraints — never narrate what the code does
- Use `// TODO:` for known gaps; no `// FIXME` clutter in commits
- No JSDoc unless a function is genuinely complex and shared

## Database (Drizzle)

- Schema defined in `app/db/schema.ts`; one file, keep it flat
- Queries co-located with their route/loader — no global "service" layer for an MVP
- Seed file should produce coherent demo data: 3 learners, 2 managers, 1 admin, all in the same org

## Routing & Data Loading

- Use RR7 loaders/actions for all data fetching — no client-side `useEffect` fetches
- Token-in-URL for check-in links: `/checkin?token=abc` — validate token in loader, 404 on miss
- Role switcher via query param: `?role=learner|manager|admin`

## Emails (Resend / Preview Routes)

- Email templates are plain HTML/JSX — no email framework (MJML etc.) needed at MVP scale
- Preview routes live at `/preview/weekly-email`, `/preview/manager-email`
- QuickChart URLs built server-side; embed as `<img>` with plain-text fallback above the image
