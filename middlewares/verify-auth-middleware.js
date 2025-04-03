import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constants.js";
import { refreshTokens, verifyJWTToken } from "../services/auth.services.js";

// export const verifyAuthentication = (req, res, next) => {
//   const token = req.cookies.access_token;
//   if (!token) {
//     req.user = null;
//     return next();
//   }

//   try {
//     const decodedToken = verifyJWTToken(token);
//     req.user = decodedToken;
//     console.log(`req.user:`, req.user);
//   } catch (error) {
//     req.user = null;
//   }

//   return next();
// };

// ✔️ You can add any property to req, but:

// Avoid overwriting existing properties.
// Use req.user for authentication.
// Group custom properties under req.custom if needed.
// Keep the data lightweight.

export const verifyAuthentication = async (req, res, next) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;

  req.user = null;

  if (!accessToken && !refreshToken) {
    return next();
  }

  if (accessToken) {
    const decodedToken = verifyJWTToken(accessToken);
    req.user = decodedToken;
    return next();
  }

  if (refreshToken) {
    try {
      const { newAccessToken, newRefreshToken, user } = await refreshTokens(
        refreshToken
      );

      req.user = user;

      const baseConfig = { httpOnly: true, secure: true };

      res.cookie("access_token", newAccessToken, {
        ...baseConfig,
        maxAge: ACCESS_TOKEN_EXPIRY,
      });

      res.cookie("refresh_token", newRefreshToken, {
        ...baseConfig,
        maxAge: REFRESH_TOKEN_EXPIRY,
      });

      return next();
    } catch (error) {
      console.log(error.message);
    }
  }

  return next();
};
