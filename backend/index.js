require("dotenv").config();

const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");
const express = require("express");
const swaggerUi = require("swagger-ui-express");

const { connect } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const swaggerDocument = require("./docs/swagger");

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");
const frontendIndexPath = path.join(frontendDistPath, "index.html");

connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/users", userRoutes);

app.get(/^(?!\/api).*/, (req, res) => {
  if (!fs.existsSync(frontendIndexPath)) {
    return res.status(503).send("React frontend is not built yet. Run `npm run build` in the project root.");
  }

  return res.sendFile(frontendIndexPath);
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
