For Neon + Vercel, Drizzle ORM is typically paired with Neon’s serverless Postgres using the `neon-http` driver, with schema/migrations managed by Drizzle Kit and `DATABASE_URL` stored in `.env`. If you prefer raw SQL, Postgres.js is a fast, tagged-template client that reads the same `DATABASE_URL` and gives safe, dynamic queries without an ORM layer. [qiita](https://qiita.com/tkinopi/items/8a6b3e331eb2e6771b84)

## Drizzle + Neon overview

Drizzle ORM is a TypeScript-first ORM focused on type safety and serverless compatibility, with native support for Neon via `neon-http` and `neon-websockets` drivers. The Neon quickstart shows how to connect over HTTP/WebSockets using Neon’s serverless driver under the hood, which is ideal for serverless environments like Vercel Functions and Edge runtimes. [youtube](https://www.youtube.com/watch?v=i_mAHOhpBSA)

The `neon-http` driver is optimized for single, non-interactive transactions over HTTP, while `neon-websockets` / `neon-serverless` are recommended when you need interactive sessions or a more `pg`-like behavior. Drizzle’s Neon integration is explicitly designed to run in Node, Bun, and edge environments alongside Neon’s serverless connection modes. [neon](https://neon.com/docs/guides/drizzle)

## Project structure and required packages

The Neon quickstart assumes you’re familiar with `dotenv` for environment variables, `tsx` (or Bun) for running TypeScript, and Neon itself. A typical Drizzle + Neon project uses a structure like: [quickchart](https://quickchart.io/documentation/usage/client-libraries/)

```text
📦 project-root
├ 📂 drizzle          # migration SQL files & snapshots
├ 📂 src
│ ├ 📂 db
│ │ └ 📜 schema.ts    # table definitions
│ └ 📜 index.ts       # connection & queries
├ 📜 .env             # DATABASE_URL etc.
├ 📜 drizzle.config.ts
├ 📜 package.json
└ 📜 tsconfig.json
```

This pattern (drizzle folder for migrations, `src/db/schema.ts` for schema, `.env` with `DATABASE_URL`) comes directly from the Neon + Drizzle quickstart and example setups. [qiita](https://qiita.com/tkinopi/items/8a6b3e331eb2e6771b84)

The quickstart and community examples install at least:

- `drizzle-orm` (ORM core). [quickchart](https://quickchart.io/gallery/)
- `@neondatabase/serverless` (Neon serverless driver used by `neon-http`). [quickchart](https://quickchart.io/documentation/usage/client-libraries/)
- `dotenv` to load `.env` for `process.env.DATABASE_URL`. [qiita](https://qiita.com/tkinopi/items/8a6b3e331eb2e6771b84)
- `drizzle-kit` (CLI for migrations and push). [quickchart](https://quickchart.io/gallery/)

Depending on your runtime, you might also use `tsx` or Bun to run `index.ts` scripts directly. [quickchart](https://quickchart.io/documentation/usage/client-libraries/)

## Database connection with `neon-http`

The core connection for Neon + Drizzle uses the Drizzle Neon adapter:

```ts
import { drizzle } from "drizzle-orm/neon-http";

const db = drizzle(process.env.DATABASE_URL);
```

This example (from the quickstart and Qiita guide) shows that Drizzle expects a Neon connection string from `process.env.DATABASE_URL`, typically stored in `.env`. The `.env` file is set up with: [qiita](https://qiita.com/tkinopi/items/8a6b3e331eb2e6771b84)

```text
DATABASE_URL=postgres://user:password@host:port/dbname
```

and loaded via `dotenv/config` or similar at startup so `process.env.DATABASE_URL` is available to both the Drizzle client and Drizzle Kit. [quickchart](https://quickchart.io/documentation/usage/client-libraries/)

If you need a synchronous or custom connection, Drizzle’s Neon docs mention an additional connection API where you instantiate the driver yourself and pass that to `drizzle()` rather than just the URL, but the standard quickstart uses the URL-based form above. [quickchart](https://quickchart.io/documentation/usage/client-libraries/)

## Schema definition and Drizzle config

Drizzle’s primary schema file lives in `src/db/schema.ts` and uses `pgTable`, column types, and optional relations helpers. A minimal schema definition from the quickstart-style setup looks like: [quickchart](https://quickchart.io/gallery/)

```ts
import { pgTable, text, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});
```

This pattern (table name + column definitions via `pg-core`) is how Drizzle builds type-safe table objects that underpin your queries. Relations (one-to-many, many-to-many) are wired using `relations` helpers in the same file or separate schema files, but the Neon quickstart focuses first on single-table setup. [youtube](https://www.youtube.com/watch?v=xCjA88zNBx8)

The Drizzle config file (`drizzle.config.ts`) drives the CLI for migrations and push:

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

This example shows how `drizzle.config.ts` points Drizzle Kit at your schema file, specifies `dialect: 'postgresql'`, and passes `DATABASE_URL` to generate and apply migrations against Neon. [qiita](https://qiita.com/tkinopi/items/8a6b3e331eb2e6771b84)

## Migrations and `push` vs `generate/migrate`

The Neon quickstart highlights two workflows for applying schema changes: [quickchart](https://quickchart.io/documentation/usage/client-libraries/)

1. **Push-based workflow (fast iteration)**
   - Use `drizzle-kit push` to compute differences between your schema and the database and apply them directly, without explicitly managing migration files. [quickchart](https://quickchart.io/documentation/usage/client-libraries/)
   - This is convenient for rapid local development and small projects, where you want quick feedback and don’t need fine-grained migration scripts. [quickchart](https://quickchart.io/documentation/usage/client-libraries/)

2. **Generate/migrate workflow (explicit migrations)**
   - Run `drizzle-kit generate` to produce SQL migration files in the `drizzle` folder based on your schema changes. [qiita](https://qiita.com/tkinopi/items/8a6b3e331eb2e6771b84)
   - Then run `drizzle-kit migrate` to apply those migrations to Neon. [qiita](https://qiita.com/tkinopi/items/8a6b3e331eb2e6771b84)

Example commands from the Qiita guide:

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

and for push:

```bash
drizzle-kit push
```

The docs recommend `push` for quick experiments and `generate` + `migrate` for more controlled environments or team workflows. [quickchart](https://quickchart.io/gallery/)

## Querying and seeding with Drizzle

After setting up schema and config, the Neon quickstart updates `src/index.ts` with basic CRUD queries (insert/select/update/delete). Queries use Drizzle’s type-safe API built on the schema, so you get compile-time types for columns and query results. [youtube](https://www.youtube.com/watch?v=i_mAHOhpBSA)

Typical operations include:

- `db.insert(users).values({...}).returning()` for inserts. [youtube](https://www.youtube.com/watch?v=i_mAHOhpBSA)
- `db.select().from(users).where(...)` for reads. [youtube](https://www.youtube.com/watch?v=i_mAHOhpBSA)
- `db.update(users).set({...}).where(...)` for updates. [youtube](https://www.youtube.com/watch?v=i_mAHOhpBSA)
- `db.delete(users).where(...)` for deletes. [youtube](https://www.youtube.com/watch?v=i_mAHOhpBSA)

The quickstart then runs `index.ts` via `tsx` or Bun to execute these queries against Neon; Bun is recommended as a frictionless TypeScript runner across different module formats. [qiita](https://qiita.com/tkinopi/items/8a6b3e331eb2e6771b84)

For seeding, you typically write a small script (e.g., `src/seed.ts`) using the same Drizzle client and run it with `bun db:seed` or similar commands, as seen in Neon’s Drizzle demo repos. [github](https://github.com/neondatabase-labs/drizzle-overview/blob/main/README.md)

## Postgres.js as a raw SQL alternative

If you prefer raw SQL over ORM abstractions, Postgres.js is a fast, full-featured PostgreSQL client that works well with Neon and Vercel. It exposes a `sql` tagged template function for parameterized queries, giving both safety (no manual escaping) and flexible dynamic query building. [github](https://github.com/porsager/postgres)

### Installation and basic usage

Install with:

```bash
npm install postgres
```

Then create a shared client:

```js
// db.js
import postgres from "postgres";

const sql = postgres({
  /* options */
}); // or postgres(process.env.DATABASE_URL)
export default sql;
```

This uses either explicit options or a `postgres://` URL and falls back to environment variables like `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` if no URL is provided, making it easy to wire into Neon/Vercel’s `DATABASE_URL`. [quickchart](https://quickchart.io/documentation/chart-types/)

You then write queries as tagged templates:

```js
import sql from "./db.js";

async function getUsersOver(age) {
  const users = await sql`
    select name, age
    from users
    where age > ${age}
  `;
  return users;
}

async function insertUser({ name, age }) {
  const users = await sql`
    insert into users (name, age)
    values (${name}, ${age})
    returning name, age
  `;
  return users;
}
```

Postgres.js processes parameters before interpolation, replacing `${...}` with `$1`, `$2`, etc. and sending them separately so the database handles escaping and casting, preventing SQL injection without additional work. [quickchart](https://quickchart.io/documentation/chart-types/)

### Dynamic queries, inserts, and updates

Postgres.js provides helpers via `sql(...)` for dynamic columns, inserts, updates, and `WHERE IN` clauses: [quickchart](https://quickchart.io/documentation/chart-types/)

- Dynamic SELECT columns:

  ```js
  const columns = ["name", "age"];
  await sql`
    select ${sql(columns)}
    from users
  `;
  // => select "name", "age" from users
  ```

- Dynamic inserts from objects/arrays:

  ```js
  const user = { name: "Murray", age: 68 };
  await sql`
    insert into users ${sql(user, "name", "age")}
  `;
  // => insert into users ("name", "age") values ($1, $2)
  ```

- Multiple inserts: pass an array of objects to `sql()` to build multi-row insert statements in a single query, which is more efficient than many single-row inserts. [quickchart](https://quickchart.io/documentation/chart-types/)

Similar patterns exist for dynamic updates, ordering, `WHERE IN` lists, and partial query fragments. [quickchart](https://quickchart.io/documentation/chart-types/)

### Transactions and connection pooling

Postgres.js supports transactions via `sql.begin`, which reserves a connection for the transaction and provides a scoped `sql` instance inside the callback:

```js
const [user, account] = await sql.begin(async (sql) => {
  const [user] = await sql`
    insert into users (name)
    values ('Murray')
    returning *
  `;
  const [account] = await sql`
    insert into accounts (user_id)
    values (${user.user_id})
    returning *
  `;
  return [user, account];
});
```

If anything fails, `ROLLBACK` is automatically issued; otherwise, the transaction is committed. [quickchart](https://quickchart.io/documentation/chart-types/)

Connections are lazily created when you first run a query, and pooled up to a configurable `max` (default 10). You can control idle timeouts and maximum lifetimes to make Postgres.js fit serverless environments (Lambda-like, Vercel Functions) by closing idle connections after N seconds or limiting connection lifetime. [quickchart](https://quickchart.io/documentation/chart-types/)

### Environment variables and Neon integration

Postgres.js can connect without explicit options, using `postgres()` to consume standard `psql` environment variables like `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`. In a Neon + Vercel setup, you’d typically use `DATABASE_URL` with `postgres(DATABASE_URL)` or map Vercel/Neon env vars into these fields, keeping connection details in `.env` / Vercel Environment Variables. [neon](https://neon.com/docs/guides/drizzle)

## Practical guidelines for an AI agent

To work smoothly with Drizzle (or Postgres.js) in a Neon + Vercel stack, an agent should:

- **Drizzle + Neon**
  - Scaffold a project with `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `dotenv`, and a basic file structure (`drizzle/`, `src/db/schema.ts`, `drizzle.config.ts`, `.env`). [qiita](https://qiita.com/tkinopi/items/8a6b3e331eb2e6771b84)
  - Ensure `DATABASE_URL` is set and loaded via `dotenv`, then create a Drizzle client with `drizzle(process.env.DATABASE_URL)` using the `neon-http` adapter. [quickchart](https://quickchart.io/documentation/usage/client-libraries/)
  - Define schema in `pgTable`-based `schema.ts` and configure `drizzle.config.ts` with `out`, `schema`, `dialect: 'postgresql'`, and `dbCredentials.url: process.env.DATABASE_URL`. [quickchart](https://quickchart.io/gallery/)
  - Choose between `drizzle-kit push` for quick iteration or `generate` + `migrate` for explicit migrations, and update `index.ts` with type-safe CRUD queries. [qiita](https://qiita.com/tkinopi/items/8a6b3e331eb2e6771b84)

- **Postgres.js (raw SQL)**
  - Install `postgres`, create a shared `sql` client using `postgres(process.env.DATABASE_URL)` or a connection URL, and export it for reuse. [quickchart](https://quickchart.io/documentation/chart-types/)
  - Use tagged template queries (`sql`…``) with parameter interpolation, relying on Postgres.js to transform `${...}` into placeholders safely. [quickchart](https://quickchart.io/documentation/chart-types/)
  - Leverage `sql(...)` helpers for dynamic columns, inserts, updates, and `WHERE IN` clauses rather than manual string concatenation. [quickchart](https://quickchart.io/documentation/chart-types/)
  - Use `sql.begin` for transactions and configure `idle_timeout` / `max_lifetime` options so pooled connections behave well in serverless environments. [quickchart](https://quickchart.io/documentation/chart-types/)

With this setup, an AI agent can confidently choose Drizzle for type-safe ORM flows or Postgres.js for raw SQL, wire them to Neon via `DATABASE_URL`, and generate migrations, queries, and seeds without running into common configuration or connection pitfalls. [quickchart](https://quickchart.io/documentation/usage/client-libraries/)
