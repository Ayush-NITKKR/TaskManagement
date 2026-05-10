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
