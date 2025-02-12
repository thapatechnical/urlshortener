import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { shortLinksTable } from "../drizzle/schema.js";

export const getAllShortLinks = async () => {
  return await db.select().from(shortLinksTable);
};

export const getShortLinkByShortCode = async (shortCode) => {
  const [result] = await db
    .select()
    .from(shortLinksTable)
    .where(eq(shortLinksTable.shortCode, shortCode));
  return result;
};

export const insertShortLink = async ({ url, shortCode }) => {
  await db.insert(shortLinksTable).values({ url, shortCode });
};
