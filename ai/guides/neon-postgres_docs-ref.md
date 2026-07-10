An AI agent integrating with Neon Postgres should treat this brief as its “source of truth” for serverless connections and branching behavior.

## Overview

Neon provides a serverless Postgres driver for JS/TS (`@neondatabase/serverless`) that speaks HTTP or WebSockets instead of raw TCP, and a branching model that lets you clone databases instantly for dev, test, CI, and recovery workflows. The agent must pick the correct connection mode (HTTP vs WebSockets), use the driver’s APIs safely, and manage branches within Neon’s history window and expiration rules. [neon](https://neon.com/branching/advanced-branching-workflows)

## Environment and Installation

- The Neon serverless driver is GA (v1.0.0+) and requires Node.js 19 or higher when used in Node runtimes. [neon](https://neon.com/branching/advanced-branching-workflows)
- Install via `npm install @neondatabase/serverless` or from the JavaScript Registry (`jsr.io/@neon/serverless`); TypeScript types are bundled, so no extra `@types` package is needed. [neon](https://neon.com/branching/advanced-branching-workflows)
- The driver is designed for serverless and edge runtimes (Vercel Edge Functions, Cloudflare Workers, etc.), and works in Node, Deno, and browsers via fetch/WebSockets. [neon](https://neon.com/branching/advanced-branching-workflows)

## Connection String and Basic Setup

- The Neon database connection string is obtained from the **Connect** button in the Project Dashboard and has the form: `postgresql://[user]:[password]@[neon_hostname]/[dbname]`, typically exposed as `DATABASE_URL`. [neon](https://neon.com/branching/advanced-branching-workflows)
- All examples assume the agent has access to `process.env.DATABASE_URL` (or equivalent environment variable) to configure the driver. [neon](https://neon.com/branching/advanced-branching-workflows)

## HTTP Mode (`neon()`)

Use HTTP when the agent is performing single “one-shot” queries or non-interactive batched transactions.

- Create a query function with `const sql = neon(DATABASE_URL);` and use it **as a template tag**, not a regular function, for automatic parameterization and SQL injection protection. [neon](https://neon.com/branching/advanced-branching-workflows)
- Safe usage examples:
  - Parameterized template:  
    `const result = await sql\`SELECT \* FROM table WHERE id = ${id}\`;`
  - Manual parameterization:  
    `const result = await sql.query('SELECT * FROM table WHERE id = $1', [id]);`
  - Trusted identifiers:  
    `sql\`SELECT \* FROM ${sql.unsafe(tableName)} WHERE id = ${id}\`;`or by building a trusted`table`fragment with`sql\`table1\``. [neon](https://neon.com/branching/advanced-branching-workflows)

- Template fragments (like `whereClause = sql\`WHERE name = ${name}\``) can be composed; the driver will number parameters correctly at query time. [neon](https://neon.com/branching/advanced-branching-workflows)
- HTTP queries have a **64 MB max request and response size**; the agent must avoid returning or sending larger payloads in one call. [neon](https://neon.com/branching/advanced-branching-workflows)

### HTTP Configuration Options

The agent can configure result shape and fetch behavior:

- `arrayMode`: when `true`, rows are returned as `[[...]]` arrays instead of objects; can be set on `neon(DATABASE_URL, { arrayMode: true })` or per-call via `sql.query(..., { arrayMode: true })`. [neon](https://neon.com/branching/advanced-branching-workflows)
- `fullResults`: when `true`, the query returns `node-postgres`-style metadata (fields, rowCount, command) alongside `rows`. [neon](https://neon.com/branching/advanced-branching-workflows)
- `fetchOptions`: merged into the underlying `fetch` call, useful for setting priority or timeouts (e.g., using `AbortController` to enforce a 10s timeout). [neon](https://neon.com/branching/advanced-branching-workflows)

## Transactions over HTTP (`transaction()`)

Use `sql.transaction()` for **multiple queries in a single non-interactive transaction**.

- Signature: `transaction(queriesOrFn, options)` where `queriesOrFn` is either:
  - An array of query calls (template queries), or
  - A non-async function that receives a `txn` query function and returns an array of queries. [neon](https://neon.com/branching/advanced-branching-workflows)
- Example array form:

  ````js
  const [posts, tags] = await sql.transaction(
    [
      sql`SELECT * FROM posts ORDER BY posted_at DESC LIMIT ${limit}`,
      sql`SELECT * FROM tags`
    ],
    { isolationLevel: 'RepeatableRead', readOnly: true }
  );
  ``` [neon](https://neon.com/branching/advanced-branching-workflows)

  ````

- Transaction options include both query-shape options (`arrayMode`, `fullResults`, `fetchOptions`) and transaction-specific options:
  - `isolationLevel`: one of `ReadUncommitted`, `ReadCommitted`, `RepeatableRead`, `Serializable`. [neon](https://neon.com/branching/advanced-branching-workflows)
  - `readOnly`: boolean, `true` to enforce `READ ONLY` transactions. [neon](https://neon.com/branching/advanced-branching-workflows)
  - `deferrable`: boolean, effective only when `readOnly` is `true` and `isolationLevel` is `Serializable`, to use `DEFERRABLE` transactions. [neon](https://neon.com/branching/advanced-branching-workflows)
- **Per-query options inside the transaction array are not supported**; all options must be passed as the second argument to `transaction()`. Attempting `sql('...', [], { arrayMode: true })` within the array is invalid. [neon](https://neon.com/branching/advanced-branching-workflows)

### Transactions and JWT Self-Verification (RLS)

When securing SQL with Row-Level Security and self-verified JWTs:

- The agent should:
  - Verify JWT using application logic.
  - Serialize claims (e.g., `JSON.stringify(payload)`).
  - Call `sql.transaction()` with a first query `SELECT set_config('request.jwt.claims', ${claims}, true)` and subsequent queries that rely on RLS policies. [neon](https://neon.com/branching/advanced-branching-workflows)
- **Critical constraint**: the connection role in `DATABASE_URL` must **not** have `BYPASSRLS`; do **not** use `neondb_owner` for JWT-based RLS or RLS will be bypassed. [neon](https://neon.com/branching/advanced-branching-workflows)

## WebSockets Mode (`Pool` / `Client`)

Use WebSockets when the agent needs sessions, interactive transactions, or drop-in compatibility with `node-postgres`.

- Replace `pg` with `@neondatabase/serverless` and create a `Pool`:

  ````js
  import { Pool } from '@neondatabase/serverless';
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
  await pool.end();
  ``` [neon](https://neon.com/branching/advanced-branching-workflows)

  ````

- This mode is recommended when:
  - Migrating existing `node-postgres`-based code;
  - Using ORMs/adapters that expect a `node-postgres`-compatible driver (e.g., Prisma via `PrismaNeon`, Drizzle `neon-serverless`). [neon](https://neon.com/branching/advanced-branching-workflows)

### WebSocket Constructor and Serverless Lifetime Rules

- In Node.js and other environments without native WebSocket support, the agent must set `neonConfig.webSocketConstructor = ws` (from the `ws` package) before using `Pool` or `Client`. [neon](https://neon.com/branching/advanced-branching-workflows)
- In serverless runtimes (e.g., Vercel Edge, Cloudflare Workers), WebSocket connections **cannot outlive a single request**:
  - `Pool`/`Client` must be created, used, and closed **within a single request handler**.
  - Do **not** create pools outside handlers or reuse them across requests.
  - Always call `pool.end()` (or equivalent) to avoid exhausting connections. [neon](https://neon.com/branching/advanced-branching-workflows)

## Local Development with Neon Serverless Driver

For local development, Postgres doesn’t natively speak HTTP/WebSockets, so the agent must route through a Neon proxy:

- Run a local Neon proxy (e.g., via the community Docker Compose setup) that connects to a local Postgres instance; the driver then connects to the proxy over HTTP/WebSockets. [neon](https://neon.com/branching/advanced-branching-workflows)
- This setup allows the same serverless driver code to work both locally and in Neon’s cloud environments. [neon](https://neon.com/branching/advanced-branching-workflows)

## Handling Transient Connection Drops

Neon may occasionally experience short-lived connection drops during maintenance or network events:

- The agent should wrap query calls (especially over HTTP) in retry logic with backoff, e.g., using `async-retry` with 5 retries, exponential factor, and randomized delays. [neon](https://neon.com/branching/advanced-branching-workflows)
- Treat transient errors as retriable, not fatal, unless the retries are exhausted or the error indicates a permanent failure (e.g., auth misconfiguration). [neon](https://neon.com/branching/advanced-branching-workflows)

## Branching Concepts

Neon branches let the agent clone databases like Git branches for code:

- A branch is a copy-on-write clone of data created from either the current state or a past point, with writes saved as deltas. [neon](https://neon.com/branching/branching-workflows-for-development)
- Branch creation does **not** increase load on or affect performance of the parent branch; parent and child can share data but diverge from the moment of branch creation. [neon](https://neon.com/branching/branching-workflows-for-development)
- Each project has a root branch named `main`; the first branch is derived from `main`, and later branches can be derived from `main` or other branches. [neon](https://neon.com/branching/branching-workflows-for-development)

### Sensitive Data and Neon Auth Branching

- For sensitive data, Neon supports **schema-only branches**, allowing the agent to branch structure without copying actual data. [neon](https://neon.com/branching/branching-workflows-for-development)
- When using Neon Auth, users, sessions, and auth configuration in the `neon_auth` schema **branch alongside data**, so each branch gets isolated authentication state, useful for preview/test environments. [neon](https://neon.com/branching/branching-workflows-for-development)

## Branching Workflows for Dev, Test, CI, and AI Agents

The agent can create and manage branches via Console, CLI, API, GitHub Actions, or Vercel integration:

- **Development**:
  - Create a dev branch from production so developers (or agent-driven migrations) can freely modify it without impacting prod.
  - Branches inherit all parent data at creation, eliminating manual “hydration” steps. [neon](https://neon.com/branching/branching-workflows-for-development)

- **Testing**:
  - Create branches to test schema changes or potentially destructive queries safely.
  - Tests can run in parallel on different branches, each with its own compute. [neon](https://neon.com/branching/branching-workflows-for-development)

- **Temporary environments / CI/CD**:
  - Use branch expiration (TTL) to auto-delete branches after a set time; ideal for CI environments, feature branches, automated testing, and AI-driven ephemeral workflows. [neon](https://neon.com/branching/branching-workflows-for-development)

- **Integrations**:
  - Neon API and CLI provide instant branch creation/deletion.
  - GitHub Actions can automate branches per PR.
  - Neon-managed Vercel integration can create one branch per preview deployment. [neon](https://neon.com/branching/branching-workflows-for-development)

## Recovery, Instant Restore, and History Window

The agent must respect Neon’s history window when using restore and time-travel features:

- **Instant restore** lets the agent roll a branch back to any point within the configured history window or create a restore branch at a past state for analysis or recovery. [neon](https://neon.com/branching/branching-workflows-for-development)
- The **history window** defines how long change history is retained for features like Instant restore, Time Travel, and branching-from-the-past:
  - Default: 6 hours on Free plan, 1 day on paid plans. [neon](https://neon.com/branching/branching-workflows-for-development)
  - Configurable up to 7 days on Launch and 30 days on Scale, at the cost of increased storage for history. [neon](https://neon.com/branching/branching-workflows-for-development)

- Data recovery workflows the agent may trigger:
  - **Instant restore**: roll an existing branch back to an earlier point. [neon](https://neon.com/branching/branching-workflows-for-development)
  - **Reset from parent**: reset a child branch to match its parent’s current state. [neon](https://neon.com/branching/branching-workflows-for-development)
  - **Time Travel queries**: run SQL against the database’s past state for analysis or debugging. [neon](https://neon.com/branching/branching-workflows-for-development)

---

This brief should give any AI agent enough structured knowledge to choose the correct Neon connection mode, use the serverless driver safely, manage transactions and RLS, and create/manage branches and recovery workflows without running into common configuration or lifecycle errors. [neon](https://neon.com/branching/branching-workflows-for-development)
