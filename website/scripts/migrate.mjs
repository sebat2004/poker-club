#!/usr/bin/env node
/* ---------------------------------------------------------------------------
 * Tiny migration runner
 *
 * Reads every .sql file in db/migrations in lexical order, tracks applied
 * ones in a `_migrations` table, and applies pending migrations inside a
 * transaction. Idempotent: rerunning is a no-op once every file is applied.
 *
 * Usage:
 *   npm run db:migrate                           (auto-loads .env.local)
 *   DATABASE_URL=postgres://... npm run db:migrate
 * ------------------------------------------------------------------------- */

import { existsSync, readFileSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const websiteRoot = join(__dirname, "..");
const migrationsDir = join(websiteRoot, "db", "migrations");

/* ---------- env loading -------------------------------------------------- */

/* Lightweight .env.local loader — no dotenv dep. Existing env vars win, so
   "DATABASE_URL=... npm run db:migrate" still works. */
function loadEnvFile(path) {
  if (!existsSync(path)) return;

  const content = readFileSync(path, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(join(websiteRoot, ".env.local"));
loadEnvFile(join(websiteRoot, ".env"));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "DATABASE_URL is not set.\n" +
      "  • Add it to website/.env.local, or\n" +
      "  • Run with: DATABASE_URL='postgres://...' npm run db:migrate",
  );
  process.exit(1);
}

/* Catch the most common footgun: leaving the literal "..." placeholder
   from copy-pasted instructions in DATABASE_URL. */
if (
  databaseUrl.includes("://...") ||
  databaseUrl.includes("@...") ||
  databaseUrl.includes("/...")
) {
  console.error(
    "DATABASE_URL looks like an unfilled placeholder (contains '...').\n" +
      "Set the real Neon connection string in website/.env.local.",
  );
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function appliedSet() {
  const { rows } = await pool.query("SELECT filename FROM _migrations");
  return new Set(rows.map((row) => row.filename));
}

async function run() {
  await ensureMigrationsTable();
  const applied = await appliedSet();

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  let appliedCount = 0;

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = await readFile(join(migrationsDir, file), "utf8");
    console.log(`→ Applying ${file}`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [
        file,
      ]);
      await client.query("COMMIT");
      appliedCount += 1;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  await pool.end();

  if (appliedCount === 0) {
    console.log("✓ Database already up to date.");
  } else {
    console.log(`✓ Applied ${appliedCount} migration(s).`);
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
