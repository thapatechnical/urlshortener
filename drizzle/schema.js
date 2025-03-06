import { int, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

import { relations } from "drizzle-orm";

export const shortLinksTable = mysqlTable("short_link", {
  id: int().autoincrement().primaryKey(),
  url: varchar({ length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 20 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  userId:int("user_id").notNull().references(() => usersTable.id),
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
}));

export const shortLinksRelations = relations( shortLinksTable, ({one}) =>({
  user: one(usersTable, {
    fields: [shortLinksTable.userId],
     references: [usersTable.id]
    }),
}))


