import { Google } from "arctic";
import { env } from "../../config/env.js";

export const google = new Google(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/google/callback" // We will create this route to verify after login
);
