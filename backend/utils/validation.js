const validator = require("validator");

const sanitizeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return validator.escape(value.trim());
};

const sanitizeOptionalText = (value) => {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  return sanitizeText(value);
};

const validatePassword = (password) =>
  typeof password === "string" && password.length >= 6;

module.exports = {
  sanitizeText,
  sanitizeOptionalText,
  validatePassword,
};
