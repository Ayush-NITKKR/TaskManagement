const Task = require("../model/Task");
const User = require("../model/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sanitizeText } = require("../utils/validation");

const isValidDateInput = (value) => !Number.isNaN(new Date(value).getTime());

const createTask = asyncHandler(async (req, res) => {
  const title = sanitizeText(req.body.title);
  const description = sanitizeText(req.body.description);
  const dueDate = req.body.dueDate;
  const studentId = sanitizeText(req.body.studentId);

  if (!title || !description || !dueDate || !studentId) {
    throw new ApiError(400, "Title, description, due date and student are required");
  }

  if (!isValidDateInput(dueDate)) {
    throw new ApiError(400, "Please provide a valid due date");
  }

  const student = await User.findById(studentId);

  if (!student || student.accountType !== "Student") {
    throw new ApiError(404, "Selected student was not found");
  }

  const task = await Task.create({
    title,
    description,
    dueDate,
    instructor: req.user._id,
    student: student._id,
  });

  const populatedTask = await Task.findById(task._id)
    .populate("student", "firstName lastName email")
    .populate("instructor", "firstName lastName email");

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    task: populatedTask,
  });
});

const getTasks = asyncHandler(async (req, res) => {
  const { status, studentId } = req.query;
  const filter = {};

  if (req.user.accountType === "Student") {
    filter.student = req.user._id;
  }

  if (req.user.accountType === "Instructor") {
    filter.instructor = req.user._id;

    if (studentId) {
      filter.student = studentId;
    }
  }

  if (status && ["Pending", "Completed"].includes(status)) {
    filter.status = status;
  }

  const tasks = await Task.find(filter)
    .populate("student", "firstName lastName email")
    .populate("instructor", "firstName lastName email")
    .sort({ dueDate: 1, createdAt: -1 });

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks,
  });
});

const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId)
    .populate("student", "firstName lastName email")
    .populate("instructor", "firstName lastName email");

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  const isInstructorOwner =
    req.user.accountType === "Instructor" &&
    String(task.instructor._id) === String(req.user._id);
  const isStudentOwner =
    req.user.accountType === "Student" &&
    String(task.student._id) === String(req.user._id);

  if (!isInstructorOwner && !isStudentOwner) {
    throw new ApiError(403, "You cannot access this task");
  }

  res.status(200).json({
    success: true,
    task,
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (String(task.instructor) !== String(req.user._id)) {
    throw new ApiError(403, "Only the instructor who created the task can update it");
  }

  if (req.body.title !== undefined) {
    const nextTitle = sanitizeText(req.body.title);

    if (!nextTitle) {
      throw new ApiError(400, "Task title cannot be empty");
    }

    task.title = nextTitle;
  }

  if (req.body.description !== undefined) {
    const nextDescription = sanitizeText(req.body.description);

    if (!nextDescription) {
      throw new ApiError(400, "Task description cannot be empty");
    }

    task.description = nextDescription;
  }

  if (req.body.dueDate !== undefined) {
    if (!isValidDateInput(req.body.dueDate)) {
      throw new ApiError(400, "Please provide a valid due date");
    }

    task.dueDate = req.body.dueDate;
  }

  if (req.body.studentId !== undefined) {
    const student = await User.findById(sanitizeText(req.body.studentId));

    if (!student || student.accountType !== "Student") {
      throw new ApiError(404, "Selected student was not found");
    }

    task.student = student._id;
  }

  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate("student", "firstName lastName email")
    .populate("instructor", "firstName lastName email");

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    task: populatedTask,
  });
});

const markTaskComplete = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (String(task.student) !== String(req.user._id)) {
    throw new ApiError(403, "Only the assigned student can complete this task");
  }

  task.status = "Completed";
  task.completedAt = new Date();
  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate("student", "firstName lastName email")
    .populate("instructor", "firstName lastName email");

  res.status(200).json({
    success: true,
    message: "Task marked as completed",
    task: populatedTask,
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  if (String(task.instructor) !== String(req.user._id)) {
    throw new ApiError(403, "Only the instructor who created the task can delete it");
  }

  await task.deleteOne();

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  markTaskComplete,
  deleteTask,
};
