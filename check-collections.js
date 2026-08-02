const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!match) { console.error('DATABASE_URL not found'); process.exit(1); }

const pool = new Pool({ connectionString: match[1], ssl: { rejectUnauthorized: false } });

(async () => {
  const client = await pool.connect();
  try {
    const r = await client.query('SELECT id, name, slug FROM collections');
    console.log('Collections:', JSON.stringify(r.rows, null, 2));
  } catch(e) { console.error('Error:', e.message); }
  finally { client.release(); pool.end(); }
})();