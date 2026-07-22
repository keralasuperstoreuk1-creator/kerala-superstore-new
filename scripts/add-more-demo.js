require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function run() {
  const artifactsDir = `C:\\Users\\SATHYASASREE\\.gemini\\antigravity-ide\\brain\\e1e77986-9334-4ac4-aaeb-a66053839b91`;
  const targetDir = path.join(__dirname, "..", "public", "uploads");

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Find generated images
  const files = fs.readdirSync(artifactsDir);
  const imageMap = {};

  files.forEach((file) => {
    if (file.startsWith("hero_spices_") && file.endsWith(".png")) {
      fs.copyFileSync(path.join(artifactsDir, file), path.join(targetDir, "hero_spices.png"));
      imageMap.spicesSlide = "/uploads/hero_spices.png";
    }
    if (file.startsWith("hero_snacks_") && file.endsWith(".png")) {
      fs.copyFileSync(path.join(artifactsDir, file), path.join(targetDir, "hero_snacks.png"));
      imageMap.snacksSlide = "/uploads/hero_snacks.png";
    }
    if (file.startsWith("prod_blackpepper_") && file.endsWith(".png")) {
      fs.copyFileSync(path.join(artifactsDir, file), path.join(targetDir, "prod_blackpepper.png"));
      imageMap.blackpepper = "/uploads/prod_blackpepper.png";
    }
    if (file.startsWith("prod_bananachips_") && file.endsWith(".png")) {
      fs.copyFileSync(path.join(artifactsDir, file), path.join(targetDir, "prod_bananachips.png"));
      imageMap.bananachips = "/uploads/prod_bananachips.png";
    }
    if (file.startsWith("prod_mixture_") && file.endsWith(".png")) {
      fs.copyFileSync(path.join(artifactsDir, file), path.join(targetDir, "prod_mixture.png"));
      imageMap.mixture = "/uploads/prod_mixture.png";
    }
  });

  console.log("Copied generated images to public/uploads:", imageMap);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to Neon Postgres");

  // Insert slides
  if (imageMap.spicesSlide) {
    await client.query(
      `INSERT INTO slides (title, subtitle, image, link, button_text, sort_order, width, height, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ["Aromatic Kerala Spices", "Fresh from the gardens of Wayanad and Idukki. Bring the authentic aroma of Kerala to your kitchen.", imageMap.spicesSlide, "#products", "Explore Spices", 2, 1920, 600, true]
    );
  }
  if (imageMap.snacksSlide) {
    await client.query(
      `INSERT INTO slides (title, subtitle, image, link, button_text, sort_order, width, height, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ["Traditional Kerala Snacks", "Crispy banana chips, spicy mixture, and sweet achappam. The perfect tea-time companions.", imageMap.snacksSlide, "#products", "Shop Snacks", 3, 1920, 600, true]
    );
  }

  // Get categories for products
  let spiceCatRes = await client.query(`SELECT id FROM categories WHERE name ILIKE '%Spice%' LIMIT 1`);
  let spiceCatId = spiceCatRes.rows.length > 0 ? spiceCatRes.rows[0].id : null;

  let snackCatRes = await client.query(`SELECT id FROM categories WHERE name ILIKE '%Snack%' LIMIT 1`);
  let snackCatId = snackCatRes.rows.length > 0 ? snackCatRes.rows[0].id : null;

  // Insert products
  if (imageMap.blackpepper && spiceCatId) {
    await client.query(
      `INSERT INTO items (category_id, name, slug, description, price, compare_at_price, stock, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [spiceCatId, "Premium Whole Black Pepper (100g)", "premium-black-pepper-100g", "Authentic, bold, and aromatic whole black pepper corns sourced directly from Kerala farms.", 4.50, 5.50, 50, [imageMap.blackpepper]]
    );
  }
  if (imageMap.bananachips && snackCatId) {
    await client.query(
      `INSERT INTO items (category_id, name, slug, description, price, compare_at_price, stock, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [snackCatId, "Kerala Banana Chips (200g)", "kerala-banana-chips-200g", "Crispy, golden, and thinly sliced Nendran banana chips fried in pure coconut oil.", 3.99, 4.50, 50, [imageMap.bananachips]]
    );
  }
  if (imageMap.mixture && snackCatId) {
    await client.query(
      `INSERT INTO items (category_id, name, slug, description, price, compare_at_price, stock, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [snackCatId, "Spicy Kerala Mixture (200g)", "spicy-kerala-mixture-200g", "A crunchy, spicy blend of sev, boondi, roasted peanuts, and fried curry leaves.", 3.50, null, 50, [imageMap.mixture]]
    );
  }

  console.log("Database seeded with additional demo content successfully!");
  await client.end();
}

run().catch(console.error);
