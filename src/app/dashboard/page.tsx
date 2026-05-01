"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { ApiError, apiClient } from "@/src/lib/apiClient";

type Role = "admin" | "member";
type TaskStatus = "todo" | "in-progress" | "done";

type SessionUser = {
  _id: string;
  name: string;
  email: string;
  role: Role;
};

type DashboardResponse = {
  totalTasks: number;
  tasksByStatus: {
    Pending: number;
    "In Progress": number;
    Completed: number;
  };
  overdueTasks: number;
};

type Project = {
  _id: string;
  name: string;
  description: string;
};

type Task = {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  project?: { _id: string; name: string };
  assignedTo?: { _id: string; name: string; email: string };
};

type UserLite = {
  _id: string;
  name: string;
  email: string;
};

type ProjectsResponse = { projects: Project[] };
type TasksResponse = { tasks: Task[] };
type UsersResponse = { users: UserLite[] };

export default function DashboardPage() {
  const router = useRouter();

  const [user] = useState<SessionUser | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const token = localStorage.getItem("token");
    const rawUser = localStorage.getItem("user");
    if (!token || !rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as SessionUser;
    } catch {
      return null;
    }
  });
  const [stats, setStats] = useState<DashboardResponse | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserLite[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  const [updatingTaskId, setUpdatingTaskId] = useState("");

  const isAdmin = user?.role === "admin";

  const loadData = useCallback(async (currentUser: SessionUser) => {
    setError("");
    try {
      const dashboardPromise = apiClient.get<DashboardResponse>("/api/dashboard");
      const projectsPromise = apiClient.get<ProjectsResponse>("/api/projects");
      const tasksPromise = apiClient.get<TasksResponse>("/api/tasks");
      const usersPromise = currentUser.role === "admin"
        ? apiClient.get<UsersResponse>("/api/users")
        : Promise.resolve({ users: [] as UserLite[] });

      const [dashboardData, projectsData, tasksData, usersData] = await Promise.all([
        dashboardPromise,
        projectsPromise,
        tasksPromise,
        usersPromise,
      ]);

      setStats(dashboardData);
      setProjects(projectsData.projects);
      setTasks(tasksData.tasks);
      setUsers(usersData.users);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setPageLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!user) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }

    const timer = setTimeout(() => {
      void loadData(user);
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData, router, user]);

  const overviewCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Total Tasks", value: stats.totalTasks, tone: "text-slate-900" },
      { label: "Pending", value: stats.tasksByStatus.Pending, tone: "text-amber-700" },
      {
        label: "In Progress",
        value: stats.tasksByStatus["In Progress"],
        tone: "text-sky-700",
      },
      { label: "Completed", value: stats.tasksByStatus.Completed, tone: "text-emerald-700" },
      { label: "Overdue", value: stats.overdueTasks, tone: "text-red-700" },
    ];
  }, [stats]);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectTitle.trim()) return;

    setCreatingProject(true);
    setError("");

    try {
      await apiClient.post("/api/projects", {
        title: projectTitle,
        description: projectDescription,
      });
      setProjectTitle("");
      setProjectDescription("");
      if (user) await loadData(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!taskTitle || !taskDueDate || !taskAssignedTo || !taskProjectId) return;

    setCreatingTask(true);
    setError("");

    try {
      await apiClient.post("/api/tasks", {
        title: taskTitle,
        description: taskDescription,
        dueDate: taskDueDate,
        assignedTo: taskAssignedTo,
        projectId: taskProjectId,
      });

      setTaskTitle("");
      setTaskDescription("");
      setTaskDueDate("");
      setTaskAssignedTo("");
      setTaskProjectId("");

      if (user) await loadData(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleStatusChange(taskId: string, status: TaskStatus) {
    setUpdatingTaskId(taskId);
    setError("");

    try {
      await apiClient.put("/api/tasks", { taskId, status });
      if (user) await loadData(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setUpdatingTaskId("");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  }

  if (pageLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Team Task Manager</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Hi, {user.name} ({user.role})
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
          >
            Logout
          </button>
        </header>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {overviewCards.map((card) => (
              <article
                key={card.label}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className={`mt-2 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Projects</h2>

          {isAdmin ? (
            <form
              onSubmit={handleCreateProject}
              className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_2fr_auto]"
            >
              <input
                type="text"
                placeholder="Project title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Project description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={creatingProject}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {creatingProject ? "Creating..." : "Add Project"}
              </button>
            </form>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project._id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-900">{project.name}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {project.description || "No description"}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>

          {isAdmin ? (
            <form
              onSubmit={handleCreateTask}
              className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2"
            >
              <input
                type="text"
                placeholder="Task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                required
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Task description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2"
              />
              <select
                value={taskProjectId}
                onChange={(e) => setTaskProjectId(e.target.value)}
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                value={taskAssignedTo}
                onChange={(e) => setTaskAssignedTo(e.target.value)}
                required
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Assign user</option>
                {users.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name} ({item.email})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={creatingTask}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 md:col-span-2"
              >
                {creatingTask ? "Creating..." : "Add Task"}
              </button>
            </form>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => (
              <article
                key={task._id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {task.description || "No description"}
                </p>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p>Project: {task.project?.name ?? "Unknown"}</p>
                  <p>Assigned to: {task.assignedTo?.name ?? "Unknown"}</p>
                  <p>Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                </div>

                {isAdmin ? (
                  <p className="mt-3 inline-block rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                    Status: {task.status}
                  </p>
                ) : (
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Update Status
                    </label>
                    <select
                      value={task.status}
                      onChange={(e) =>
                        void handleStatusChange(task._id, e.target.value as TaskStatus)
                      }
                      disabled={updatingTaskId === task._id}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-60"
                    >
                      <option value="todo">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Completed</option>
                    </select>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
