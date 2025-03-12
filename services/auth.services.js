import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { sessionsTable, usersTable } from "../drizzle/schema.js";
// import bcrypt from "bcrypt";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND } from "../config/constants.js";

export const getUserByEmail = async (email) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  return user;
};

export const createUser = async ({ name, email, password }) => {
  return await db
    .insert(usersTable)
    .values({ name, email, password })
    .$returningId();
};

export const hashPassword = async (password) => {
  // return await bcrypt.hash(password, 10);
  return await argon2.hash(password);
};

export const comparePassword = async (password, hash) => {
  // return await bcrypt.compare(password, hash);
  return await argon2.verify(hash, password);
};

// export const generateToken = ({ id, name, email }) => {
//   return jwt.sign({ id, name, email }, process.env.JWT_SECRET, {
//     expiresIn: "30d",
//   });
// };


export const generateToken =({ id, name, email }) => {
  return jwt.sign({ id, name, email }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
}

export const createSession = async(userId,{ip,userAgent})=>{
  const [session] = await db
  .insert(sessionsTable)
  .values({userId,ip, userAgent})
  .$returningId();
  return session;
}

export const createAccessToken = async (id,name,email,sessionId)=>{
    return jwt.sign({id,name,email,sessionId},process.env.JWT_SECRET,{
      expiresIn:ACCESS_TOKEN_EXPIRY/ MILLISECONDS_PER_SECOND,
    })
};



export const verifyJWTToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null; 
  }
};