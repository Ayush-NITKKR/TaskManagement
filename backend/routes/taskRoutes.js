const express = require("express");

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  markTaskComplete,
  deleteTask,
} = require("../controller/taskController");
const { auth, authorize } = require("../middleware/Auth");

const router = express.Router();

router.use(auth);

router.get("/", authorize("Student", "Instructor"), getTasks);
router.get("/:taskId", authorize("Student", "Instructor"), getTaskById);
router.post("/", authorize("Instructor"), createTask);
router.put("/:taskId", authorize("Instructor"), updateTask);
router.delete("/:taskId", authorize("Instructor"), deleteTask);
router.patch("/:taskId/complete", authorize("Student"), markTaskComplete);

module.exports = router;
