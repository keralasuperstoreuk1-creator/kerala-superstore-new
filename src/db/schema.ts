import { pgTable, serial, varchar, text, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  orderType: varchar("order_type", { length: 20 }).default("add_to_bag"), // "add_to_bag" | "pre_order"
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  orderType: varchar("order_type", { length: 20 }).default("add_to_bag"), // "add_to_bag" | "pre_order"
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  sku: varchar("sku", { length: 100 }),
  stock: integer("stock").default(0),
  images: text("images").array(),
  isActive: boolean("is_active").default(true),
  gender: varchar("gender", { length: 50 }),
  ageGroup: varchar("age_group", { length: 50 }),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const itemVariants = pgTable("item_variants", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  color: varchar("color", { length: 100 }),
  colorCode: varchar("color_code", { length: 20 }),
  size: varchar("size", { length: 50 }),
  images: text("images").array(),
  price: decimal("price", { precision: 10, scale: 2 }),
  stock: integer("stock").default(0),
  sku: varchar("sku", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const slides = pgTable("slides", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  subtitle: text("subtitle"),
  image: text("image").notNull(),
  link: text("link"),
  buttonText: varchar("button_text", { length: 100 }),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  width: integer("width").default(1920),
  height: integer("height").default(600),
  titleColor: varchar("title_color", { length: 20 }).default("#ffffff"),
  titleSize: varchar("title_size", { length: 10 }),
  subtitleColor: varchar("subtitle_color", { length: 20 }).default("#ffffffcc"),
  subtitleSize: varchar("subtitle_size", { length: 10 }),
  btnBgColor: varchar("btn_bg_color", { length: 20 }),
  btnTextColor: varchar("btn_text_color", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }),
  postcode: varchar("postcode", { length: 20 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  paymentMethod: varchar("payment_method", { length: 50 }).default("cod"),
  notes: text("notes"),
  whatsappSent: boolean("whatsapp_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  itemId: integer("item_id").notNull(),
  variantId: integer("variant_id"),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  variantName: varchar("variant_name", { length: 255 }),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url", { length: 500 }),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  itemId: integer("item_id").notNull(),
  itemType: varchar("item_type", { length: 20 }).default("item"),
  variantId: integer("variant_id"),
  variantName: varchar("variant_name", { length: 255 }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New tables for Kerala Super Store
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  emoji: varchar("emoji", { length: 20 }).default("🎁"),
  tag: varchar("tag", { length: 100 }).default("SPECIAL"),
  oldPrice: decimal("old_price", { precision: 10, scale: 2 }).notNull(),
  newPrice: decimal("new_price", { precision: 10, scale: 2 }).notNull(),
  discount: varchar("discount", { length: 20 }),
  image: text("image"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dresses = pgTable("dresses", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id"),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // ladies, gents, kids, combo
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }),
  images: text("images").array(),
  sizes: text("sizes").array(),
  colors: text("colors").array(),
  colorVariants: jsonb("color_variants"), // Array of { color: string, image: string, stock?: number }
  orderType: varchar("order_type", { length: 20 }).default("add_to_bag"), // "add_to_bag" | "pre_order"
  stock: integer("stock").default(0),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const winners = pgTable("winners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  photo: text("photo"),
  prize: varchar("prize", { length: 255 }).notNull(),
  event: varchar("event", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promoBanners = pgTable("promo_banners", {
  id: serial("id").primaryKey(),
  image: text("image").notNull(),
  link: text("link"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
