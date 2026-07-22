require("dotenv").config();
const { Client } = require("pg");

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to PostgreSQL");
  
  await client.query(`
    ALTER TABLE dresses ADD COLUMN IF NOT EXISTS color_variants JSONB;
  `);
  
  console.log("Added color_variants column to dresses table!");
  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
