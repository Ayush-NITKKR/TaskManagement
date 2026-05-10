const User = require("../model/User");
const asyncHandler = require("../utils/asyncHandler");

const getStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ accountType: "Student" })
    .select("firstName lastName email phoneNo")
    .sort({ firstName: 1, lastName: 1 });

  res.status(200).json({
    success: true,
    students,
  });
});

module.exports = {
  getStudents,
};
