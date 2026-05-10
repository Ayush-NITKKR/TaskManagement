const jwt = require("jsonwebtoken");

const ApiError = require("../utils/ApiError");
const User = require("../model/User");

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  return null;
};

const auth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      throw new ApiError(401, "Authentication token is missing");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id).select("-password");

    if (!currentUser) {
      throw new ApiError(401, "User linked to token no longer exists");
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error.name === "JsonWebTokenError" || error.name === "TokenExpiredError"
      ? new ApiError(401, "Invalid or expired token")
      : error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, "Authentication required"));
  }

  if (!roles.includes(req.user.accountType)) {
    return next(new ApiError(403, "You are not allowed to perform this action"));
  }

  return next();
};

module.exports = {
  auth,
  authorize,
};
