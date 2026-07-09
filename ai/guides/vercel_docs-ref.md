For Vercel + React Router v7, the key is configuring the `@vercel/react-router` preset correctly so Vercel understands your app’s routing and can generate proper functions, and then using Vercel’s environment variable model correctly for secrets like `RESEND_API_KEY` and `DATABASE_URL`. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)

## React Router v7 on Vercel

React Router v7, when used “as a framework”, gives you fullstack, server-rendered React apps (SSR) or SPA mode, and Vercel’s integration is built specifically for that framework mode. Vercel can deploy React Router apps with SSR or static site generation with zero config, but they **strongly recommend** using the Vercel preset to unlock full functionality and avoid subtle deployment issues. [vercel](https://vercel.com/changelog/support-for-react-router-v7)

React Router routes deployed on Vercel are server-rendered by default via Vercel Functions, with support for features like nested routes, loaders/actions, and streaming. You can still opt into SPA mode by turning SSR off in the config, but the default is SSR. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)

## `@vercel/react-router` preset config (react-router.config.ts)

The core “gotcha” is wiring up the Vercel preset in `react-router.config.ts`. The docs show the canonical configuration: [vercel](https://vercel.com/changelog/support-for-react-router-v7)

```ts
// react-router.config.ts
import { vercelPreset } from "@vercel/react-router/vite";
import type { Config } from "@react-router/dev/config";

export default {
  // Enable SSR by default (set to false for SPA mode)
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;
```

Key points:

- You must install `@vercel/react-router` and import `vercelPreset` from `@vercel/react-router/vite`. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)
- Set `ssr: true` for server-side rendering; you can set `ssr: false` to use SPA mode if desired. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)
- The `presets: [vercelPreset()]` line is what tells Vercel how to interpret your React Router build output and routing structure. [vercel](https://vercel.com/changelog/support-for-react-router-v7)

With this preset configured, Vercel gains:

- Function-level configuration per route (e.g. `memory`, `maxDuration` on specific functions). [vercel](https://vercel.com/docs/frameworks/frontend/react-router)
- Knowledge of your routing structure for bundle splitting and accurate deployment summaries. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)
- Proper mapping from React Router build artifacts to Vercel’s Build Output API, avoiding “blank page” or mis-detected framework issues seen before official support. [github](https://github.com/vercel/vercel/issues/13128)

Without the preset (or with misconfigured build scripts), common symptoms include the app being treated as a generic Vite project, blank pages after deployment, or server entrypoints not matching Vercel’s expectations. [stackoverflow](https://stackoverflow.com/questions/79385137/deploy-react-router-v7-to-vercel)

## SSR, streaming, caching with React Router on Vercel

Once the preset is in place, Vercel’s SSR and streaming behavior is framework-aware:

- **SSR**: Each route becomes a server function that can run loaders, check auth, or use request location, and Vercel scales these functions up and down automatically. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)
- **Streaming**: React Router’s Suspense/`<Await>` streaming works via Vercel Functions, allowing faster time-to-first-byte and large payloads without hitting function size limits. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)
- **Cache-Control**: You can export a `headers` function on a route that returns a `Cache-Control` header like `s-maxage=1, stale-while-revalidate=59` to use Vercel’s edge caching with stale-while-revalidate semantics. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)

Example `headers` export:

```tsx
// app/routes/example.tsx
import type { Route } from "./+types/some-route";

export function headers(_: Route.HeadersArgs) {
  return {
    "Cache-Control": "s-maxage=1, stale-while-revalidate=59",
  };
}
```

This lets Vercel serve cached content for a short period and refresh in the background while respecting React Router’s loader. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)

## Custom server entrypoint (Hono example) and `entry.server`

Vercel also supports custom server entrypoints if you need a “load context” for loaders/actions or want to integrate a framework like Hono. The server entrypoint must export a Web API-compatible function `export default async function (reqrequest: Request) => Response | Promise<Response>`. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)

With Vite, you configure SSR input in `vite.config.ts`:

```ts
// vite.config.ts
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: isSsrBuild ? { input: "./server/app.ts" } : undefined,
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
}));
```

Then you implement `server/app.ts` with Hono and `createRequestHandler` from React Router:

```ts
// server/app.ts
import { Hono } from "hono";
import { createRequestHandler } from "react-router";
// virtual module provided by React Router
import * as build from "virtual:react-router/server-build";

declare module "react-router" {
  interface AppLoadContext {
    VALUE_FROM_HONO: string;
  }
}

const app = new Hono();
// add any middleware here

const handler = createRequestHandler(build);
app.mount("/", (req) =>
  handler(req, {
    VALUE_FROM_HONO: "Hello from Hono",
  }),
);

export default app.fetch;
```

This lets you pass a typed `AppLoadContext` into loaders/actions via Hono while still having Vercel handle deployment. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)

For `app/entry.server.tsx` or `.jsx`, if you override the default, you must use `handleRequest` from `@vercel/react-router/entry.server` so streaming and Vercel’s integration still work:

```tsx
// app/entry.server.tsx
import { handleRequest } from "@vercel/react-router/entry.server";
import type { AppLoadContext, EntryContext } from "react-router";

export default async function (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext?: AppLoadContext,
): Promise<Response> {
  const nonce = crypto.randomUUID();
  const response = await handleRequest(
    request,
    responseStatusCode,
    responseHeaders,
    routerContext,
    loadContext,
    { nonce },
  );
  response.headers.set(
    "Content-Security-Policy",
    `script-src 'nonce-${nonce}'`,
  );
  return response;
}
```

This example shows how to wire CSP with a nonce while keeping Vercel’s streaming-friendly entrypoint in place. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)

## Vercel environment variables basics

Environment variables on Vercel are encrypted, environment-scoped key–value pairs that your code can read at build time and during function execution. They are configured at either the **team** level (shared across projects) or **project** level (specific to one project). [vercel](https://vercel.com/docs/environment-variables)

Important behavioral characteristics:

- They are **encrypted at rest** and visible only to users who have access to the project or team. [vercel](https://vercel.com/docs/environment-variables)
- Changes apply **only to new deployments**; existing deployments keep the old values. [vercel](https://vercel.com/docs/environment-variables)
- There is a total size limit of **64 KB per deployment** for environment variables combined on Node.js, Python, Ruby, Go, and some custom runtimes; the 64 KB limit also acts as a per-variable upper bound. [vercel](https://vercel.com/docs/environment-variables)
- Edge Functions / middleware using the `edge` runtime are limited to **5 KB per environment variable**. [vercel](https://vercel.com/docs/environment-variables)

## Environments (Production, Preview, Development, Custom)

Each variable is scoped to one or more environments: [vercel](https://vercel.com/docs/environment-variables)

- **Production**: used for production deployments (commits to the production branch, usually `main`, or `vercel --prod`). [vercel](https://vercel.com/docs/environment-variables)
- **Preview**: used for preview deployments (non-production branches or `vercel` without `--prod`). Supports **branch-specific preview variables** that override general preview variables for a given branch. [vercel](https://vercel.com/docs/environment-variables)
- **Development**: used when running locally via `vercel dev` or your dev command; can be synced into local `.env` via `vercel env pull`. [vercel](https://vercel.com/docs/environment-variables)
- **Custom environments**: extra environments like `staging` that can import and detach variables from other environments as needed. [docs.vercel](https://docs.vercel.com/docs/rest-api/reference/examples/environment-variables)

For local development:

- Create `.env.local` (or `.env`) in the project root with `KEY=value` pairs, or run `vercel env pull` to generate an `.env` file containing Development environment variables from the Vercel project. [vercel](https://vercel.com/docs/environment-variables)
- When using `vercel dev`, the CLI automatically pulls Development variables into memory, so you don’t need a local file unless you prefer one. [vercel](https://vercel.com/docs/environment-variables)

## Types of environment variables and secret handling

Vercel supports different variable “types”:

- **plain**: unencrypted, non-sensitive values like flags or app names. [docs.vercel](https://docs.vercel.com/docs/rest-api/reference/examples/environment-variables)
- **encrypted / sensitive**: secrets such as `RESEND_API_KEY`, `DATABASE_URL`, JWT secrets, and certificates, encrypted at rest but available in runtime. [docs.vercel](https://docs.vercel.com/docs/rest-api/reference/examples/environment-variables)

These types are set when creating variables via dashboard, CLI, or the Vercel SDK (REST API), where you pass `type: 'plain' | 'encrypted' | 'sensitive'`. [docs.vercel](https://docs.vercel.com/docs/rest-api/reference/examples/environment-variables) For secrets like `RESEND_API_KEY`, you should use the encrypted/sensitive type and avoid exposing them client-side; Vercel variables are available server-side and during builds, but client-side exposure must be explicit (e.g., `NEXT_PUBLIC_` variables in Next projects). [vercel](https://vercel.com/docs/environment-variables)

The environment-variable size limit (64 KB total, 5 KB per var for edge) means very large secrets (e.g., huge certs) must be carefully considered, though typical API keys and connection strings are well within the limit. [vercel](https://vercel.com/docs/environment-variables)

## Shared environment variables (team-level)

For cross-project secrets like `RESEND_API_KEY` or shared `DATABASE_URL`, Vercel offers **Shared Environment Variables** defined at the team level and linked to projects: [vercel](https://vercel.com/docs/environment-variables/shared-environment-variables)

- Created in **Team Settings → Environment Variables**, where you specify key, value, environment(s) (Production, Preview, Development, custom), and linked projects. [vercel](https://vercel.com/docs/environment-variables/shared-environment-variables)
- When a Shared variable is updated, all linked projects see the new value in subsequent deployments. [vercel](https://vercel.com/docs/environment-variables/shared-environment-variables)
- If a project-level variable has the same key and environment as a Shared variable, the **project-level value overrides** the Shared one. [vercel](https://vercel.com/docs/environment-variables/shared-environment-variables)

You can link/unlink Shared variables at either the project or team level via the dashboard UI, and delete them to remove them entirely from the team and all projects. [vercel](https://vercel.com/docs/environment-variables/shared-environment-variables)

## Managing env vars via CLI and SDK

For automation and IaC-like workflows:

- The `vercel env` CLI command lets you create, list, and pull environment variables across Development, Preview, and Production. [vercel](https://vercel.com/docs/cli/env)
- The Vercel SDK (`@vercel/sdk`) supports creating/upserting project env vars via `projects.createProjectEnv`, specifying `key`, `value`, `target` (e.g., `['production', 'preview']`), and `type`. [docs.vercel](https://docs.vercel.com/docs/rest-api/reference/examples/environment-variables)
- You can also manage env vars across multiple projects, or add them to custom environments by first retrieving environment IDs and then calling `createProjectEnv` with `customEnvironmentIds`. [docs.vercel](https://docs.vercel.com/docs/rest-api/reference/examples/environment-variables)

This is useful for programmatically provisioning secrets like `RESEND_API_KEY` and `DATABASE_URL` for many projects or environments at once. [docs.vercel](https://docs.vercel.com/docs/rest-api/reference/examples/environment-variables)

## Practical guidelines for an AI agent

To “just work” with Vercel in an agent context:

- **React Router v7**:
  - Always ensure `react-router.config.ts` includes `ssr: true` (or explicit setting) and `presets: [vercelPreset()]` from `@vercel/react-router/vite`. [vercel](https://vercel.com/changelog/support-for-react-router-v7)
  - Keep build config aligned with React Router’s framework mode and Vercel’s adapter; if you introduce a custom server entrypoint, make sure `vite.config` points SSR input to `server/app.(ts|js)` and that you export a Web API-compatible handler using `createRequestHandler`. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)
  - If overriding `app/entry.server`, wrap with `handleRequest` from `@vercel/react-router/entry.server` to preserve Vercel streaming and function integration. [vercel](https://vercel.com/docs/frameworks/frontend/react-router)

- **Environment variables**:
  - Create secrets like `RESEND_API_KEY` and `DATABASE_URL` as encrypted/sensitive environment variables, either at the project level or as Shared variables at the team level. [vercel](https://vercel.com/docs/environment-variables/shared-environment-variables)
  - Scope them correctly to Production/Preview/Development/custom environments, and remember that changes only apply to new deployments. [vercel](https://vercel.com/docs/environment-variables)
  - For local dev, use `.env` / `.env.local` and `vercel env pull` to sync Development variables, and respect the 64 KB total limit (and 5 KB per var for edge runtime). [vercel](https://vercel.com/docs/environment-variables)
  - Avoid exposing secrets to the browser; only expose public values via frontend-safe env vars (`NEXT_PUBLIC_*` in Next or equivalent patterns), keeping `RESEND_API_KEY` and `DATABASE_URL` server-only. [gist.github](https://gist.github.com/Stanzilla/dde8331cafc877c5f3a3d770964e66c2)

Following these patterns, an AI agent can scaffold and deploy React Router v7 apps on Vercel and configure environment variables for common integrations like Resend and databases without running into the typical adapter or env gotchas. [vercel](https://vercel.com/changelog/support-for-react-router-v7)
