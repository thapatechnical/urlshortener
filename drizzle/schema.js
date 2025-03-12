import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

import { relations } from "drizzle-orm";
import { boolean, text } from "drizzle-orm/pg-core";
import session from "express-session";

export const shortLinksTable = mysqlTable("short_link", {
  id: int().autoincrement().primaryKey(),
  url: varchar({ length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  userId:int("user_id").notNull().references(() => usersTable.id),
});

export const sessionsTable = mysqlTable("session", {
   id: int().autoincrement().primaryKey(),
   userId: int("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade"} ),
   valid: boolean().default(true).notNull(),
   userAgent:text("user_agent"),
   ip:varchar({ length: 255 }),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const usersTable = mysqlTable("users", {
  id: int().autoincrement().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});


// A user can have many shorts links
export const usersRelations = relations(usersTable, ({many}) =>({  
shortLink: many(shortLinksTable),
session: many(sessionsTable),
}));

export const shortLinksRelations = relations( shortLinksTable, ({one}) =>({
  user: one(usersTable, {
    fields: [shortLinksTable.userId],
     references: [usersTable.id]
    }),
}))


export const sessionsRelations = relations(sessionsTable, ({one}) =>({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
     references: [usersTable.id]
    }),
}))