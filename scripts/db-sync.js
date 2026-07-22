require("dotenv").config();
const { Pool } = require("pg");

async function syncDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL missing!");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Syncing DB tables...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS collections (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      image TEXT,
      order_type VARCHAR(20) DEFAULT 'add_to_bag',
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      collection_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      image TEXT,
      order_type VARCHAR(20) DEFAULT 'add_to_bag',
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      category_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      compare_at_price DECIMAL(10,2),
      sku VARCHAR(100),
      stock INT DEFAULT 0,
      images TEXT[],
      is_active BOOLEAN DEFAULT TRUE,
      gender VARCHAR(50),
      age_group VARCHAR(50),
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS item_variants (
      id SERIAL PRIMARY KEY,
      item_id INT NOT NULL,
      color VARCHAR(100),
      color_code VARCHAR(20),
      size VARCHAR(50),
      images TEXT[],
      price DECIMAL(10,2),
      stock INT DEFAULT 0,
      sku VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS slides (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      subtitle TEXT,
      image TEXT NOT NULL,
      link TEXT,
      button_text VARCHAR(100),
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      width INT DEFAULT 1920,
      height INT DEFAULT 600,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(50) NOT NULL UNIQUE,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50) NOT NULL,
      customer_email VARCHAR(255),
      address TEXT NOT NULL,
      city VARCHAR(100),
      postcode VARCHAR(20),
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      payment_method VARCHAR(50) DEFAULT 'cod',
      notes TEXT,
      whatsapp_sent BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INT NOT NULL,
      item_id INT NOT NULL,
      variant_id INT,
      item_name VARCHAR(255) NOT NULL,
      variant_name VARCHAR(255),
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      total DECIMAL(10,2) NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(100) NOT NULL UNIQUE,
      value TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS carts (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      item_id INT NOT NULL,
      variant_id INT,
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS offers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      emoji VARCHAR(20) DEFAULT '🎁',
      tag VARCHAR(100) DEFAULT 'SPECIAL',
      old_price DECIMAL(10,2) NOT NULL,
      new_price DECIMAL(10,2) NOT NULL,
      discount VARCHAR(20),
      image TEXT,
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS dresses (
      id SERIAL PRIMARY KEY,
      collection_id INT,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      compare_at_price DECIMAL(10,2),
      images TEXT[],
      sizes TEXT[],
      colors TEXT[],
      color_variants JSONB,
      order_type VARCHAR(20) DEFAULT 'add_to_bag',
      stock INT DEFAULT 0,
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS winners (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      photo TEXT,
      prize VARCHAR(255) NOT NULL,
      event VARCHAR(255) NOT NULL,
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS promo_banners (
      id SERIAL PRIMARY KEY,
      image TEXT NOT NULL,
      link TEXT,
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );`
  ];

  for (const q of queries) {
    try {
      await pool.query(q);
    } catch (e) {
      console.error("Error running query:", e.message);
    }
  }

  console.log("Database tables verified & synced successfully!");
  await pool.end();
}

syncDb();
