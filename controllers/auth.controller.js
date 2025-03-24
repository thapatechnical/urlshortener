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
  generateRandomToken
} from "../services/auth.services.js";
import { registerUserSchema, loginUserSchema } from "../validators/auth.validator.js";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import { name } from "ejs";
import { is } from "drizzle-orm";

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

  const randomToken = generateRandomToken();

  await insertVerifyEmailToken({userId:req.user.id,token:randomToken});

  const verifyEmailLink = await createVerifyEmailLink({
    email: req.user.email,
    token: randomToken,
  });
}