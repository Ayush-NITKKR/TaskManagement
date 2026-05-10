module.exports = {
  openapi: "3.0.0",
  info: {
    title: "Ed Tech Task Platform API",
    version: "1.0.0",
    description:
      "Student and instructor platform APIs for authentication, task assignment, progress tracking, and student filtering.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["firstName", "email", "phoneNo", "password", "confirmPassword", "accountType", "otp"],
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          phoneNo: { type: "string" },
          password: { type: "string" },
          confirmPassword: { type: "string" },
          accountType: { type: "string", enum: ["Student", "Instructor"] },
          otp: { type: "string" },
        },
      },
      SendOtpRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string" },
          password: { type: "string" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["email", "otp", "password", "confirmPassword"],
        properties: {
          email: { type: "string" },
          otp: { type: "string" },
          password: { type: "string" },
          confirmPassword: { type: "string" },
        },
      },
      TaskRequest: {
        type: "object",
        required: ["title", "description", "dueDate", "studentId"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          dueDate: { type: "string", format: "date-time" },
          studentId: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/api/v1/auth/register/send-otp": {
      post: {
        summary: "Send registration OTP to email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendOtpRequest" },
            },
          },
        },
        responses: {
          200: { description: "OTP sent" },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        summary: "Register a student or instructor",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          201: { description: "User created" },
        },
      },
    },
    "/api/v1/auth/forgot-password/send-otp": {
      post: {
        summary: "Send forgot password OTP to email",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendOtpRequest" },
            },
          },
        },
        responses: {
          200: { description: "OTP sent" },
        },
      },
    },
    "/api/v1/auth/forgot-password/reset": {
      post: {
        summary: "Reset password using email OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResetPasswordRequest" },
            },
          },
        },
        responses: {
          200: { description: "Password reset" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        summary: "Login a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: { description: "Logged in" },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        summary: "Get current user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Current user returned" },
        },
      },
    },
    "/api/v1/users/students": {
      get: {
        summary: "Get all students for instructor filters",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Students returned" },
        },
      },
    },
    "/api/v1/tasks": {
      get: {
        summary: "Get tasks based on role",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Tasks returned" },
        },
      },
      post: {
        summary: "Create a task as instructor",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TaskRequest" },
            },
          },
        },
        responses: {
          201: { description: "Task created" },
        },
      },
    },
    "/api/v1/tasks/{taskId}/complete": {
      patch: {
        summary: "Mark a task as completed as student",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "taskId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Task completed" },
        },
      },
    },
  },
};
