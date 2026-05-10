# EdTech Task Platform

EdTech Task Platform is a full-stack student and instructor workflow system where instructors assign tasks, students complete them, and progress can be tracked through a role-based dashboard. The project is organized as a clean `frontend` and `backend` structure and already includes authentication, email OTP verification, protected APIs, Swagger docs, and a React interface.

## Project Goals

- Give instructors a simple workflow to assign and manage work
- Give students a focused dashboard to view and complete tasks
- Keep the backend secure, modular, and easy to extend
- Prepare the platform for future scaling, production deployment, and feature growth

## Current Stack

### Frontend

- React
- Vite
- Custom CSS theme

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication
- Nodemailer for OTP email delivery
- Swagger for API documentation

## Folder Structure

```text
Ed tech/
  backend/
    config/
    controller/
    docs/
    middleware/
    model/
    routes/
    utils/
  frontend/
    src/
```

## Core Features Implemented

- User registration with email OTP verification
- Login with JWT authentication
- Forgot password with OTP verification by email
- Role-based access for `Student` and `Instructor`
- Instructor task creation, update, delete, and filtering
- Student task completion workflow
- Protected dashboard UI
- Swagger API docs at `/api-docs`

## End-to-End Functionalities Explained

This section explains what each major feature does and how it works internally in the backend.

### 1. Registration OTP Flow

Purpose:

- Prevent fake registrations
- Ensure the email belongs to the user
- Make signup safer before the user record is created

How it works internally:

1. The frontend sends the email to `POST /api/v1/auth/register/send-otp`.
2. The backend validates that the email format is correct.
3. The backend checks that no user already exists with that email.
4. A 6-digit OTP is generated.
5. Any previous registration OTP for the same email is removed.
6. A new OTP document is stored in MongoDB with:
   - email
   - otp
   - purpose = `registration`
   - TTL expiry of 5 minutes
7. Nodemailer sends the OTP email.
8. The API returns success so the frontend can show “OTP sent”.

Example request:

```json
{
  "email": "ayushtiwarikeexam@gmail.com"
}
```

Example success response:

```json
{
  "success": true,
  "message": "Registration OTP sent to your email"
}
```

Example email result:

- Subject: `Verify your email for EdTech Task Platform`
- Body contains the 6-digit OTP
- OTP expires in 5 minutes

### 2. Registration Flow

Purpose:

- Create a verified student or instructor account

How it works internally:

1. The frontend submits registration details plus the OTP.
2. The backend validates:
   - required fields
   - email format
   - phone number format
   - password length
   - password and confirm password match
   - account type is `Student` or `Instructor`
3. The backend checks for duplicate email or phone number.
4. The backend finds the latest OTP for that email and purpose `registration`.
5. The OTP is matched with the submitted OTP.
6. If valid, the OTP records for that email and purpose are deleted.
7. The password is hashed using `bcrypt`.
8. A profile document is created first.
9. The user document is created with:
   - first name
   - last name
   - email
   - phone number
   - hashed password
   - role
   - profile reference
   - generated avatar URL
10. A JWT token is generated.
11. The token is returned in JSON and also stored in an `httpOnly` cookie.

Example request:

```json
{
  "firstName": "ayush",
  "lastName": "tiw",
  "email": "ayushtiwarikeexam@gmail.com",
  "phoneNo": "1234567890",
  "password": "12345679",
  "confirmPassword": "12345679",
  "accountType": "Student",
  "otp": "601721"
}
```

Example success response:

```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "jwt-token-value",
  "user": {
    "id": "6a0080d6d800f2385df54ad6",
    "firstName": "ayush",
    "lastName": "tiw",
    "email": "ayushtiwarikeexam@gmail.com",
    "phoneNo": "1234567890",
    "accountType": "Student",
    "image": "https://api.dicebear.com/7.x/initials/svg?seed=ayush%20tiw",
    "createdAt": "2026-05-10T12:57:58.120Z"
  }
}
```

### 3. Login Flow

Purpose:

- Authenticate an existing user and start a protected session

How it works internally:

1. The frontend sends email and password to `POST /api/v1/auth/login`.
2. The backend validates both fields are present.
3. The backend looks up the user by email.
4. If no user is found, a 401 response is returned.
5. If the user exists, the plaintext password is compared against the stored bcrypt hash.
6. If the password is correct:
   - JWT payload is created with user id, email, and account type
   - JWT is signed with `JWT_SECRET`
   - token is set in `httpOnly` cookie
   - token is returned in response JSON
7. The frontend can then use cookie-based auth automatically for protected routes.

Example request:

```json
{
  "email": "ayushtiwarikeexam@gmail.com",
  "password": "12345678"
}
```

Example success response:

```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "jwt-token-value",
  "user": {
    "id": "6a0080d6d800f2385df54ad6",
    "firstName": "ayush",
    "lastName": "tiw",
    "email": "ayushtiwarikeexam@gmail.com",
    "phoneNo": "1234567890",
    "accountType": "Student",
    "image": "https://api.dicebear.com/7.x/initials/svg?seed=ayush%20tiw",
    "createdAt": "2026-05-10T12:57:58.120Z"
  }
}
```

### 4. Current User (`/auth/me`) Flow

Purpose:

- Verify whether the current user is authenticated
- Return the logged-in user data for the frontend dashboard

How it works internally:

1. The frontend calls `GET /api/v1/auth/me`.
2. The auth middleware reads the JWT from:
   - `req.cookies.token`, or
   - bearer token header
3. The backend verifies the JWT signature.
4. The backend fetches the latest user document using the decoded id.
5. If valid, the backend attaches the user to `req.user`.
6. The route returns a public version of that user.

Example success response:

```json
{
  "success": true,
  "user": {
    "id": "6a0080d6d800f2385df54ad6",
    "firstName": "ayush",
    "lastName": "tiw",
    "email": "ayushtiwarikeexam@gmail.com",
    "phoneNo": "1234567890",
    "accountType": "Student",
    "image": "https://api.dicebear.com/7.x/initials/svg?seed=ayush%20tiw",
    "createdAt": "2026-05-10T12:57:58.120Z"
  }
}
```

### 5. Forgot Password OTP Flow

Purpose:

- Allow users to reset their password through email verification

How it works internally:

1. The frontend sends the email to `POST /api/v1/auth/forgot-password/send-otp`.
2. The backend validates email format.
3. The backend checks that a user exists with that email.
4. A 6-digit OTP is generated.
5. Older reset OTPs for that email are deleted.
6. A new OTP record is stored with:
   - email
   - otp
   - purpose = `reset-password`
   - 5 minute TTL
7. Nodemailer sends the password reset email.
8. The API returns success.

Example request:

```json
{
  "email": "ayushtiwarikeexam@gmail.com"
}
```

Example success response:

```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

### 6. Password Reset Flow

Purpose:

- Let the user create a new password after OTP verification

How it works internally:

1. The frontend submits email, OTP, password, and confirm password.
2. The backend validates:
   - required fields
   - email format
   - password length
   - password confirmation match
3. The backend checks that the user exists.
4. The backend finds the latest OTP for `reset-password`.
5. The submitted OTP is verified.
6. OTP records for that email and purpose are deleted.
7. The new password is hashed with bcrypt.
8. The user document is updated with the new hash.
9. Success is returned.

Example request:

```json
{
  "email": "ayushtiwarikeexam@gmail.com",
  "otp": "858855",
  "password": "12345678",
  "confirmPassword": "12345678"
}
```

Example success response:

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### 7. Instructor Task Creation Flow

Purpose:

- Allow instructors to assign tasks to students

How it works internally:

1. Instructor logs in and gets authenticated.
2. Frontend sends task payload to `POST /api/v1/tasks`.
3. Auth middleware verifies the token.
4. Role middleware confirms the user is an `Instructor`.
5. Backend validates:
   - title
   - description
   - due date
   - student id
6. Backend confirms the selected student exists and has role `Student`.
7. Task is stored in MongoDB with:
   - title
   - description
   - due date
   - status = `Pending`
   - instructor reference
   - student reference
8. Task is returned with populated student and instructor info.

Dummy request example:

```json
{
  "title": "Complete React Dashboard",
  "description": "Build the dashboard cards and connect them with the protected API.",
  "dueDate": "2026-05-20T10:00:00.000Z",
  "studentId": "6a0074a166f0b57d4a643854"
}
```

Dummy success response:

```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "_id": "6a10101066f0b57d4a640001",
    "title": "Complete React Dashboard",
    "description": "Build the dashboard cards and connect them with the protected API.",
    "dueDate": "2026-05-20T10:00:00.000Z",
    "status": "Pending",
    "instructor": {
      "_id": "6a10101066f0b57d4a640010",
      "firstName": "Ritik",
      "lastName": "Sharma",
      "email": "ritik@example.com"
    },
    "student": {
      "_id": "6a0074a166f0b57d4a643854",
      "firstName": "Ayush",
      "lastName": "Tiwari",
      "email": "ayush@example.com"
    },
    "completedAt": null
  }
}
```

### 8. Instructor Task List and Filtering Flow

Purpose:

- Let instructors see pending and completed tasks
- Filter tasks for a particular student

How it works internally:

1. Frontend calls `GET /api/v1/tasks`.
2. Auth middleware verifies the user.
3. If the role is `Instructor`, backend automatically filters tasks by `instructor = req.user._id`.
4. Optional query params are applied:
   - `studentId`
   - `status`
5. Tasks are populated with student and instructor info.
6. Tasks are sorted by due date and returned.

Dummy example:

```http
GET /api/v1/tasks?studentId=6a0074a166f0b57d4a643854&status=Completed
```

Dummy response:

```json
{
  "success": true,
  "count": 2,
  "tasks": [
    {
      "_id": "6a10101066f0b57d4a640100",
      "title": "Design Landing Page",
      "description": "Submit a responsive design implementation.",
      "dueDate": "2026-05-18T12:00:00.000Z",
      "status": "Completed",
      "completedAt": "2026-05-17T08:30:00.000Z"
    },
    {
      "_id": "6a10101066f0b57d4a640101",
      "title": "API Testing Report",
      "description": "Create a Postman collection and document responses.",
      "dueDate": "2026-05-22T12:00:00.000Z",
      "status": "Completed",
      "completedAt": "2026-05-21T16:45:00.000Z"
    }
  ]
}
```

### 9. Student Task View Flow

Purpose:

- Show only the tasks assigned to the logged-in student

How it works internally:

1. Student calls `GET /api/v1/tasks`.
2. Auth middleware verifies token.
3. Backend detects role `Student`.
4. Query is automatically filtered with `student = req.user._id`.
5. The student only receives their own tasks.

Dummy response:

```json
{
  "success": true,
  "count": 2,
  "tasks": [
    {
      "_id": "6a10101066f0b57d4a640200",
      "title": "Build Authentication UI",
      "description": "Connect the login form with the backend.",
      "status": "Pending"
    },
    {
      "_id": "6a10101066f0b57d4a640201",
      "title": "Fix Task Card Styling",
      "description": "Update CSS for mobile spacing and card layout.",
      "status": "Completed"
    }
  ]
}
```

### 10. Student Task Completion Flow

Purpose:

- Let only the assigned student mark a task as complete

How it works internally:

1. Student clicks complete in the frontend.
2. Frontend sends `PATCH /api/v1/tasks/:taskId/complete`.
3. Auth middleware verifies token.
4. Role middleware confirms the user is a `Student`.
5. Backend fetches the task by id.
6. Backend checks that `task.student` matches the logged-in student id.
7. Status is changed from `Pending` to `Completed`.
8. `completedAt` timestamp is stored.
9. Updated task is returned.

Dummy response:

```json
{
  "success": true,
  "message": "Task marked as completed",
  "task": {
    "_id": "6a10101066f0b57d4a640200",
    "title": "Build Authentication UI",
    "status": "Completed",
    "completedAt": "2026-05-19T13:45:00.000Z"
  }
}
```

### 11. Instructor Task Update Flow

Purpose:

- Allow only the task creator instructor to edit the task

How it works internally:

1. Instructor sends `PUT /api/v1/tasks/:taskId`.
2. Backend verifies JWT and role.
3. Backend fetches the task.
4. Backend checks `task.instructor === req.user._id`.
5. Only provided fields are updated.
6. If a new student id is passed, backend verifies that user is a student.
7. Updated task is saved and returned.

Dummy response:

```json
{
  "success": true,
  "message": "Task updated successfully",
  "task": {
    "_id": "6a10101066f0b57d4a640001",
    "title": "Complete React Dashboard v2",
    "description": "Add analytics cards and protected navigation.",
    "status": "Pending"
  }
}
```

### 12. Instructor Task Delete Flow

Purpose:

- Allow only the task creator instructor to delete a task

How it works internally:

1. Instructor sends `DELETE /api/v1/tasks/:taskId`.
2. Backend verifies JWT and role.
3. Backend finds the task.
4. Backend checks instructor ownership.
5. Task is deleted from MongoDB.
6. A success message is returned.

Dummy response:

```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

### 13. Student Listing for Instructor Flow

Purpose:

- Populate instructor dropdowns and filters

How it works internally:

1. Instructor calls `GET /api/v1/users/students`.
2. JWT is verified.
3. Role middleware confirms instructor access.
4. Backend fetches all users where `accountType = Student`.
5. Only safe fields are selected and returned.

Dummy response:

```json
{
  "success": true,
  "students": [
    {
      "_id": "6a0074a166f0b57d4a643854",
      "firstName": "Ayush",
      "lastName": "Tiwari",
      "email": "ayush@example.com",
      "phoneNo": "9876543210"
    },
    {
      "_id": "6a0074a166f0b57d4a643855",
      "firstName": "Neha",
      "lastName": "Kumari",
      "email": "neha@example.com",
      "phoneNo": "9988776655"
    }
  ]
}
```

## API Testing Examples

The following examples match the flows already tested locally and are suitable for Postman or Swagger.

### Send Registration OTP

```http
POST /api/v1/auth/register/send-otp
```

Request:

```json
{
  "email": "ayushtiwarikeexam@gmail.com"
}
```

Response:

```json
{
  "success": true,
  "message": "Registration OTP sent to your email"
}
```

### Register Verified User

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "firstName": "ayush",
  "lastName": "tiw",
  "email": "ayushtiwarikeexam@gmail.com",
  "phoneNo": "1234567890",
  "password": "12345679",
  "confirmPassword": "12345679",
  "accountType": "Student",
  "otp": "601721"
}
```

### Send Forgot Password OTP

```http
POST /api/v1/auth/forgot-password/send-otp
```

Request:

```json
{
  "email": "ayushtiwarikeexam@gmail.com"
}
```

Response:

```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

### Reset Password

```http
POST /api/v1/auth/forgot-password/reset
```

Request:

```json
{
  "email": "ayushtiwarikeexam@gmail.com",
  "otp": "858855",
  "password": "12345678",
  "confirmPassword": "12345678"
}
```

Response:

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Login

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "ayushtiwarikeexam@gmail.com",
  "password": "12345678"
}
```

### Get Current User

```http
GET /api/v1/auth/me
```

Response:

```json
{
  "success": true,
  "user": {
    "id": "6a0080d6d800f2385df54ad6",
    "firstName": "ayush",
    "lastName": "tiw",
    "email": "ayushtiwarikeexam@gmail.com",
    "phoneNo": "1234567890",
    "accountType": "Student",
    "image": "https://api.dicebear.com/7.x/initials/svg?seed=ayush%20tiw",
    "createdAt": "2026-05-10T12:57:58.120Z"
  }
}
```

## Run Locally

Install both apps:

```bash
npm run install:all
```

Run in development:

```bash
npm run backend:dev
npm run frontend:dev
```

URLs:

- Frontend dev server: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:4000](http://localhost:4000)

Run production-style locally:

```bash
npm run build
npm start
```

Then open [http://localhost:4000](http://localhost:4000).

## Authentication and Security

- Password hashing with `bcrypt`
- JWT-based protected routes
- Email OTP verification for signup
- Email OTP verification for forgot password
- Role-based middleware for instructor and student permissions
- Input validation and sanitization
- `httpOnly` cookie support for token handling

## Main API Areas

### Auth

- `POST /api/v1/auth/register/send-otp`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/forgot-password/send-otp`
- `POST /api/v1/auth/forgot-password/reset`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

### Tasks

- `GET /api/v1/tasks`
- `GET /api/v1/tasks/:taskId`
- `POST /api/v1/tasks`
- `PUT /api/v1/tasks/:taskId`
- `DELETE /api/v1/tasks/:taskId`
- `PATCH /api/v1/tasks/:taskId/complete`

### Users

- `GET /api/v1/users/students`

## Architecture Notes

### Frontend

- React handles auth views, OTP flows, dashboards, and task management
- Vite keeps the frontend fast during development
- The UI is separated from API logic for easier future component extraction

### Backend

- Controllers hold business logic
- Routes are versioned under `/api/v1`
- Middleware handles auth and errors centrally
- Models define user, OTP, and task schema structure
- Utilities keep mail, async handling, and validation reusable

## Scalability Possibilities

The current version is a solid monolith for early-stage growth, but it can scale in several directions.

### Horizontal Scaling

- Run multiple backend instances behind a load balancer
- Keep the app stateless by relying on JWT instead of in-memory sessions
- Share the same MongoDB cluster across all app instances
- Move email sending and heavy background jobs to a queue worker

### Vertical Scaling

- Increase server CPU and memory for medium traffic
- Use better MongoDB indexing for task filters, email lookup, and role-based queries
- Add request-level caching for repeated read-heavy views

### Database Scaling

- Add indexes for:
  - `User.email`
  - `User.phoneNo`
  - `Task.student`
  - `Task.instructor`
  - `Task.status`
  - `Task.dueDate`
- Move to MongoDB Atlas for managed backups, replication, and monitoring
- Introduce read replicas if reporting becomes heavy
- Add archival rules for completed or stale tasks

### Background Processing

- Queue OTP emails instead of sending them inline
- Offload notifications, reminders, and analytics jobs
- Use BullMQ, RabbitMQ, or a cloud queue service in future versions

### Caching Opportunities

- Cache student lists for instructor views
- Cache dashboard summary counts
- Cache public docs or metadata with Redis
- Cache repeated task filters for large classrooms

## Load Balancing Strategy

For production, a practical load balancing setup would be:

1. Use Nginx, HAProxy, AWS ALB, or a cloud reverse proxy in front of backend instances.
2. Route HTTPS traffic to multiple Node.js application containers.
3. Terminate SSL at the load balancer.
4. Use health checks on `/health`.
5. Keep application state out of memory so any request can hit any instance.

Suggested production flow:

```text
User Browser
  -> CDN / Reverse Proxy
  -> Load Balancer
  -> Multiple Backend App Instances
  -> MongoDB / Redis / Queue / Mail Provider
```

## Future Deployment Options

### Simple Deployment

- Frontend on Vercel or Netlify
- Backend on Render, Railway, or Cyclic
- MongoDB on Atlas

### Container Deployment

- Dockerize frontend and backend
- Use Docker Compose for local orchestration
- Deploy with ECS, Kubernetes, or DigitalOcean App Platform

### Enterprise-Style Deployment

- Frontend built and served through CDN
- Backend deployed as replicated containers
- Managed MongoDB cluster
- Redis for cache and queue
- Centralized logs and metrics
- Secret management through cloud environment stores

## Production Readiness Improvements

These are strong next steps for making the system more production-grade:

- Rate limiting on OTP and login endpoints
- Email retry and dead-letter handling
- Audit logs for task creation, deletion, and completion
- CSRF strategy if cookie auth becomes primary
- Helmet and stricter security headers
- Structured logging with request IDs
- Environment separation for dev, staging, and production
- Refresh token strategy if longer sessions are needed

## Game-Based Task Expansion

The project can evolve into a more engaging gamified learning platform.

### Gamification Ideas

- Points for every completed task
- Streaks for consecutive on-time submissions
- Badges for milestones like `First Task`, `5 Completed`, `Perfect Week`
- Leaderboards by class, batch, or cohort
- XP levels for students
- Instructor reward markers for high performers
- Task difficulty ratings with bonus points
- Daily or weekly challenge tasks
- Unlockable themes or profile frames

### Game-Based Task Types

- Quiz-based assignments
- Timed coding missions
- Multi-step quest tasks
- Team-based challenge boards
- Progress maps where each task unlocks the next
- Boss-level review tasks at the end of modules

### Data Needed for Gamification

- `pointsEarned`
- `taskDifficulty`
- `submissionTime`
- `streakCount`
- `badgeCollection`
- `rankSnapshot`
- `achievementHistory`

## Analytics and Reporting Possibilities

- Instructor dashboard summary cards
- Student performance by completion rate
- Late vs on-time submission trends
- Most active instructors
- Most difficult tasks by completion delay
- Weekly and monthly productivity reports
- Cohort comparisons

## Notification Possibilities

- Email reminder before due date
- Task assigned notification
- Task completed notification to instructor
- In-app notification center
- WhatsApp or SMS alerts in future versions
- Weekly digest for instructors

## Testing Roadmap

- Unit tests for auth and OTP logic
- Integration tests for task APIs
- Frontend tests for auth flows and role views
- End-to-end testing with Playwright or Cypress
- Load testing with k6 or Artillery

## DevOps and Observability Suggestions

- Health checks and uptime monitoring
- Request logging and error tracking
- Performance metrics for slow endpoints
- Alerting for failed email delivery spikes
- Dashboarding with Grafana or cloud monitoring tools
- Log aggregation with Elasticsearch, Loki, or Datadog

## Future Feature Ideas

- Admin role and platform-wide controls
- Classroom and batch grouping
- File attachments on tasks
- Comments on tasks
- Instructor feedback and grading
- Submission proof uploads
- Calendar view for deadlines
- Search and advanced filtering
- Multi-language support
- Mobile-first or React Native client

## Why This Structure Scales Well

- Clear frontend and backend separation
- Route/controller/model layering keeps logic organized
- JWT auth avoids sticky session dependency
- OTP is already isolated enough to become a queue-driven service later
- React frontend can be split into components, hooks, and pages as it grows
- MongoDB schema can expand quickly for product experiments

## Suggested Next Milestones

1. Add rate limiting and resend cooldown for OTP APIs.
2. Add task due-date reminders and notification scheduling.
3. Add analytics cards on the instructor dashboard.
4. Add gamified scoring, badges, and leaderboard models.
5. Add Docker support and deploy to a cloud staging environment.
6. Add automated tests and CI pipeline.

## API Documentation

Swagger docs are available at:

- `/api-docs`

## Summary

This project already works as a student-instructor task platform, but it is also a strong base for a much larger product. With load balancing, managed deployment, analytics, background workers, caching, and gamified task systems, it can grow from a classroom project into a production-ready educational workflow platform.
