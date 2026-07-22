const { Pool } = require("pg");
require("dotenv").config();

async function dropAll() {
  console.log("Connecting to", process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;');
    console.log("Database cleared successfully.");
  } catch (err) {
    console.error("Error clearing DB:", err);
  }
  process.exit(0);
}

dropAll();
