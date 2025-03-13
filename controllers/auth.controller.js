import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";
import {
  authenticateUser,
  clearUserSession,
  comparePassword,
  createAccessToken,
  createRefreshToken,
  createSession,
  createUser,
  // generateToken,
  getUserByEmail,
  hashPassword,
} from "../services/auth.services.js";
import {
  loginUserSchema,
  registerUserSchema,
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
