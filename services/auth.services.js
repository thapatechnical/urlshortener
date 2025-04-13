import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { passwordResetTokenTable, sessionsTable, shortLinksTable, usersTable, verifyEmailTokenTable } from "../drizzle/schema.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import ejs from "ejs";
import mjml2html from "mjml";
// import { sendEmail } from "../lib/nodemailer.js";
import { sendEmail } from "../lib/send-email.js";


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
        isEmailValid: user.isEmailValid,
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
      isEmailValid: false,
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

// export const generateRandomToken

export const generateRandomToken =  (digit = 8) => {
  const min = 10 ** (digit - 1);
  const max = 10 ** digit;
  return crypto.randomInt(min, max).toString();
};

// insertVerifyEmailToken

export const insertVerifyEmailToken = async ({ userId, token }) => {
  console.log("Inserting token for user:", userId, "Token:", token);

  try {
    const result = await db.transaction(async (tx) => {
      // Delete expired tokens
      await tx
        .delete(verifyEmailTokenTable)
        .where(lt(verifyEmailTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`));

      // Delete any existing tokens for the user
      await tx
        .delete(verifyEmailTokenTable)
        .where(eq(verifyEmailTokenTable.userId, userId));

      // Insert the new token (without .returning())
      await tx
        .insert(verifyEmailTokenTable)
        .values({ userId, token });

      // If you need the inserted data, you can query it separately
      const [insertedToken] = await tx
        .select()
        .from(verifyEmailTokenTable)
        .where(eq(verifyEmailTokenTable.userId, userId));

      console.log("Token inserted successfully:", insertedToken);
      return insertedToken;
    });
    
    return result;
  } catch (error) {
    console.error("Error inserting verify email token:", error);
    throw new Error("Database transaction failed: " + error.message);
  }
};
// createVerifyEmailLink

// export const createVerifyEmailLink = async ({ email, token }) => {

//   const uriEncodedToken = encodeURIComponent(email);

//   return `${process.env.FRONTEND_URL}/verify-email-token?email=${email}&token=${uriEncodedToken}`;
 
// }

export const createVerifyEmailLink = async ({ email, token }) => {

  const uriEncodedToken = encodeURIComponent(email);

  return `${process.env.FRONTEND_URL}/verify-email-token?email=${email}&token=${uriEncodedToken}`;
  
  const url = new URL(`${process.env.FRONTEND_URL}/verify-email-token`);

  url.searchParams.append("email", email);
  url.searchParams.append("token", token);

  return url.toString();
}


// export const findVerificationEmailToken = async ({token, email}) => {
//   // First find the user by email
//   const [user] = await db
//     .select()
//     .from(usersTable)
//     .where(eq(usersTable.email, email));

//   if (!user) return null;

//   // Then find the token for that user
//   const [tokenData] = await db
//     .select()
//     .from(verifyEmailTokenTable)
//     .where(
//       and(
//         eq(verifyEmailTokenTable.token, token),
//         eq(verifyEmailTokenTable.userId, user.id),
//         gte(verifyEmailTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`)
//       )
//     );

//   if (!tokenData) return null;

//   return {
//     userId: user.id,
//     email: user.email,
//     token: tokenData.token,
//     expiresAt: tokenData.expiresAt
//   };
// };


// inner joinsts 
export const findVerificationEmailToken = async ({ token, email }) => {
  const [result] = await db
    .select({
      userId: usersTable.id,
      email: usersTable.email,
      token: verifyEmailTokenTable.token,
      expiresAt: verifyEmailTokenTable.expiresAt,
    })
    .from(verifyEmailTokenTable)
    .innerJoin(usersTable, eq(verifyEmailTokenTable.userId, usersTable.id))
    .where(
      and(
        eq(verifyEmailTokenTable.token, token),
        eq(usersTable.email, email),
        gte(verifyEmailTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`)
      )
    );

  return result || null;
};



export const verifyUserEmailAndUpdate = async (userId) => {
  return db.update(usersTable)
    .set({ isEmailValid: true })
    .where(eq(usersTable.id, userId));
};


export const clearVerifyEmailToken = async (email) => {
   const [user] = await db
   .select()
   .from(usersTable)
   .where(eq(usersTable.email, email));

   return await db.delete(verifyEmailTokenTable)
   .where(eq(verifyEmailTokenTable.userId, user.id));
};


// export const sendNewVerifyEmailLink = async({email, userId})=>{
//   const randomToken = generateRandomToken();
  
//     await insertVerifyEmailToken({userId,token:randomToken});
  
//     const verifyEmailLink = await createVerifyEmailLink({
//       email: email,
//       token: randomToken,
//     });

//     // get a file data 
//     const mjmlTemplate = await fs.readFile(path.join(import.meta.dirname, "..", "emails","verify-email.mjml") , "utf-8");
//     console.log(mjmlTemplate);
    

//     //to replace the place hodle dyamically
//     const filledTemplate = ejs.render(mjmlTemplate,{code:randomToken,link:verifyEmailLink} )
  

//     //to convert mjml to html 

//     const htmlOutput = await mjml2html(filledTemplate);

//     sendEmail({
//       to: email,
//       subject: "Verify your email",
//       html: htmlOutput
     
//     }).catch(console.error);
// }


export const sendNewVerifyEmailLink = async ({ email, userId }) => {
  const randomToken = generateRandomToken();
  
  await insertVerifyEmailToken({ userId, token: randomToken });

  const verifyEmailLink = await createVerifyEmailLink({
    email: email,
    token: randomToken,
  });

  try {
    // Get the file data
    const mjmlTemplatePath = path.join(process.cwd(), "emails", "verify-email.mjml");
    const mjmlTemplate = await fs.readFile(mjmlTemplatePath, "utf-8");

    // Replace the placeholders dynamically
    const filledTemplate = ejs.render(mjmlTemplate, { 
      code: randomToken, 
      link: verifyEmailLink 
    });

    // Convert MJML to HTML
    const { html: htmlOutput, errors } = mjml2html(filledTemplate);
    
    if (errors && errors.length > 0) {
      console.error("MJML conversion errors:", errors);
      throw new Error("Failed to convert MJML to HTML");
    }

    // Send the email
    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: htmlOutput // Make sure to use the html property
    });

  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};


// updateUserPassword

export const updateUserPassword = async ({ userId, newPassword }) => {
  try {
    // Use consistent hashing (argon2 instead of bcrypt)
    const hashedPassword = await hashPassword(newPassword);
    
    await db.update(usersTable)
      .set({ password: hashedPassword })
      .where(eq(usersTable.id, userId));
      
    return true;
  } catch (error) {
    console.error('Password update error:', error);
    throw new Error('Failed to update password');
  }
}


export const findUserByEmail = async (email) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  return user;
}

// createResetPasswordLink

export const createResetPasswordLink = async ({ userId }) => {
  const randomToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(randomToken).digest("hex");
  
  await db.delete(passwordResetTokenTable).where(eq(passwordResetTokenTable.userId, userId));

  // Fix: Use tokenHash instead of token to match your schema
  await db.insert(passwordResetTokenTable).values({ 
    userId: userId, 
    tokenHash: tokenHash // Changed from 'token' to 'tokenHash'
  });
 
  return `${process.env.FRONTEND_URL}/reset-password/${randomToken}`;
}


// getResetPasswordToken

export const getResetPasswordToken = async (token) => {

   const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

   const [data] = await db
   .select()
   .from(passwordResetTokenTable)
   .where(
and (
  eq(passwordResetTokenTable.tokenHash, tokenHash), gte(passwordResetTokenTable.expiresAt, sql`CURRENT_TIMESTAMP`)
)
  );
   return data;
}


// clearResetPasswordToken

export const clearResetPasswordToken = async (userId) => {
   await db
   .delete(passwordResetTokenTable)
   .where(eq(passwordResetTokenTable.userId, userId));
}