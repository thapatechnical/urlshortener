import {
  comparePassword,
  createUser,
  getUserByEmail,
  hashPassword,
} from "../services/auth.services.js";

export const getRegisterPage = (req, res) => {
  return res.render("../views/auth/register");
};

export const postRegister = async (req, res) => {
  // console.log(req.body);
  const { name, email, password } = req.body;

  const userExists = await getUserByEmail(email);
  console.log("userExists ", userExists);

  if (userExists) return res.redirect("/register");

  const hashedPassword = await hashPassword(password);

  const [user] = await createUser({ name, email, password: hashedPassword });
  console.log(user);

  res.redirect("/login");
};

export const getLoginPage = (req, res) => {
  return res.render("auth/login");
};

export const postLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);
  console.log("user ", user);

  if (!user) return res.redirect("/login");
  //todo bcrypt.compare(plainTextPassword, hashedPassword);
  const isPasswordValid = await comparePassword(password, user.password);

  // if (user.password !== password) return res.redirect("/login");
  if (!isPasswordValid) return res.redirect("/login");

  res.cookie("isLoggedIn", true);
  res.redirect("/");
};

// Do You Need to Set Path=/ Manually?
//    ✅ cookie-parser and Express automatically set the path to / by default.
