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

export const findSessionById = async (sessionId) => {
  const session = await db
  .select()
  .from(sessionsTable)
  .where(eq(sessionsTable.id, sessionId));
  return session;
}

// finduserID

export const findUserById = async (userId) => {
  const [user] = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.id, userId));
  return user;
}

// refreshTokens

export const refreshTokens = async (refreshToken) => {
  try {
    const decodedToken = verifyJWTToken(refreshToken);
    const currentSession = await findSessionById(decodedToken.sessionId);

    if(!currentSession || !currentSession.valid){
      throw new Error("Invalid refresh token");
    }

    const user = await findUserById(currentSession.userId);
     if(!user){
      throw new Error("User not found");
     }
     const userInfo = {
      id:user.id,
      name:user.name,
      email:user.email,
      sessionId:currentSession.id,
     }
  const newAccessToken =createAccessToken(userInfo);

  const newRefreshToken = createAccessToken(currentSession.id);

 return {
  newAccessToken,
  newRefreshToken,
  user:userInfo,
 }


  } catch (error) {
    console.log(error.message);
    
  }
}