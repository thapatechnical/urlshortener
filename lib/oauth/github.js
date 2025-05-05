import { GitHub } from "arctic";
import { env } from "../../config/env.js";

export const github = new GitHub(
  env.GITHUB_CLIENT_ID,
  env.GITHUB_CLIENT_SECRET,
  `${env.FRONTEND_URL}/github/callback`
);
