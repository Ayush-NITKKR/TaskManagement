import { useEffect, useState } from "react";

const emptyRegisterForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNo: "",
  password: "",
  confirmPassword: "",
  accountType: "Student",
  otp: "",
};

const emptyLoginForm = {
  email: "",
  password: "",
};

const emptyForgotPasswordForm = {
  email: "",
  otp: "",
  password: "",
  confirmPassword: "",
};

const emptyTaskForm = {
  taskId: "",
  studentId: "",
  title: "",
  description: "",
  dueDate: "",
};

const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

const toDateInputValue = (value) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
};

const TaskCard = ({ task, role, onEdit, onDelete, onComplete }) => (
  <article className="task-item">
    <h4>{task.title}</h4>
    <p>{task.description}</p>
    <div className="task-meta">
      {role === "Instructor" ? (
        <span>
          <strong>Student:</strong> {task.student.firstName} {task.student.lastName}
        </span>
      ) : (
        <span>
          <strong>Instructor:</strong> {task.instructor.firstName} {task.instructor.lastName}
        </span>
      )}
      <span>
        <strong>Due:</strong> {new Date(task.dueDate).toLocaleString()}
      </span>
      <span>
        <strong>Status:</strong> {task.status}
      </span>
      {task.completedAt ? (
        <span>
          <strong>Completed:</strong> {new Date(task.completedAt).toLocaleString()}
        </span>
      ) : null}
    </div>
    <div className="task-actions">
      {role === "Instructor" ? (
        <>
          <button type="button" className="ghost-button" onClick={() => onEdit(task)}>
            Edit
          </button>
          <button type="button" className="danger-button" onClick={() => onDelete(task._id)}>
            Delete
          </button>
        </>
      ) : task.status === "Pending" ? (
        <button type="button" onClick={() => onComplete(task._id)}>
          Mark complete
        </button>
      ) : null}
    </div>
  </article>
);

function App() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState({ text: "", type: "success" });
  const [loading, setLoading] = useState(true);
  const [authView, setAuthView] = useState("login");
  const [signupRole, setSignupRole] = useState("Student");
  const [registerForm, setRegisterForm] = useState(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState(emptyLoginForm);
  const [forgotPasswordForm, setForgotPasswordForm] = useState(emptyForgotPasswordForm);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [filters, setFilters] = useState({ studentId: "", status: "" });

  const showMessage = (text, type = "success") => setMessage({ text, type });

  const loadStudents = async () => {
    const data = await apiRequest("/api/v1/users/students");
    setStudents(data.students);
    return data.students;
  };

  const loadTasks = async (currentUser, nextFilters = filters) => {
    const params = new URLSearchParams();

    if (currentUser?.accountType === "Instructor") {
      if (nextFilters.studentId) {
        params.append("studentId", nextFilters.studentId);
      }

      if (nextFilters.status) {
        params.append("status", nextFilters.status);
      }
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiRequest(`/api/v1/tasks${query}`);
    setTasks(data.tasks);
  };

  const bootstrap = async () => {
    try {
      const data = await apiRequest("/api/v1/auth/me");
      setUser(data.user);

      if (data.user.accountType === "Instructor") {
        const nextStudents = await loadStudents();
        setTaskForm((current) => ({
          ...current,
          studentId: current.studentId || nextStudents[0]?._id || "",
        }));
      }

      await loadTasks(data.user, filters);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    setRegisterForm((current) => ({
      ...current,
      accountType: signupRole,
    }));
  }, [signupRole]);

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterForm((current) => ({ ...current, [name]: value }));
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  };

  const handleForgotPasswordChange = (event) => {
    const { name, value } = event.target;
    setForgotPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handleTaskChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((current) => ({ ...current, [name]: value }));
  };

  const resetTaskForm = (availableStudents = students) => {
    setTaskForm({
      ...emptyTaskForm,
      studentId: availableStudents[0]?._id || "",
    });
  };

  const handleSendRegistrationOtp = async () => {
    try {
      await apiRequest("/api/v1/auth/register/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: registerForm.email }),
      });
      showMessage(`Verification OTP sent to ${registerForm.email || "your email"}`);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();

    try {
      const data = await apiRequest("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(registerForm),
      });

      setUser(data.user);
      setRegisterForm({ ...emptyRegisterForm, accountType: signupRole });
      showMessage(data.message);

      if (data.user.accountType === "Instructor") {
        const nextStudents = await loadStudents();
        resetTaskForm(nextStudents);
      } else {
        resetTaskForm([]);
      }

      await loadTasks(data.user, filters);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    try {
      const data = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });

      setUser(data.user);
      setLoginForm(emptyLoginForm);
      showMessage(data.message);

      if (data.user.accountType === "Instructor") {
        const nextStudents = await loadStudents();
        resetTaskForm(nextStudents);
      } else {
        resetTaskForm([]);
      }

      await loadTasks(data.user, filters);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleSendResetOtp = async () => {
    try {
      await apiRequest("/api/v1/auth/forgot-password/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: forgotPasswordForm.email }),
      });
      showMessage(`Password reset OTP sent to ${forgotPasswordForm.email || "your email"}`);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleForgotPasswordSubmit = async (event) => {
    event.preventDefault();

    try {
      const data = await apiRequest("/api/v1/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify(forgotPasswordForm),
      });
      setForgotPasswordForm(emptyForgotPasswordForm);
      setAuthView("login");
      showMessage(data.message);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("/api/v1/auth/logout", { method: "POST" });
      setUser(null);
      setStudents([]);
      setTasks([]);
      setFilters({ studentId: "", status: "" });
      resetTaskForm([]);
      showMessage("Logged out successfully");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();

    try {
      const endpoint = taskForm.taskId ? `/api/v1/tasks/${taskForm.taskId}` : "/api/v1/tasks";
      const method = taskForm.taskId ? "PUT" : "POST";
      const payload = { ...taskForm };
      delete payload.taskId;

      const data = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      showMessage(data.message);
      resetTaskForm();
      await loadTasks(user, filters);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleTaskEdit = (task) => {
    setTaskForm({
      taskId: task._id,
      studentId: task.student._id,
      title: task.title,
      description: task.description,
      dueDate: toDateInputValue(task.dueDate),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await apiRequest(`/api/v1/tasks/${taskId}`, { method: "DELETE" });
      showMessage("Task deleted successfully");
      await loadTasks(user, filters);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleTaskComplete = async (taskId) => {
    try {
      await apiRequest(`/api/v1/tasks/${taskId}/complete`, { method: "PATCH" });
      showMessage("Task marked as completed");
      await loadTasks(user, filters);
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const updateFilters = async (nextFilters) => {
    setFilters(nextFilters);

    if (user) {
      await loadTasks(user, nextFilters);
    }
  };

  const pendingTasks = tasks.filter((task) => task.status === "Pending");
  const completedTasks = tasks.filter((task) => task.status === "Completed");

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-card">
          <p className="eyebrow">EdTech Task Platform</p>
          <h1>Loading workspace...</h1>
        </div>
      </main>
    );
  }

  return (
    <div className="theme-page">
      {!user ? (
        <>
          <header className="topbar">
            <div className="brand-mark">
              <span className="brand-icon" />
              <span>Task Platform</span>
            </div>

            <nav className="topnav">
              <a href="/api-docs" target="_blank" rel="noreferrer">
                API Docs
              </a>
              <button
                type="button"
                className={authView === "signup" ? "nav-cta active" : "nav-cta"}
                onClick={() => setAuthView("signup")}
              >
                Sign Up
              </button>
              <button
                type="button"
                className={authView === "login" ? "nav-ghost active" : "nav-ghost"}
                onClick={() => setAuthView("login")}
              >
                Log In
              </button>
            </nav>
          </header>

          <main className="landing-shell">
            <section className="art-panel">
              <div className="art-scene">
                <div className="sky-glow" />
                <div className="hill hill-back" />
                <div className="hill hill-mid" />
                <div className="moon" />
                <div className="tree tree-left" />
                <div className="tree tree-center" />
                <div className="tree tree-right" />
                <div className="rock-left" />
                <div className="rock-right" />
                <span className="star star-one" />
                <span className="star star-two" />
                <span className="star star-three" />
                <span className="star star-four" />
              </div>
            </section>

            <section className="auth-card">
              <div className="auth-card-copy">
                <h1>Welcome to Task Hub</h1>
                <p>
                  Join the instructor and student workspace with secure email verification and
                  role-based dashboards.
                </p>
              </div>

              <div className={`message ${message.type}`}>{message.text}</div>

              {authView === "login" ? (
                <form className="auth-form" onSubmit={handleLoginSubmit}>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    required
                  />
                  <input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                    required
                  />
                  <button type="submit" className="primary-auth-button">
                    Log In
                  </button>
                  <p className="helper-text">Don&apos;t have an account?</p>
                  <button type="button" className="secondary-auth-button" onClick={() => setAuthView("signup")}>
                    Sign Up
                  </button>
                  <button type="button" className="text-link-button" onClick={() => setAuthView("reset")}>
                    Forgot Password
                  </button>
                </form>
              ) : null}

              {authView === "signup" ? (
                <div className="signup-flow">
                  <div className="signup-tabs">
                    <button
                      type="button"
                      className={signupRole === "Student" ? "signup-tab active" : "signup-tab"}
                      onClick={() => setSignupRole("Student")}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      className={signupRole === "Instructor" ? "signup-tab active" : "signup-tab"}
                      onClick={() => setSignupRole("Instructor")}
                    >
                      Instructor
                    </button>
                  </div>

                  <p className="role-helper">
                    {signupRole === "Student"
                      ? "Students receive tasks, track pending work, and mark assignments complete."
                      : "Instructors assign work, filter student progress, and monitor completions."}
                  </p>

                  <form className="auth-form auth-form-grid" onSubmit={handleRegisterSubmit}>
                    <input
                      name="firstName"
                      placeholder="First Name"
                      value={registerForm.firstName}
                      onChange={handleRegisterChange}
                      required
                    />
                    <input
                      name="lastName"
                      placeholder="Last Name"
                      value={registerForm.lastName}
                      onChange={handleRegisterChange}
                    />
                    <input
                      name="email"
                      type="email"
                      placeholder="Email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      required
                    />
                    <input
                      name="phoneNo"
                      placeholder="Phone Number"
                      value={registerForm.phoneNo}
                      onChange={handleRegisterChange}
                      required
                    />
                    <input
                      name="password"
                      type="password"
                      placeholder="Password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      required
                    />
                    <input
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm Password"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      required
                    />
                    <div className="otp-row">
                      <input
                        name="otp"
                        placeholder="Email OTP"
                        value={registerForm.otp}
                        onChange={handleRegisterChange}
                        required
                      />
                      <button type="button" className="otp-button" onClick={handleSendRegistrationOtp}>
                        Send OTP
                      </button>
                    </div>
                    <button type="submit" className="primary-auth-button full-span">
                      Create {signupRole} Account
                    </button>
                    <button type="button" className="secondary-auth-button full-span" onClick={() => setAuthView("login")}>
                      Back to Login
                    </button>
                  </form>
                </div>
              ) : null}

              {authView === "reset" ? (
                <form className="auth-form" onSubmit={handleForgotPasswordSubmit}>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={forgotPasswordForm.email}
                    onChange={handleForgotPasswordChange}
                    required
                  />
                  <div className="otp-row">
                    <input
                      name="otp"
                      placeholder="OTP"
                      value={forgotPasswordForm.otp}
                      onChange={handleForgotPasswordChange}
                      required
                    />
                    <button type="button" className="otp-button" onClick={handleSendResetOtp}>
                      Send OTP
                    </button>
                  </div>
                  <input
                    name="password"
                    type="password"
                    placeholder="New Password"
                    value={forgotPasswordForm.password}
                    onChange={handleForgotPasswordChange}
                    required
                  />
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm New Password"
                    value={forgotPasswordForm.confirmPassword}
                    onChange={handleForgotPasswordChange}
                    required
                  />
                  <button type="submit" className="primary-auth-button">
                    Reset Password
                  </button>
                  <button type="button" className="secondary-auth-button" onClick={() => setAuthView("login")}>
                    Back to Login
                  </button>
                </form>
              ) : null}
            </section>
          </main>
        </>
      ) : (
        <div className="shell">
          <aside className="hero-panel">
            <p className="eyebrow">EdTech Task Platform</p>
            <h1>Built for instructors who assign clearly and students who finish on time.</h1>
            <p className="hero-copy">
              React frontend, JWT-protected APIs, task assignment workflow, and student-wise progress
              tracking in one focused platform.
            </p>
            <div className="feature-stack">
              <div className="feature-card">
                <span>Frontend</span>
                <strong>React + Vite</strong>
              </div>
              <div className="feature-card">
                <span>Workflow</span>
                <strong>Assign, track, complete, filter</strong>
              </div>
              <div className="feature-card">
                <span>Security</span>
                <strong>Email OTP verification and reset</strong>
              </div>
            </div>
            <footer className="hero-footer">
              <p>Explore the backend contract after you sign in or while testing the APIs directly.</p>
              <a className="footer-doc-link" href="/api-docs" target="_blank" rel="noreferrer">
                Open API Docs
              </a>
            </footer>
          </aside>

          <main className="app-panel">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Protected Dashboard</p>
                  <h2>
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="muted">{user.accountType} dashboard</p>
                </div>
                <div className="header-actions">
                  <div className={`message ${message.type}`}>{message.text}</div>
                  <a className="ghost-button inline-link" href="/api-docs" target="_blank" rel="noreferrer">
                    Swagger
                  </a>
                  <button type="button" className="ghost-button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              </div>

              {user.accountType === "Instructor" ? (
                <>
                  <div className="dashboard-grid">
                    <form className="card form-card" onSubmit={handleTaskSubmit}>
                      <div className="form-head">
                        <h3>{taskForm.taskId ? "Edit assigned task" : "Assign a task"}</h3>
                        {taskForm.taskId ? (
                          <button type="button" className="text-button" onClick={() => resetTaskForm()}>
                            Cancel edit
                          </button>
                        ) : null}
                      </div>
                      <label>
                        <span>Student</span>
                        <select name="studentId" value={taskForm.studentId} onChange={handleTaskChange} required>
                          <option value="">Select student</option>
                          {students.map((student) => (
                            <option key={student._id} value={student._id}>
                              {student.firstName} {student.lastName} ({student.email})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Task title</span>
                        <input name="title" value={taskForm.title} onChange={handleTaskChange} required />
                      </label>
                      <label>
                        <span>Description</span>
                        <textarea name="description" rows="5" value={taskForm.description} onChange={handleTaskChange} required />
                      </label>
                      <label>
                        <span>Due date</span>
                        <input name="dueDate" type="datetime-local" value={taskForm.dueDate} onChange={handleTaskChange} required />
                      </label>
                      <button type="submit">{taskForm.taskId ? "Save changes" : "Create task"}</button>
                    </form>

                    <div className="card filter-card">
                      <h3>Filter by student</h3>
                      <label>
                        <span>Student</span>
                        <select
                          value={filters.studentId}
                          onChange={(event) => updateFilters({ ...filters, studentId: event.target.value })}
                        >
                          <option value="">All students</option>
                          {students.map((student) => (
                            <option key={student._id} value={student._id}>
                              {student.firstName} {student.lastName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>Status</span>
                        <select
                          value={filters.status}
                          onChange={(event) => updateFilters({ ...filters, status: event.target.value })}
                        >
                          <option value="">All statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </label>
                      <button type="button" className="secondary-button" onClick={() => loadTasks(user, filters)}>
                        Refresh list
                      </button>
                    </div>
                  </div>

                  <div className="task-columns">
                    <section className="card task-column">
                      <div className="column-head">
                        <h3>Pending tasks</h3>
                        <span className="count-pill">{pendingTasks.length}</span>
                      </div>
                      <div className="task-list">
                        {pendingTasks.length ? (
                          pendingTasks.map((task) => (
                            <TaskCard
                              key={task._id}
                              task={task}
                              role="Instructor"
                              onEdit={handleTaskEdit}
                              onDelete={handleTaskDelete}
                            />
                          ))
                        ) : (
                          <div className="empty-state">No pending tasks for this filter.</div>
                        )}
                      </div>
                    </section>

                    <section className="card task-column">
                      <div className="column-head">
                        <h3>Completed tasks</h3>
                        <span className="count-pill">{completedTasks.length}</span>
                      </div>
                      <div className="task-list">
                        {completedTasks.length ? (
                          completedTasks.map((task) => (
                            <TaskCard
                              key={task._id}
                              task={task}
                              role="Instructor"
                              onEdit={handleTaskEdit}
                              onDelete={handleTaskDelete}
                            />
                          ))
                        ) : (
                          <div className="empty-state">No completed tasks for this filter.</div>
                        )}
                      </div>
                    </section>
                  </div>
                </>
              ) : (
                <div className="task-columns single-grid">
                  <section className="card task-column">
                    <div className="column-head">
                      <h3>Your pending tasks</h3>
                      <span className="count-pill">{pendingTasks.length}</span>
                    </div>
                    <div className="task-list">
                      {pendingTasks.length ? (
                        pendingTasks.map((task) => (
                          <TaskCard key={task._id} task={task} role="Student" onComplete={handleTaskComplete} />
                        ))
                      ) : (
                        <div className="empty-state">You have no pending tasks.</div>
                      )}
                    </div>
                  </section>

                  <section className="card task-column">
                    <div className="column-head">
                      <h3>Your completed tasks</h3>
                      <span className="count-pill">{completedTasks.length}</span>
                    </div>
                    <div className="task-list">
                      {completedTasks.length ? (
                        completedTasks.map((task) => (
                          <TaskCard key={task._id} task={task} role="Student" onComplete={handleTaskComplete} />
                        ))
                      ) : (
                        <div className="empty-state">You have not completed any tasks yet.</div>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </section>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
