import { Router } from "express";
import * as authControllers from "../controllers/auth.controller.js";

const router = Router();

// router.get("/register", authControllers.getRegisterPage);
// // router.get("/login", authControllers.getLoginPage);
// // router.post("/login", authControllers.postLogin);

router
  .route("/register")
  .get(authControllers.getRegisterPage)
  .post(authControllers.postRegister);

router
  .route("/login")
  .get(authControllers.getLoginPage)
  .post(authControllers.postLogin);

router.route("/me").get(authControllers.getMe);

router.route("/profile").get(authControllers.getProfilePage);

router.route("/verify-email").get(authControllers.getVerifyEmailPage);

router.route("/resend-verification-link").post(authControllers.resendVerificationLink);

router
  .route("/verify-email-token")
  .get(authControllers.verifyEmailToken)

router.route("/edit-profile").get(authControllers.getEditProfilePage).post(authControllers.postEditProfile);

router.route("/change-password").get(authControllers.getChangePasswordPage).post(authControllers.postChangePassword);

router.route("/reset-password").get(authControllers.getResetPasswordPage).post(authControllers.postForgotPassword);

router.route("/reset-password/:token").get(authControllers.getResetPasswordTokenPage).post(authControllers.postResetPasswordToken);

router.route("/google").get(authControllers.getGoogleLoginPage);

router.route("/google/callback").get(authControllers.getGoogleLoginCallback);

router.route("/logout").get(authControllers.logoutUser);

export const authRoutes = router;
