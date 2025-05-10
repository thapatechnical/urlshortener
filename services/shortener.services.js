import { count, desc, eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { shortLinksTable } from "../drizzle/schema.js";

export const getAllShortLinks = async ({ userId, limit = 10, offset = 0 }) => {
  const condition = eq(shortLinksTable.userId, userId);
  const shortLinks = await db
    .select()
    .from(shortLinksTable)
    .where(condition)
    .orderBy(desc(shortLinksTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(shortLinksTable)
    .where(condition);

  return { shortLinks, totalCount };
};

export const getShortLinkByShortCode = async (shortCode) => {
  const [result] = await db
    .select()
    .from(shortLinksTable)
    .where(eq(shortLinksTable.shortCode, shortCode));
  return result;
};

export const insertShortLink = async ({ url, shortCode, userId }) => {
  await db.insert(shortLinksTable).values({ url, shortCode, userId });
};

// findShortLinkById
export const findShortLinkById = async (id) => {
  const [result] = await db
    .select()
    .from(shortLinksTable)
    .where(eq(shortLinksTable.id, id));
  return result;
};

// updateShortCode
export const updateShortCode = async ({ id, url, shortCode }) => {
  return await db
    .update(shortLinksTable)
    .set({ url, shortCode })
    .where(eq(shortLinksTable.id, id));
};

// /deleteShortCodeById
export const deleteShortCodeById = async (id) => {
  return await db.delete(shortLinksTable).where(eq(shortLinksTable.id, id));
};
