require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function fix() {
  const client = await pool.connect();
  try {
    // Clear all stale cart entries (items stored as "item" type but items table is empty)
    const deleted = await client.query(
      "DELETE FROM carts WHERE item_type = 'item' RETURNING id, item_id, item_type"
    );
    console.log("Deleted stale cart records:", deleted.rows);

    // Verify remaining cart entries
    const remaining = await client.query("SELECT * FROM carts");
    console.log("Remaining cart entries:", remaining.rows);

    console.log("\n✅ Cart cleaned. Dresses (4) are in DB ready to be added correctly now.");
    console.log("Go back to the website homepage and click 'Select Colors & Options' on a dress, then ADD TO BAG.");

  } finally {
    client.release();
    await pool.end();
  }
}

fix().catch(console.error);
