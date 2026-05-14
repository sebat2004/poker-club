import { Pool } from "pg";

/* ---------------------------------------------------------------------------
 * Shared Postgres pool
 *
 * Better-auth already uses Neon via its own `pg.Pool`, but our app code needs
 * a separate handle for arbitrary queries (room overrides today, tournaments
 * and member profiles next). We cache the pool on `globalThis` so Next.js'
 * dev HMR doesn't spawn a new pool on every save.
 * ------------------------------------------------------------------------- */

declare global {
  var __pokerClubPgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!globalThis.__pokerClubPgPool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }

    globalThis.__pokerClubPgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Conservative cap — Vercel functions are short-lived and Neon's free
      // tier ceiling sits at ~100 connections across all clients.
      max: 5,
    });
  }

  return globalThis.__pokerClubPgPool;
}

export const db = {
  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T[]> {
    const result = await getPool().query<T>(text, params as never[]);
    return result.rows;
  },

  async queryOne<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<T | null> {
    const result = await getPool().query<T>(text, params as never[]);
    return result.rows[0] ?? null;
  },
};
