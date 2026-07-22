import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __dbPool?: Pool;
  __db?: ReturnType<typeof drizzle>;
};

function getPool(): Pool {
  if (globalForDb.__dbPool) return globalForDb.__dbPool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is required");
  const p = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  if (process.env.NODE_ENV !== "production") globalForDb.__dbPool = p;
  return p;
}

function getDb(): ReturnType<typeof drizzle> {
  if (globalForDb.__db) return globalForDb.__db;
  const d = drizzle(getPool());
  if (process.env.NODE_ENV !== "production") globalForDb.__db = d;
  return d;
}

// Proxy so that `db.select()` etc. work transparently but connection is created lazily
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});
