import { pgTable, serial, text, varchar, real, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull().default("طرح سه‌بعدی بام"),
  userName: varchar("user_name", { length: 255 }),
  userPhone: varchar("user_phone", { length: 50 }),
  userEmail: varchar("user_email", { length: 255 }),
  city: varchar("city", { length: 100 }).default("تهران"),
  spaceType: varchar("space_type", { length: 100 }).default("residential_roof"),
  width: real("width").notNull().default(10), // in meters
  length: real("length").notNull().default(8), // in meters
  parapetHeight: real("parapet_height").default(1.1), // in meters
  flooringType: varchar("flooring_type", { length: 50 }).default("wpc_wood"),
  wpcColor: varchar("wpc_color", { length: 50 }).default("walnut"),
  metalColor: varchar("metal_color", { length: 50 }).default("black"),
  layoutData: jsonb("layout_data").notNull().default([]),
  totalArea: real("total_area").default(80),
  greenArea: real("green_area").default(25),
  flooringArea: real("flooring_area").default(55),
  itemsCount: integer("items_count").default(0),
  estimatedWeightKg: real("estimated_weight_kg").default(0),
  estimatedPriceMin: integer("estimated_price_min").default(0),
  estimatedPriceMax: integer("estimated_price_max").default(0),
  notes: text("notes"),
  status: varchar("status", { length: 100 }).default("طرح اولیه"),
  expertNotes: text("expert_notes"),
  assignedExpert: varchar("assigned_expert", { length: 255 }),
  snapshotUrl: text("snapshot_url"),
  // منبع ثبت طرح: مستقیم از پنل یا فورواردشده از وردپرس
  source: varchar("source", { length: 50 }).default("panel"),
  sourceRef: varchar("source_ref", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const consultationRequests = pgTable("consultation_requests", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  city: varchar("city", { length: 100 }).notNull().default("تهران"),
  spaceType: varchar("space_type", { length: 100 }).default("پشت‌بام مسکونی"),
  estimatedArea: real("estimated_area"),
  servicesNeeded: jsonb("services_needed").default(["طراحی سه‌بعدی", "اجرای مدولار"]),
  message: text("message"),
  designId: integer("design_id"),
  status: varchar("status", { length: 100 }).default("در انتظار بررسی"),
  expertNotes: text("expert_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productInquiries = pgTable("product_inquiries", {
  id: serial("id").primaryKey(),
  productCode: varchar("product_code", { length: 100 }).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userPhone: varchar("user_phone", { length: 50 }).notNull(),
  quantity: integer("quantity").default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
