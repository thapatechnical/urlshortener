import { verifyJWTToken } from "../services/auth.services.js";

export const verifyAuthentication = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decodedToken = verifyJWTToken(token);
    req.user = decodedToken;
    console.log(`req.user:`, req.user);
  } catch (error) {
    req.user = null;
  }

  return next();
};

// ✔️ You can add any property to req, but:

// Avoid overwriting existing properties.
// Use req.user for authentication.
// Group custom properties under req.custom if needed.
// Keep the data lightweight.
