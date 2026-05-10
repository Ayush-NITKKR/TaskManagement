const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const validator = require("validator");

const Profile = require("../model/Profile");
const User = require("../model/User");
const OTP = require("../model/otp");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const mailSender = require("../utils/mailSender");
const { sanitizeOptionalText, sanitizeText, validatePassword } = require("../utils/validation");

const REGISTRATION_OTP = "registration";
const RESET_PASSWORD_OTP = "reset-password";

const createToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      accountType: user.accountType,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 2 * 60 * 60 * 1000,
  });
};

const buildPublicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phoneNo: user.phoneNo,
  accountType: user.accountType,
  image: user.image,
  createdAt: user.createdAt,
});

const generateOtp = () =>
  otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

const sendOtpEmail = async ({ email, otp, purpose }) => {
  const emailContent =
    purpose === REGISTRATION_OTP
      ? {
          title: "Verify your email for EdTech Task Platform",
          body: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Email Verification</h2>
              <p>Your OTP for account registration is:</p>
              <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
              <p>This OTP will expire in 5 minutes.</p>
            </div>
          `,
        }
      : {
          title: "Reset your EdTech Task Platform password",
          body: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Password Reset</h2>
              <p>Your OTP for password reset is:</p>
              <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
              <p>This OTP will expire in 5 minutes.</p>
            </div>
          `,
        };

  await mailSender(email, emailContent.title, emailContent.body);
};

const createAndSendOtp = async ({ email, purpose }) => {
  let otp = generateOtp();
  let existingOtp = await OTP.findOne({ email, otp, purpose });

  while (existingOtp) {
    otp = generateOtp();
    existingOtp = await OTP.findOne({ email, otp, purpose });
  }

  await OTP.deleteMany({ email, purpose });
  await OTP.create({ email, otp, purpose });
  await sendOtpEmail({ email, otp, purpose });
};

const verifyOtpOrThrow = async ({ email, otp, purpose }) => {
  const latestOtp = await OTP.findOne({ email, purpose }).sort({ createdAt: -1 });

  if (!latestOtp) {
    throw new ApiError(400, "OTP not found or expired");
  }

  if (String(latestOtp.otp) !== String(otp)) {
    throw new ApiError(400, "Invalid OTP");
  }

  await OTP.deleteMany({ email, purpose });
};

const sendRegistrationOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!validator.isEmail(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  await createAndSendOtp({ email, purpose: REGISTRATION_OTP });

  res.status(200).json({
    success: true,
    message: "Registration OTP sent to your email",
  });
});

const register = asyncHandler(async (req, res) => {
  const firstName = sanitizeText(req.body.firstName);
  const lastName = sanitizeOptionalText(req.body.lastName) || firstName;
  const email = String(req.body.email || "").trim().toLowerCase();
  const phoneNo = sanitizeText(req.body.phoneNo);
  const password = String(req.body.password || "");
  const confirmPassword = String(req.body.confirmPassword || "");
  const accountType = sanitizeText(req.body.accountType);
  const otp = String(req.body.otp || "").trim();

  const allowedRoles = ["Student", "Instructor"];

  if (!firstName || !email || !phoneNo || !password || !confirmPassword || !accountType || !otp) {
    throw new ApiError(400, "All registration fields including OTP are required");
  }

  if (!validator.isEmail(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  if (!validator.isMobilePhone(phoneNo, "any")) {
    throw new ApiError(400, "Please provide a valid phone number");
  }

  if (!allowedRoles.includes(accountType)) {
    throw new ApiError(400, "Only Student or Instructor accounts can be created here");
  }

  if (!validatePassword(password)) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and confirm password must match");
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { phoneNo }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email or phone number already exists");
  }

  await verifyOtpOrThrow({ email, otp, purpose: REGISTRATION_OTP });

  const hashedPassword = await bcrypt.hash(password, 10);
  const profile = await Profile.create({
    about: `${accountType} account`,
  });

  const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    `${firstName} ${lastName}`
  )}`;

  const user = await User.create({
    firstName,
    lastName,
    email,
    phoneNo,
    password: hashedPassword,
    accountType,
    additionalDetails: profile._id,
    image: avatar,
  });

  const token = createToken(user);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    token,
    user: buildPublicUser(user),
  });
});

const sendForgotPasswordOtp = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!validator.isEmail(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "No account found with this email");
  }

  await createAndSendOtp({ email, purpose: RESET_PASSWORD_OTP });

  res.status(200).json({
    success: true,
    message: "Password reset OTP sent to your email",
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const otp = String(req.body.otp || "").trim();
  const password = String(req.body.password || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!email || !otp || !password || !confirmPassword) {
    throw new ApiError(400, "Email, OTP, password and confirm password are required");
  }

  if (!validator.isEmail(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  if (!validatePassword(password)) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and confirm password must match");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "No account found with this email");
  }

  await verifyOtpOrThrow({ email, otp, purpose: RESET_PASSWORD_OTP });

  user.password = await bcrypt.hash(password, 10);
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = createToken(user);
  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    token,
    user: buildPublicUser(user),
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: buildPublicUser(req.user),
  });
});

module.exports = {
  sendRegistrationOtp,
  register,
  sendForgotPasswordOtp,
  resetPassword,
  login,
  logout,
  getMe,
};
