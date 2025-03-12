import express from "express";
import { shortenerRoutes } from "./routes/shortener.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import { verifyAuthentication } from "./middlewares/verify-auth-middleware.js";
import session from "express-session";
import flash from "connect-flash";
import requestIp from "request-ip"


const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
// app.set("views", "./views")

app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: false,
  })
);
app.use(flash());

app.use(cookieParser());

app.use(requestIp.mw());

// This must be after cookieParser middleware.
app.use(verifyAuthentication);

app.use((req, res, next) => {
  res.locals.user = req.user;
  return next();
});

// How It Works:
// This middleware runs on every request before reaching the route handlers.
//? res.locals is an object that persists throughout the request-response cycle.
//? If req.user exists (typically from authentication, like Passport.js), it's stored in res.locals.user.
//? Views (like EJS, Pug, or Handlebars) can directly access user without manually passing it in every route.

// express router 
// app.use(router);
app.use(authRoutes);
app.use(shortenerRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
