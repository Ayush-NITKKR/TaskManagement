const express = require("express");

const {
  sendRegistrationOtp,
  register,
  sendForgotPasswordOtp,
  resetPassword,
  login,
  logout,
  getMe,
} = require("../controller/authController");
const { auth } = require("../middleware/Auth");

const router = express.Router();

router.post("/register/send-otp", sendRegistrationOtp);
router.post("/register", register);
router.post("/forgot-password/send-otp", sendForgotPasswordOtp);
router.post("/forgot-password/reset", resetPassword);
router.post("/login", login);
router.post("/logout", auth, logout);
router.get("/me", auth, getMe);

module.exports = router;
