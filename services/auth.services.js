import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import { sessionsTable, shortLinksTable, usersTable } from "../drizzle/schema.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";

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
  return await argon2.hash(password);
};

export const comparePassword = async (password, hash) => {
  return await argon2.verify(hash, password);
};

export const generateToken = (payload, expiresIn = "30d") => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn,
  });
};

export const createSession = async (userId, { ip, userAgent }) => {
  const [session] = await db
    .insert(sessionsTable)
    .values({ userId, ip, userAgent })
    .$returningId();
  return session;
};

export const createAccessToken = ({ id, name, email, sessionId }) => {
  return jwt.sign({ id, name, email, sessionId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
  });
};

export const verifyJWTToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const findSessionById = async (sessionId) => {
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.id, sessionId));
  return session;
};

export const findUserById = async (userId) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return user;
};

export const refreshTokens = async (refreshToken) => {
  try {
    // Verify the refresh token
    const decodedToken = verifyJWTToken(refreshToken);
    if (!decodedToken) {
      throw new Error("Invalid refresh token");
    }

    // Find the session associated with the refresh token
    const currentSession = await findSessionById(decodedToken.sessionId);
    if (!currentSession || !currentSession.valid) {
      throw new Error("Invalid session");
    }

    // Find the user associated with the session
    const user = await findUserById(currentSession.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Create a new access token
    const newAccessToken = createAccessToken({
      id: user.id,
      name: user.name,
      email: user.email,
      sessionId: currentSession.id,
    });

    // Create a new refresh token
    const newRefreshToken = generateToken({
      id: currentSession.id,
    });

    return {
      newAccessToken,
      newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        sessionId: currentSession.id,
      },
    };
  } catch (error) {
    console.log("Error refreshing tokens:", error.message);
    throw error;
  }
};



export const authenticateUser = async ({req, res, user, name, email}) => {
  const session = await createSession(user.id, {
      ip: req.clientIp,
      userAgent: req.headers["user-agent"],
    });
  
    // Generate an access token
    const accessToken = createAccessToken({
      id: user.id,
      name: user.name || name,
      email: user.email || email,
      sessionId: session.id,
    });
  
    // Generate a refresh token
    const refreshToken = generateToken({
      id: session.id,
    });
  
    // Set cookies with the tokens
    const baseConfig = { httpOnly: true, secure: true };
  
    res.cookie("access_token", accessToken, {
      ...baseConfig,
      maxAge: ACCESS_TOKEN_EXPIRY,
    });
  
    res.cookie("refresh_token", refreshToken, {
      ...baseConfig,
      maxAge: REFRESH_TOKEN_EXPIRY,
    });
  
    // Redirect to the main page
    res.redirect("/");
}


// getAllShortLinks

export const getAllShortLinks = async (userId) => {
  return await db
    .select()
    .from(shortLinksTable)
    .where(eq(shortLinksTable.userId, userId));
};