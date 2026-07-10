React Router v7 formalizes a framework-style, data-driven routing model with file-based routes, declarative loaders/actions, and a central `react-router.config.ts` that controls server rendering and build/runtime behavior. For an AI agent, the key is to treat routes as filesystem-backed modules with explicit data/mutation hooks and to keep server/client concerns aligned with the configuration defaults. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)

---

## v7 mental model and modes

React Router v7 is a “multi‑strategy router” that can be used minimally (declarative routing) or maximally as a full React framework. The docs describe three modes—Declarative, Data, and Framework—and most of the file‑based routing and `react-router.config.ts` features live in **Framework** mode. [reactrouter](https://reactrouter.com/start/framework/routing)

In Framework/Data mode, routes are not just components; each route module can define data loaders, mutation actions, and error boundaries, and the router coordinates them for both server and client. An AI agent should assume that “routes are modules with behavior,” not just JSX components. [reactrouter](https://reactrouter.com/start/framework/actions)

---

## File-based routing basics

File-based routing in v7 ties URL segments directly to files in a routes directory via conventions, with React Router generating the route config from the filesystem. Instead of manually declaring routes with `createBrowserRouter`/`createRoutesFromElements`, a file-system routing helper (e.g. `flatRoutes` from the fs-routes package) can auto-discover routes based on the directory structure. [reactrouter](https://reactrouter.com/how-to/file-route-conventions)

Core conventions include:

- **Index routes**: Files representing index routes are prefixed with an underscore (e.g. `_index.tsx`). [youtube](https://www.youtube.com/watch?v=Nigg6w8pRow)
- **Dynamic segments**: Dynamic URL segments use a leading `$` (e.g. `$id.tsx` for `/products/:id`) instead of bracket notation. [reactrouter](https://reactrouter.com/how-to/file-route-conventions)
- **Catch-all / splat**: Catch-all routes are treated as dynamic segments and also use `$` naming (e.g. `$.tsx` for a splat). [youtube](https://www.youtube.com/watch?v=Nigg6w8pRow)

The file-route conventions docs emphasize nested routing—URL hierarchy coupled to component hierarchy and data—which the file layout mirrors (nested directories for nested segments). For an agent, this means you must respect naming and directory conventions when creating or refactoring route files; misnaming (`index.tsx` instead of `_index.tsx`, `[id].tsx` instead of `$id.tsx`) will break route discovery. [reactrouter](https://reactrouter.com/how-to/file-route-conventions)

---

## Route modules, loaders, and data

Each route module can export a `loader` function that fetches data **before** the route’s component renders. Loaders run as part of navigation: the router calls the loader, waits for it to resolve, and then renders the route element with data available via `useLoaderData`. [dev](https://dev.to/edriso/react-router-loaders-actions-form-2bbe)

From the data-mode tutorials and docs:

- `loader` is registered on the route definition (or inferred from the file-based route) alongside `element`. [reactrouter](https://reactrouter.com/start/framework/routing)
- Inside a component, you call `useLoaderData()` to access the loader’s return value (often an object). [dev](https://dev.to/edriso/react-router-loaders-actions-form-2bbe)
- Because the loader runs before render, you don’t need `useEffect` + `useState` for initial data fetching, and you avoid an extra “loading” render pass. [dev](https://dev.to/edriso/react-router-loaders-actions-form-2bbe)

For an AI agent, the invariants are:

- Loaders must be **pure-ish async functions**—no direct React hooks, and they should return serializable data. [dev](https://dev.to/edriso/react-router-loaders-actions-form-2bbe)
- They are tied to routes by path; if you move or rename a file, you must keep loader usage (`useLoaderData`) consistent with the route that owns it. [reactrouter](https://reactrouter.com/start/framework/routing)

---

## Actions: mutations, forms, and fetchers

Mutations are handled via **route actions**, defined as `action` (server) or `clientAction` (client) exports on route modules. Route actions run when forms or submissions target a route with a “post” method, and React Router automatically revalidates loader data after the action completes to keep the UI in sync. [reactrouter](https://reactrouter.com/start/framework/actions)

Key behavior from the docs:

- `action` exports define **server actions**—they run only on the server and are removed from client bundles. [reactrouter](https://reactrouter.com/start/framework/actions)
- `clientAction` exports define **client actions**—they run in the browser and take priority when both are defined. [reactrouter](https://reactrouter.com/start/framework/actions)
- Actions are invoked declaratively via `<Form method="post">` and imperatively via `useSubmit` or `fetcher.submit`, referencing the route’s path. [dev](https://dev.to/edriso/react-router-loaders-actions-form-2bbe)
- `useFetcher`/`<fetcher.Form>` lets you submit to loaders/actions **without navigation**, avoiding new history entries but still triggering data updates. [reactrouter](https://reactrouter.com/start/framework/actions)

A typical action pattern (from tutorials): defining `export const action = async ({ request }) => { ... }`, reading `request.formData()`, performing a mutation (e.g. HTTP POST), and returning a redirect or data; on the UI side, use React Router’s `<Form>` instead of a raw `<form>` with `onSubmit`. [dev](https://dev.to/edriso/react-router-loaders-actions-form-2bbe)

For an AI agent:

- Never mix traditional `onSubmit` + `e.preventDefault()` with React Router actions on the same route; prefer `<Form>` plus `action`. [dev](https://dev.to/edriso/react-router-loaders-actions-form-2bbe)
- Ensure that any route path used in `useSubmit`/`fetcher.submit` corresponds to an actual route with an `action`/`clientAction`; mismatches will cause runtime errors or 404-like behavior. [reactrouter](https://reactrouter.com/start/framework/actions)

---

## Server rendering vs SPA mode

Server rendering is controlled centrally via the `ssr` flag in `react-router.config.ts`. [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)

From the config docs:

- `ssr: true` means React Router will **server render** your application; the server build is used to render requests. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)
- `ssr: false` switches to **SPA mode**: React Router pre-renders the app and saves it as an `index.html` with assets, making it deployable without server-side rendering. [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)

The server build itself is configured via:

- `serverBuildFile`: filename of the server build output (default `"index.js"`), which must be deployed to the server. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)
- `serverModuleFormat`: module format for the server build (default `"esm"`, can be `"cjs"`). [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)
- `serverBundles`: optional function that assigns routes to different server bundles (directories under the server build), used to split the server build for large apps. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)

For an AI agent, the key is to:

- Keep server-side code (loaders, server actions, custom server handlers) compatible with the configured module format (`esm` vs `cjs`). [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)
- Ensure deployment scripts actually upload the `serverBuildFile` produced by the build, and that `ssr` matches the intended hosting model (server vs static SPA). [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)

---

## Pre-rendering and route discovery

React Router v7 introduces a `prerender` option in `react-router.config.ts` to generate static HTML for specific URLs at build time. [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)

Config behaviors:

- `prerender` can be a static array of paths (e.g. `["/", "/about", "/contact"]`) or an async function that returns paths, or an object with `paths` and `concurrency`. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)
- The build system uses `prerender` to render those routes to HTML files, useful for landing pages or SEO-critical routes. [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)

Route discovery on the client is configured via `routeDiscovery`:

- Default is `mode: "lazy"` with `manifestPath: "/__manifest"`, meaning routes are discovered as the user navigates and a manifest is loaded lazily. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)
- `mode: "initial"` includes all routes in the initial manifest, so the client knows about all routes up front. [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)
- `manifestPath` can be customized when using `lazy` mode to change the manifest request path. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)

An AI agent should be aware that adding new file-based routes may affect the manifest and prerender output; code that assumes all routes are known “up front” must align with `routeDiscovery.mode`. [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)

---

## `react-router.config.ts` essentials

`react-router.config.ts` is an optional framework configuration file that customizes server rendering, directory locations, and build settings. It typically exports a default object that “satisfies” the `Config` type from `@react-router/dev/config`. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)

Important fields and defaults from the docs:

| Field                  | Purpose                                          | Default / Behavior                                                                                                                                                                                  |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `appDirectory`         | Path to the app (routes, etc.) relative to root. | Defaults to `"app"`; can be set to `"src"` or other. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)                                                        |
| `basename`             | URL base for the React Router app.               | Defaults to `"/"`; e.g. `"/my-app"` for subpath deployment. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)                                                 |
| `buildDirectory`       | Output directory for client/build assets.        | Defaults to `"build"`. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)                                                                                      |
| `ssr`                  | Enable/disable server-side rendering.            | Defaults to `true`; `false` switches to SPA/pre-render mode. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)                                                |
| `prerender`            | URLs to pre-render at build time.                | Array, async function, or object with concurrency. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)                                                          |
| `routeDiscovery`       | How client discovers routes.                     | Default `mode: "lazy"` and `manifestPath: "/__manifest"`; `"initial"` loads all routes in initial manifest. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts) |
| `serverBuildFile`      | Filename of server build JS.                     | Defaults to `"index.js"`. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)                                                                                   |
| `serverModuleFormat`   | Server build module format.                      | Defaults to `"esm"`; can be `"cjs"`. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)                                                                        |
| `serverBundles`        | Function assigning routes to server bundles.     | Optional; used to split server build into multiple bundles. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)                                                 |
| `allowedActionOrigins` | Allowed origin hosts for action submissions.     | Array of hosts, supports micromatch patterns like `"*.example.com"` and `"**.example.com"`. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)                 |

Other fields like `future`, `buildEnd`, and `presets` enable future flags, hook into build completion, and integrate external platforms/tools. [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)

For an AI agent generating or editing this file:

- Always import `Config` from `@react-router/dev/config` and ensure the default export `satisfies Config` to keep type safety. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)
- Respect defaults when omitting fields; e.g. missing `appDirectory` implies `"app"`, missing `ssr` implies server rendering is enabled. [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)
- When configuring `allowedActionOrigins`, remember it applies to **UI routes’ actions**, not resource routes, and uses glob semantics—incorrect patterns can block legitimate submissions. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)

---

## Differences from v6 that affect agents

While the docs note that upgrading with “future flags” in place is generally non-breaking, v7’s framework/file-based model is a large conceptual departure from v6’s primarily declarative, client-only router usage. The merge with Remix-like data APIs means loaders/actions are now first-class and deeply integrated into routing and server rendering. [blog.logrocket](https://blog.logrocket.com/file-based-routing-react-router-v7/)

For an AI agent previously generating v6-style code:

- Do not rely solely on `useEffect` for data fetching; use route loaders and `useLoaderData`. [reactrouter](https://reactrouter.com/start/framework/actions)
- Avoid ad-hoc `fetch` in components for mutations; centralize mutations in `action`/`clientAction` and route-targeted forms/fetchers. [dev](https://dev.to/edriso/react-router-loaders-actions-form-2bbe)
- Treat `react-router.config.ts` as the source of truth for directories, SSR, and build behavior; assumptions about `/src` vs `/app`, SSR availability, or module format must be checked against this config. [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)

---

## Operational checklist for an AI agent

When writing or maintaining a React Router v7 app, an agent should systematically verify:

- **Config alignment**: `react-router.config.ts` exists (or defaults apply), `appDirectory`, `buildDirectory`, `basename`, `ssr`, and `serverModuleFormat` match the project layout and deployment environment. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)
- **File-route conventions**: Index and dynamic routes follow `_index` and `$segment` naming, and directory structure matches the intended nested URL hierarchy. [youtube](https://www.youtube.com/watch?v=Nigg6w8pRow)
- **Data hooks**: Every `loader` registered in routes has a corresponding `useLoaderData` consumer (or is intentionally unused), and loaders return serializable data. [reactrouter](https://reactrouter.com/start/framework/routing)
- **Mutation flow**: Route `action`/`clientAction` exports exist for each mutation path, and forms use `<Form>` or fetchers rather than manual submit handling. [reactrouter](https://reactrouter.com/start/framework/actions)
- **Server build & prerender**: `serverBuildFile` is produced and deployed when `ssr` is true, and `prerender` paths match existing routes. [react-router-docs-ja.techtalk](https://react-router-docs-ja.techtalk.jp/api/framework-conventions/react-router.config.ts)
- **Security/origins**: `allowedActionOrigins` covers expected hosts and subdomains without being overly permissive or restrictive. [reactrouter](https://reactrouter.com/api/framework-conventions/react-router.config.ts)

With these invariants encoded, an AI agent can safely refactor routes, add pages, modify data loading/mutations, and adjust server behavior in React Router v7 without introducing subtle routing or data bugs. [reactrouter](https://reactrouter.com/how-to/file-route-conventions)
