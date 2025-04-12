import { boolean, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { relations, sql } from "drizzle-orm";
import e from "connect-flash";

// Users Table (Declared First)
export const usersTable = mysqlTable("users", {
  id: int().autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  isEmailValid: boolean().default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// passwordResetToken Table
export const passwordResetTokenTable = mysqlTable("password_reset_token", {
  id: int().autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash:text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").default(sql`CURRENT_TIMESTAMP + INTERVAL 1 DAY `).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Short Links Table
export const shortLinksTable = mysqlTable("short_link", {
  id: int().autoincrement().primaryKey(),
  url: varchar("url", { length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  userId: int("user_id").notNull().references(() => usersTable.id),
});

// Sessions Table
export const sessionsTable = mysqlTable("session", {
  id: int().autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  valid: boolean().default(true).notNull(),
  userAgent: varchar("user_agent", { length: 255 }), // Changed text to varchar
  ip: varchar("ip", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Email Verification Token Table
export const verifyEmailTokenTable = mysqlTable("verify_email_token", {
  id: int().autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 8 }).notNull(),
  expiresAt: timestamp("expires_at").default(sql`CURRENT_TIMESTAMP + INTERVAL 1 DAY`).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(), // Fixed typo
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  shortLink: many(shortLinksTable),
  session: many(sessionsTable),
}));

export const shortLinksRelations = relations(shortLinksTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [shortLinksTable.userId],
    references: [usersTable.id],
  }),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));


