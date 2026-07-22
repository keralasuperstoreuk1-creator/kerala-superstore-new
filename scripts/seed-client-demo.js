require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function run() {
  const artifactsDir = `C:\\Users\\SATHYASASREE\\.gemini\\antigravity-ide\\brain\\54b3ce22-c01a-430f-b1cc-1062a21fea01`;
  const targetDir = path.join(__dirname, "..", "public", "uploads");

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Find generated images
  const files = fs.readdirSync(artifactsDir);
  const imageMap = {};

  files.forEach((file) => {
    if (file.startsWith("hero_banner_onam") && file.endsWith(".png")) {
      fs.copyFileSync(path.join(artifactsDir, file), path.join(targetDir, "hero_banner_onam.png"));
      imageMap.hero = "/uploads/hero_banner_onam.png";
    }
    if (file.startsWith("kasavu_saree_maroon") && file.endsWith(".png")) {
      fs.copyFileSync(path.join(artifactsDir, file), path.join(targetDir, "kasavu_saree_maroon.png"));
      imageMap.maroonSaree = "/uploads/kasavu_saree_maroon.png";
    }
    if (file.startsWith("gents_mundu_gold") && file.endsWith(".png")) {
      fs.copyFileSync(path.join(artifactsDir, file), path.join(targetDir, "gents_mundu_gold.png"));
      imageMap.gentsMundu = "/uploads/gents_mundu_gold.png";
    }
  });

  console.log("Copied generated images to public/uploads:", imageMap);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to Neon Postgres");

  // 1. Seed/Update Hero Slides with Full Width Background Slide
  const heroUrl = imageMap.hero || "/uploads/hero_banner_onam.png";
  await client.query(`DELETE FROM slides;`);
  await client.query(
    `INSERT INTO slides (title, subtitle, image, link, button_text, sort_order, width, height, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      "Grand Onam & Kerala Festive Collection 2026",
      "Authentic Kasavu sarees, shirts, kids attire & traditional Kerala groceries delivered straight to your doorstep across the UK.",
      heroUrl,
      "#collection-onam-dresses",
      "Explore Onam Collection",
      1,
      1920,
      600,
      true,
    ]
  );

  // 2. Ensure Collections exist with order_type
  await client.query(`
    INSERT INTO collections (name, slug, description, image, order_type, sort_order, is_active)
    VALUES 
    ('Onam Dress Collection', 'onam-dresses', 'Traditional Kasavu sarees, mundu sets & kids festive wear', '${imageMap.maroonSaree || heroUrl}', 'add_to_bag', 1, true),
    ('Kerala Spices & Snacks', 'spices-snacks', 'Crispy banana chips, cardamom, black pepper & authentic Kerala tea', '${heroUrl}', 'add_to_bag', 2, true),
    ('Pre-Order Special Festives', 'pre-order-festive', 'Advance booking for custom festive attire & bulk sweets', '${heroUrl}', 'pre_order', 3, true)
    ON CONFLICT (slug) DO UPDATE SET 
      name = EXCLUDED.name,
      order_type = EXCLUDED.order_type,
      image = EXCLUDED.image;
  `);

  // 3. Seed Sample Onam Dresses with Shopify-style Color Variants
  await client.query(`DELETE FROM dresses;`);
  
  const maroonImg = imageMap.maroonSaree || heroUrl;
  const gentsImg = imageMap.gentsMundu || heroUrl;

  await client.query(
    `INSERT INTO dresses (name, type, description, price, compare_at_price, images, sizes, colors, color_variants, order_type, stock, sort_order, is_active)
     VALUES 
     (
       'Kerala Premium Kasavu Saree with Zari Border',
       'ladies',
       'Authentic 100% Cotton Kasavu Saree woven with rich golden zari borders and matching blouse piece. Soft, breathable, and festive.',
       45.00,
       65.00,
       ARRAY['${maroonImg}'],
       ARRAY['Free Size', 'S', 'M', 'L', 'XL'],
       ARRAY['Maroon', 'Gold', 'Kasavu White', 'Green'],
       '${JSON.stringify([
         { color: "Maroon", image: maroonImg },
         { color: "Gold", image: gentsImg },
         { color: "Kasavu White", image: maroonImg },
         { color: "Green", image: gentsImg },
       ])}',
       'add_to_bag',
       25,
       1,
       true
     ),
     (
       'Gents Pure Cotton Gold Kasavu Shirt & Mundu Set',
       'gents',
       'Traditional Kerala Gents half-sleeve Kasavu shirt with matching 2.0m golden zari border mundu.',
       35.00,
       50.00,
       ARRAY['${gentsImg}'],
       ARRAY['S', 'M', 'L', 'XL', '2XL'],
       ARRAY['Gold', 'White', 'Black', 'Navy Blue'],
       '${JSON.stringify([
         { color: "Gold", image: gentsImg },
         { color: "White", image: maroonImg },
         { color: "Black", image: gentsImg },
         { color: "Navy Blue", image: maroonImg },
       ])}',
       'add_to_bag',
       30,
       2,
       true
     ),
     (
       'Kids Festive Oonjal Side Shirt & Kasavu Dhoti Set',
       'kids',
       'Adorable traditional Kerala outfit for young boys and girls. Soft cotton with gold border.',
       22.00,
       32.00,
       ARRAY['${maroonImg}'],
       ARRAY['20', '22', '24', '26', '28', '30', '32'],
       ARRAY['Maroon', 'Green', 'Kasavu White', 'Yellow'],
       '${JSON.stringify([
         { color: "Maroon", image: maroonImg },
         { color: "Green", image: gentsImg },
         { color: "Kasavu White", image: maroonImg },
         { color: "Yellow", image: gentsImg },
       ])}',
       'add_to_bag',
       40,
       3,
       true
     ),
     (
       'Family Onam Combo Set (Saree + Shirt + Kids)',
       'combo',
       'Matching 3-piece family festive ensemble for Onam celebrations.',
       89.00,
       120.00,
       ARRAY['${gentsImg}'],
       ARRAY['Free Size', 'M', 'L', 'XL', '24', '28'],
       ARRAY['Matching Gold Kasavu', 'Maroon Special'],
       '${JSON.stringify([
         { color: "Matching Gold Kasavu", image: gentsImg },
         { color: "Maroon Special", image: maroonImg },
       ])}',
       'pre_order',
       15,
       4,
       true
     );`
  );

  console.log("Successfully seeded demo data into database!");
  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
