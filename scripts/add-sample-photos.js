require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function run() {
  const artifactsDir = `C:\\Users\\SATHYASASREE\\.gemini\\antigravity-ide\\brain\\e1e77986-9334-4ac4-aaeb-a66053839b91`;
  const targetDir = path.join(__dirname, "..", "public", "uploads");

  // Copy sample_dress
  const files = fs.readdirSync(artifactsDir);
  let sampleDressFile = files.find(f => f.startsWith("sample_dress_") && f.endsWith(".png"));
  if (sampleDressFile) {
    fs.copyFileSync(path.join(artifactsDir, sampleDressFile), path.join(targetDir, "sample_dress.png"));
    console.log("Copied sample_dress.png");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to Neon Postgres");

  // Update items table
  await client.query(`
    UPDATE items 
    SET images = ARRAY['/uploads/prod_mixture.png'] 
    WHERE images IS NULL OR array_length(images, 1) IS NULL
  `);
  console.log("Updated sample photos for items");

  // Update dresses table
  await client.query(`
    UPDATE dresses 
    SET images = ARRAY['/uploads/sample_dress.png'] 
    WHERE images IS NULL OR array_length(images, 1) IS NULL
  `);
  console.log("Updated sample photos for dresses");

  await client.end();
}

run().catch(console.error);
