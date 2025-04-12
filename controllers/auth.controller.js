import {
  comparePassword,
  createAccessToken,
  createSession,
  createUser,
  generateToken,
  getUserByEmail,
  hashPassword,
  refreshTokens,
  authenticateUser,
  findUserById,
  getAllShortLinks,
  generateRandomToken,
  insertVerifyEmailToken,
  createVerifyEmailLink,
  verifyUserEmailAndUpdate,
  findVerificationEmailToken,
  clearVerifyEmailToken,
  sendNewVerifyEmailLink,
  updateUserPassword,
} from "../services/auth.services.js";
import { registerUserSchema, loginUserSchema, verifyEmailSchema, verifyPasswordSchema } from "../validators/auth.validator.js";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { name } from "ejs";
import { eq, is } from "drizzle-orm";
import { sendEmail } from "../lib/nodemailer.js";
import { db } from "../config/db.js";
import { usersTable } from "../drizzle/schema.js";

export const getRegisterPage = (req, res) => {
  if (req.user) return res.redirect("/");
  return res.render("../views/auth/register", { error: req.flash("error") });
};

export const postRegister = async (req, res) => {
  if (req.user) return res.redirect("/");

  const { name, email, password } = req.body;
  const { data, error } = registerUserSchema.safeParse(req.body);

  if (error) {
    req.flash("error", error.message);
    return res.redirect("/register");
  }

  const userExists = await getUserByEmail(email);

  if (userExists) {
    req.flash("error", "User already exists");
    return res.redirect("/register");
  }

  const hashedPassword = await hashPassword(password);
  const [user] = await createUser({ name, email, password: hashedPassword });

  // res.redirect("/login");
  await authenticateUser({
    req, res, user, name, email
  });

};

export const getLoginPage = (req, res) => {
  if (req.user) return res.redirect("/");
  return res.render("auth/login", { error: req.flash("error") });
};

export const postLogin = async (req, res) => {
  if (req.user) return res.redirect("/");

  const { email, password } = req.body;
  const { data, error } = loginUserSchema.safeParse(req.body);

  if (error) {
    req.flash("error", error.message);
    return res.redirect("/login");
  }

  const user = await getUserByEmail(email);

  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/login");
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    req.flash("error", "Invalid email or password");
    return res.redirect("/login");
  }

  // Create a session for the user
  await authenticateUser({
    req, res, user
  });

  res.redirect("/");
};

export const getMe = (req, res) => {
  if (!req.user) return res.send("Not logged in");
  return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
};

export const logoutUser = (req, res) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.redirect("/login");
};

//get edit profile
export const getEditProfilePage = async (req, res) => {
  if(!req.user) return res.redirect("/");

  const user = await findUserById(req.user.id);

  if(!user) return res.status(404).send("User not found");

  res.render("auth/edit-profile",{
    name:user.name,
    email:user.email,
    isEmailValid:user.isEmailValid,
    createdAt:user.createdAt,
    links:user.links,
    
    
    error: req.flash("error"),
  })
}

//edit profile
export const postEditProfile = async (req, res) => {
  if(!req.user) return res.redirect("/");

  const {name} = req.body;

  await findUserById(req.user.id).then(async (user) => {
    if(!user) return res.status(404).send("User not found");

    user.name = name;

    await db.update(usersTable)
    .set(user)
    .where(eq(usersTable.id, user.id))
    .then(() => {
      res.redirect("/profile");
    })
  })
}

// get profile page

export const getProfilePage = async (req, res) => {
    if(!req.user) return res.send("Not logged in");

    const user = await findUserById(req.user.id);

    if(!user) return res.redirect("/login");

    const userShortLinks = await getAllShortLinks(user.id);

    return res.render("auth/profile",{
      user:{
        id    : user.id,
        name  : user.name,
        email : user.email,
        isEmailValid : user.isEmailValid,
        createdAt : user.createdAt,
        links: userShortLinks,
      }
    })
}


//getChangePasswordPage

export const getChangePasswordPage = async (req, res) => {
  if(!req.user) return res.redirect("/");

  const user = await findUserById(req.user.id);

  res.render("auth/change-password",{
    error: req.flash("error"),
  })
}

//postChangePassword


export const postChangePassword = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  // Debug: Log the incoming request body
  console.log("Request body:", req.body);

  // Validate input
  const validation = verifyPasswordSchema.safeParse(req.body);
  
  if (!validation.success) {
    const errorMessages = validation.error.issues.map((issue) => issue.message);
    req.flash("error", errorMessages);
    return res.redirect("/change-password");
  }

  // Destructure from validated data
  const { currentPassword, newPassword, confirmPassword } = validation.data;

  // Debug: Verify we have the password
  console.log("New password received:", newPassword ? "exists" : "missing");

  const user = await findUserById(req.user.id);
  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/change-password");
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isPasswordValid) {
    req.flash("error", "Invalid current password");
    return res.redirect("/change-password");
  }

  try {
    // Update password
    await updateUserPassword({userId:user.id, newPassword});
    req.flash("success", "Password changed successfully");
    return res.redirect("/profile");
  } catch (err) {
    console.error("Password change error:", err);
    req.flash("error", "Failed to update password");
    return res.redirect("/change-password");
  }
};

// get verify email page

export const getVerifyEmailPage = async (req, res) => {
  // if(!req.user || req.user.isEmailValid) return res.redirect("/");

  if(!req.user) return res.redirect("/login");

  const user = await findUserById(req.user.id);

  if(!user || user.isEmailValid) return res.redirect("/");

  return res.render("auth/verify-email",{

    email: req.user.email,
  });
}

// resend verification link

export const resendVerificationLink = async (req, res) => {

  if(!req.user) return res.redirect("/");

  const user = await findUserById(req.user.id);

  if(!user || user.isEmailValid) return res.redirect("/");

  await sendNewVerifyEmailLink({email: user.email, userId: user.id});

  res.redirect("/verify-email");
}

// verifyEmailToken 

export const verifyEmailToken = async (req, res) => {
  const { data, error } = verifyEmailSchema.safeParse(req.query); // Note: changed from req.body to req.query
  
  if (error) {
    return res.send("Verification link invalid - schema validation failed");
  }

  const token = await findVerificationEmailToken(data);
  
  if (!token) {
    return res.send("Verification link invalid - token not found or expired");
  }

  await verifyUserEmailAndUpdate(token.userId);
  
  await clearVerifyEmailToken(token.email);

  // Refresh user session if they're logged in
  if (req.user && req.user.id === token.userId) {
    // You might want to regenerate the tokens here
  }

  return res.redirect("/profile");
};