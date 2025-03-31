import { getHtmlFromMjmlTemplate } from "../lib/get-html-from-mjml-template.js";
import { sendEmail } from "../lib/send-email.js";
import {
  authenticateUser,
  clearResetPasswordToken,
  clearUserSession,
  clearVerifyEmailTokens,
  comparePassword,
  createAccessToken,
  createRefreshToken,
  createResetPasswordLink,
  createSession,
  createUser,
  createVerifyEmailLink,
  findUserByEmail,
  findUserById,
  findVerificationEmailToken,
  generateRandomToken,
  getAllShortLinks,
  getResetPasswordToken,
  // generateToken,
  getUserByEmail,
  hashPassword,
  insertVerifyEmailToken,
  sendNewVerifyEmailLink,
  updateUserByName,
  updateUserPassword,
  verifyUserEmailAndUpdate,
} from "../services/auth.services.js";
import {
  forgotPasswordSchema,
  loginUserSchema,
  registerUserSchema,
  verifyEmailSchema,
  verifyPasswordSchema,
  verifyResetPasswordSchema,
  verifyUserSchema,
} from "../validators/auth-validator.js";

export const getRegisterPage = (req, res) => {
  if (req.user) return res.redirect("/");

  return res.render("../views/auth/register", { errors: req.flash("errors") });
};

// when the user register and click on register button
export const postRegister = async (req, res) => {
  if (req.user) return res.redirect("/");

  // console.log(req.body);
  // const { name, email, password } = req.body;
  const { data, error } = registerUserSchema.safeParse(req.body);

  if (error) {
    const errorMessage = error.errors[0].message;
    req.flash("errors", errorMessage);
    return res.redirect("/");
  }

  const { name, email, password } = data;

  const userExists = await getUserByEmail(email);
  console.log("userExists ", userExists);

  // if (userExists)  return res.redirect("/register");
  if (userExists) {
    req.flash("errors", "User already exists");
    return res.redirect("/register");
  }

  const hashedPassword = await hashPassword(password);

  const [user] = await createUser({ name, email, password: hashedPassword });
  console.log("user register", user);

  // res.redirect("/login");

  await authenticateUser({ req, res, user, name, email });

  await sendNewVerifyEmailLink({ email, userId: user.id });

  res.redirect("/");
};

export const getLoginPage = (req, res) => {
  if (req.user) return res.redirect("/");

  return res.render("auth/login", { errors: req.flash("errors") });
};

export const postLogin = async (req, res) => {
  if (req.user) return res.redirect("/");

  // const { email, password } = req.body;
  const { data, error } = loginUserSchema.safeParse(req.body);

  if (error) {
    const errorMessage = error.errors[0].message;
    req.flash("errors", errorMessage);
    return res.redirect("/");
  }

  const { email, password } = data;

  const user = await getUserByEmail(email);
  console.log("user email", user);

  if (!user) {
    req.flash("errors", "Invalid Email or Password");
    return res.redirect("/login");
  }

  //todo bcrypt.compare(plainTextPassword, hashedPassword);
  const isPasswordValid = await comparePassword(password, user.password);

  // if (user.password !== password) return res.redirect("/login");
  if (!isPasswordValid) {
    req.flash("errors", "Invalid email or password");
    return res.redirect("/login");
  }

  // res.cookie("isLoggedIn", true);

  // const token = generateToken({
  //   id: user.id,
  //   name: user.name,
  //   email: user.email,
  // });

  // res.cookie("access_token", token);

  // we need to create a sessions
  await authenticateUser({ req, res, user });

  res.redirect("/");
};

// Do You Need to Set Path=/ Manually?
//    ✅ cookie-parser and Express automatically set the path to / by default.

export const getMe = (req, res) => {
  if (!req.user) return res.send("Not logged in");
  return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
};

export const logoutUser = async (req, res) => {
  await clearUserSession(req.user.sessionId);

  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.redirect("/login");
};

// /getProfilePage
export const getProfilePage = async (req, res) => {
  if (!req.user) return res.send("Not logged in");

  const user = await findUserById(req.user.id);
  if (!user) return res.redirect("/login");

  const userShortLinks = await getAllShortLinks(user.id);

  return res.render("auth/profile", {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isEmailValid: user.isEmailValid,
      createdAt: user.createdAt,
      links: userShortLinks,
    },
  });
};

//getVerifyEmailPage
export const getVerifyEmailPage = async (req, res) => {
  // if (!req.user || req.user.isEmailValid) return res.redirect("/");

  if (!req.user) return res.redirect("/");

  const user = await findUserById(req.user.id);

  if (!user || user.isEmailValid) return res.redirect("/");

  return res.render("auth/verify-email", {
    email: req.user.email,
  });
};

//resendVerificationLink
export const resendVerificationLink = async (req, res) => {
  if (!req.user) return res.redirect("/");
  const user = await findUserById(req.user.id);
  if (!user || user.isEmailValid) return res.redirect("/");

  await sendNewVerifyEmailLink({ email: req.user.email, userId: req.user.id });

  res.redirect("/verify-email");
};

// /verifyEmailToken

export const verifyEmailToken = async (req, res) => {
  const { data, error } = verifyEmailSchema.safeParse(req.query);
  if (error) {
    return res.send("Verification link invalid or expired!");
  }

  // const token = await findVerificationEmailToken(data); // without joins
  const [token] = await findVerificationEmailToken(data); // with joins
  console.log("🚀 ~ verifyEmailToken ~ token̥:", token);
  if (!token) res.send("Verification link invalid or expired!");
  // 1: token - same
  // 2: expire
  // 3: userId - email find

  await verifyUserEmailAndUpdate(token.email);
  // 1: to find email - vupdate the is emial ValidityState

  // clearVerifyEmailTokens(token.email).catch(console.error);
  clearVerifyEmailTokens(token.userId).catch(console.error);

  return res.redirect("/profile");
};

//getEditProfilePage
export const getEditProfilePage = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const user = await findUserById(req.user.id);
  if (!user) return res.status(404).send("User not found");

  return res.render("auth/edit-profile", {
    username: user.name,
    errors: req.flash("errors"),
  });
};

//postEditProfile
export const postEditProfile = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const { data, error } = verifyUserSchema.safeParse(req.body);
  if (error) {
    const errorMessage = error.errors[0].message;
    req.flash("errors", errorMessage);
    return res.redirect("/");
  }
  await updateUserByName({ userId: req.user.id, name: data.name });

  return res.redirect("/profile");
};

//getChangePasswordPage
export const getChangePasswordPage = async (req, res) => {
  if (!req.user) return res.redirect("/");
  return res.render("auth/change-password", {
    errors: req.flash("errors"),
  });
};

//postChangePassword
export const postChangePassword = async (req, res) => {
  if (!req.user) return res.redirect("/");

  const { data, error } = verifyPasswordSchema.safeParse(req.body);
  if (error) {
    const errorMessage = error.errors[0].message;
    req.flash("errors", errorMessage);
    return res.redirect("/change-password");
  }

  const { currentPassword, newPassword } = data;

  const user = await findUserById(req.user.id);
  if (!user) {
    req.flash("errors", "Invalid password");
    return res.redirect("/change-password");
  }

  const isPasswordValid = comparePassword(currentPassword, user.password);
  if (!isPasswordValid) {
    req.flash("errors", "Current Password that you entered is invalid");
    return res.redirect("auth/change-password");
  }

  await updateUserPassword({ userId: user.id, newPassword });

  return res.redirect("/profile");
};

// /getResetPasswordPage

export const getResetPasswordPage = async (req, res) => {
  return res.render("auth/forgot-password", {
    formSubmitted: req.flash("formSubmitted")[0],
    errors: req.flash("errors"),
  });
};

//postForgotPassword
export const postForgotPassword = async (req, res) => {
  const { data, error } = forgotPasswordSchema.safeParse(req.body);

  if (error) {
    const errorMessages = error.errors.map((err) => err.message);
    req.flash("errors", errorMessages[0]);
    return res.redirect("/reset-password");
  }

  const user = await findUserByEmail(data.email);

  if (user) {
    const resetPasswordLink = await createResetPasswordLink({
      userId: user.id,
    });

    const html = await getHtmlFromMjmlTemplate("reset-password-email", {
      name: user.name,
      link: resetPasswordLink,
    });

    sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      html,
    });
  }

  req.flash("formSubmitted", true);
  return res.redirect("/reset-password");
};

//getResetPasswordTokenPage
export const getResetPasswordTokenPage = async (req, res) => {
  const { token } = req.params;
  const passwordResetData = await getResetPasswordToken(token);
  if (!passwordResetData) return res.render("auth/wrong-reset-password-token");

  return res.render("auth/reset-password", {
    formSubmitted: req.flash("formSubmitted")[0],
    errors: req.flash("errors"),
    token,
  });
};

//! Extract password reset token from request parameters.
//! Validate token authenticity, expiration, and match with a previously issued token.
//! If valid, get new password from request body and validate using a schema (e.g., Zod) for complexity.
//! Identify user ID linked to the token.
//! Invalidate all existing reset tokens for that user ID.
//! Hash the new password with a secure algorithm .
//! Update the user's password in the database with the hashed version.
//! Redirect to login page or return a success response.

//postResetPasswordToken
export const postResetPasswordToken = async (req, res) => {
  const { token } = req.params;
  const passwordResetData = await getResetPasswordToken(token);
  if (!passwordResetData) {
    req.flash("errors", "Password Token is not matching");
    return res.render("auth/wrong-reset-password-token");
  }

  const { data, error } = verifyResetPasswordSchema.safeParse(req.body);
  if (error) {
    const errorMessages = error.errors.map((err) => err.message);
    req.flash("errors", errorMessages[0]);
    res.redirect(`/reset-password/${token}`);
  }

  const { newPassword } = data;

  const user = await findUserById(passwordResetData.userId);

  await clearResetPasswordToken(user.id);

  await updateUserPassword({ userId: user.id, newPassword });

  return res.redirect("/login");
};
