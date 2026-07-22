require("dotenv").config();
const { Client } = require("pg");

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to Neon DB");

  // Add collection_id to dresses table
  await client.query(`
    ALTER TABLE dresses 
    ADD COLUMN IF NOT EXISTS collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL;
  `);

  console.log("Migration complete: Added collection_id to dresses table.");
  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
