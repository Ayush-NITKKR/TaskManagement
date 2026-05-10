const express = require("express");

const { getStudents } = require("../controller/userController");
const { auth, authorize } = require("../middleware/Auth");

const router = express.Router();

router.get("/students", auth, authorize("Instructor"), getStudents);

module.exports = router;
