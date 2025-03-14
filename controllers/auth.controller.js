import { name } from "ejs";
import {
  comparePassword,
  createAccessToken,
  
  createSession,
  createUser,
  generateToken,
  getUserByEmail,
  hashPassword,
  refreshTokens,
  
} from "../services/auth.services.js";
import { registerUserSchema, loginUserSchema } from "../validators/auth.validator.js";
import { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";

export const getRegisterPage = (req, res) => {
  if (req.user) return res.redirect("/");

  return res.render("../views/auth/register", { error: req.flash("error") });
};

export const postRegister = async (req, res) => {
  if (req.user) return res.redirect("/");

  // console.log(req.body);
  const { name, email, password } = req.body;

 const {data, error} = registerUserSchema.safeParse(req.body);
 console.log("data", data);
 
  if (error) {
    const errors = error.errors.map((err) => err.message);
    req.flash("error", error.message);
    return res.redirect("/register");
  }

  const userExists = await getUserByEmail(email);
  console.log("userExists ", userExists);

  // if (userExists) return res.redirect("/register");

  if(userExists){
    req.flash("error", "User already exists");
    return res.redirect("/register");
  }

  const hashedPassword = await hashPassword(password);

  const [user] = await createUser({ name, email, password: hashedPassword });
  console.log(user);

  res.redirect("/login");
};

export const getLoginPage = (req, res) => {
  if (req.user) return res.redirect("/");

  return res.render("auth/login", { error: req.flash("error") });
};

export const postLogin = async (req, res) => {
  if (req.user) return res.redirect("/");

  const { email, password } = req.body;
  const{data, error} = loginUserSchema.safeParse(req.body);
  console.log("data", data);

  if (error) {
    const errors = error.errors[0].message;
    req.flash("error", error.message);
    return res.redirect("/login");
  }

  const user = await getUserByEmail(email);
  console.log("user email", user);

  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/login");
  } 



  //todo bcrypt.compare(plainTextPassword, hashedPassword);
  const isPasswordValid = await comparePassword(password, user.password);

  // if (user.password !== password) return res.redirect("/login");
  if (!isPasswordValid){
    req.flash("error", "Invalid email or password");
    return res.redirect("/login");
  } 

  // res.cookie("isLoggedIn", true);

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
  });

  // res.cookie("access_token", token);

  // we need to create a sessions 
 const session = await createSession(user.id,{
  ip: req.clientIp,
  userAgent : req.headers["user-agent"],
 } 
);

const accessToken = createAccessToken({
  id:user.id,
  name:user.name,
  email:user.email,
  sessionId:session.id,
})

res.cookie("access_token",token);


const refreshToken = refreshTokens(session.id);

const baseConfig = { httpOnly:true, secure:true };

res.cookie("access_token", accessToken,{
  ...baseConfig,
  maxAge:ACCESS_TOKEN_EXPIRY,
});

res.cookie("refresh_token", refreshToken,{
  ...baseConfig,
  maxAge:REFRESH_TOKEN_EXPIRY,
});

  res.redirect("/");
};

// Do You Need to Set Path=/ Manually?
//    ✅ cookie-parser and Express automatically set the path to / by default.

// export const getMe = (req, res) => {
//   if (!req.user) return res.send("Not logged in");
//   return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
// };

export const getMe = (req, res) => {
  if (!req.user) return res.send("Not logged in");
  return res.send(`<h1>Hey ${req.user.name} - ${req.user.email}</h1>`);
}

export const logoutUser = (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/login");
};