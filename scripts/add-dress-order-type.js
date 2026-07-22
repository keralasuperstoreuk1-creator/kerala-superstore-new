require("dotenv").config();
const { Client } = require("pg");

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to PostgreSQL");
  
  await client.query(`
    ALTER TABLE dresses ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) DEFAULT 'add_to_bag';
  `);
  
  console.log("Added order_type column to dresses successfully!");
  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
