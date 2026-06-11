// ─── Config ─────────────────────────────────────────────
const API_BASE = "/api";

// ─── State ──────────────────────────────────────────────
const state = {
  tasks: [],
  pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  metrics: { total_tasks: 0, completed_tasks: 0, high_priority_tasks: 0, avg_estimated_hours: 0 },
  filters: { search: "", priority: "", status: "", sortBy: "created_at", sortOrder: "DESC" },
  loading: false,
  editingTask: null,
  deletingTaskId: null,
};

// ─── API ─────────────────────────────────────────────────
const api = {
  async request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  },
  getTasks(params = {}) {
    const { page, limit, search, priority, status, sortBy, sortOrder } = {
      page: state.pagination.page,
      limit: state.pagination.limit,
      search: state.filters.search,
      priority: state.filters.priority,
      status: state.filters.status,
      sortBy: state.filters.sortBy,
      sortOrder: state.filters.sortOrder,
      ...params,
    };
    const q = new URLSearchParams();
    q.set("page", page);
    q.set("limit", limit);
    if (search) q.set("search", search);
    if (priority) q.set("priority", priority);
    if (status) q.set("status", status);
    q.set("sortBy", sortBy);
    q.set("sortOrder", sortOrder);
    return this.request(`/tasks?${q}`);
  },
  createTask(data) { return this.request("/tasks", { method: "POST", body: JSON.stringify(data) }); },
  updateTask(id, data) { return this.request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }); },
  deleteTask(id) { return this.request(`/tasks/${id}`, { method: "DELETE" }); },
  getMetrics() { return fetch("/metrics").then((r) => r.json()); },
};

// ─── Utils ───────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function priorityBadge(p) {
  const map = { Low: "low", Medium: "medium", High: "high", Critical: "critical" };
  const key = map[p] || "medium";
  return `<span class="badge badge-${key}"><span class="badge-dot dot-${key}"></span>${escapeHtml(p)}</span>`;
}

function statusBadge(s) {
  const map = { "Todo": "todo", "In Progress": "inprogress", "Done": "done" };
  const key = map[s] || "todo";
  return `<span class="badge badge-${key}"><span class="badge-dot dot-${key}"></span>${escapeHtml(s)}</span>`;
}

// ─── Toast ───────────────────────────────────────────────
function toast(msg, type = "info") {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${escapeHtml(msg)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add("removing");
    el.addEventListener("animationend", () => el.remove());
  }, 3500);
}

// ─── Metrics ─────────────────────────────────────────────
async function loadMetrics() {
  try {
    const res = await api.getMetrics();
    if (!res.success) return;
    const m = res.data;
    state.metrics = m;
    document.getElementById("stat-total").textContent = m.total_tasks;
    document.getElementById("stat-completed").textContent = m.completed_tasks;
    document.getElementById("stat-high").textContent = m.high_priority_tasks;
    document.getElementById("stat-avg-hours").textContent = `${m.avg_estimated_hours}h`;
    document.getElementById("stat-inprogress").textContent = `${m.in_progress} in progress`;
    document.getElementById("stat-todo").textContent = `${m.todo} remaining`;
  } catch (e) {
    console.error("Metrics error:", e);
  }
}

// ─── Render Tasks ─────────────────────────────────────────
function renderSkeletons(count = 5) {
  const tbody = document.getElementById("task-tbody");
  tbody.innerHTML = Array.from({ length: count }, () => `
    <tr class="skeleton-row">
      <td><div class="skeleton skeleton-cell" style="width:70%"></div></td>
      <td><div class="skeleton skeleton-cell" style="width:60px"></div></td>
      <td><div class="skeleton skeleton-cell" style="width:50px"></div></td>
      <td><div class="skeleton skeleton-cell" style="width:80px"></div></td>
      <td><div class="skeleton skeleton-cell" style="width:70px"></div></td>
      <td><div class="skeleton skeleton-cell" style="width:60px"></div></td>
    </tr>
  `).join("");
}

function renderTasks() {
  const tbody = document.getElementById("task-tbody");
  const empty = document.getElementById("empty-state");

  if (state.tasks.length === 0) {
    tbody.innerHTML = "";
    empty.classList.add("visible");
    document.getElementById("task-count").textContent = 0;
    return;
  }

  empty.classList.remove("visible");
  document.getElementById("task-count").textContent = state.pagination.total;

  tbody.innerHTML = state.tasks.map((t) => `
    <tr>
      <td class="task-title-cell">
        <span class="task-title-main" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</span>
        ${t.description ? `<span class="task-desc-sub" title="${escapeHtml(t.description)}">${escapeHtml(t.description)}</span>` : ""}
      </td>
      <td>${priorityBadge(t.priority)}</td>
      <td class="hours-cell">
        ${t.estimated_hours != null
          ? `<span class="hours-badge">⏱ ${parseFloat(t.estimated_hours)}h</span>`
          : `<span style="color:var(--text-muted);font-size:13px">—</span>`}
      </td>
      <td style="color:var(--text-secondary);font-size:13px;white-space:nowrap">${formatDate(t.created_at)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>
        <div class="actions-cell">
          <button class="action-btn" onclick="openEditModal(${t.id})" title="Edit task">✎</button>
          <button class="action-btn delete" onclick="openDeleteModal(${t.id})" title="Delete task">⊗</button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ─── Pagination ───────────────────────────────────────────
function renderPagination() {
  const { page, limit, total, totalPages } = state.pagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  document.getElementById("pagination-info").textContent =
    total === 0 ? "No tasks found" : `Showing ${start}–${end} of ${total} tasks`;

  const controls = document.getElementById("pagination-controls");
  let html = `
    <button class="page-btn" onclick="goToPage(${page - 1})" ${page <= 1 ? "disabled" : ""}>←</button>
  `;

  const range = getPaginationRange(page, totalPages);
  for (const p of range) {
    if (p === "...") {
      html += `<span style="padding:0 4px;color:var(--text-muted)">…</span>`;
    } else {
      html += `<button class="page-btn ${p === page ? "active" : ""}" onclick="goToPage(${p})">${p}</button>`;
    }
  }

  html += `<button class="page-btn" onclick="goToPage(${page + 1})" ${page >= totalPages ? "disabled" : ""}>→</button>`;
  controls.innerHTML = html;
}

function getPaginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

async function goToPage(page) {
  if (page < 1 || page > state.pagination.totalPages) return;
  state.pagination.page = page;
  await loadTasks();
}

// ─── Load Tasks ───────────────────────────────────────────
let searchDebounce;
async function loadTasks() {
  if (state.loading) return;
  state.loading = true;
  renderSkeletons();

  try {
    const res = await api.getTasks();
    state.tasks = res.data;
    state.pagination = res.pagination;
    renderTasks();
    renderPagination();
  } catch (e) {
    toast("Failed to load tasks. Check your connection.", "error");
    document.getElementById("task-tbody").innerHTML = "";
  } finally {
    state.loading = false;
  }
}

// ─── Sort ─────────────────────────────────────────────────
function sortBy(field) {
  if (state.filters.sortBy === field) {
    state.filters.sortOrder = state.filters.sortOrder === "ASC" ? "DESC" : "ASC";
  } else {
    state.filters.sortBy = field;
    state.filters.sortOrder = "ASC";
  }
  state.pagination.page = 1;

  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.classList.remove("sort-active");
    th.querySelector(".sort-indicator").textContent = "⇅";
  });
  const activeTh = document.querySelector(`th[data-sort="${field}"]`);
  if (activeTh) {
    activeTh.classList.add("sort-active");
    activeTh.querySelector(".sort-indicator").textContent = state.filters.sortOrder === "ASC" ? "↑" : "↓";
  }

  loadTasks();
}

// ─── Add/Edit Modal ───────────────────────────────────────
function openAddModal() {
  state.editingTask = null;
  document.getElementById("modal-eyebrow").textContent = "New Task";
  document.getElementById("modal-title").textContent = "Create Task";
  document.getElementById("task-form").reset();
  document.getElementById("form-submit-btn").textContent = "Create Task";
  openModal("task-modal");
}

function openEditModal(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  state.editingTask = task;

  document.getElementById("modal-eyebrow").textContent = "Edit Task";
  document.getElementById("modal-title").textContent = "Update Task";
  document.getElementById("task-title-input").value = task.title;
  document.getElementById("task-desc-input").value = task.description || "";
  document.getElementById("task-priority-input").value = task.priority;
  document.getElementById("task-status-input").value = task.status;
  document.getElementById("task-hours-input").value = task.estimated_hours || "";
  document.getElementById("form-submit-btn").textContent = "Save Changes";

  openModal("task-modal");
}

async function handleTaskSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById("form-submit-btn");
  const payload = {
    title: document.getElementById("task-title-input").value.trim(),
    description: document.getElementById("task-desc-input").value.trim() || null,
    priority: document.getElementById("task-priority-input").value,
    status: document.getElementById("task-status-input").value,
    estimated_hours: document.getElementById("task-hours-input").value || null,
  };

  if (!payload.title) {
    toast("Title is required.", "error");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="loading-spinner"></span> Saving…`;

  try {
    if (state.editingTask) {
      await api.updateTask(state.editingTask.id, payload);
      toast("Task updated successfully.", "success");
    } else {
      await api.createTask(payload);
      toast("Task created successfully.", "success");
    }
    closeModal("task-modal");
    await loadTasks();
    await loadMetrics();
  } catch (err) {
    toast(err.message || "Failed to save task.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = state.editingTask ? "Save Changes" : "Create Task";
  }
}

// ─── Delete Modal ─────────────────────────────────────────
function openDeleteModal(id) {
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  state.deletingTaskId = id;
  document.getElementById("delete-task-name").textContent = task.title;
  openModal("delete-modal");
}

async function confirmDelete() {
  if (!state.deletingTaskId) return;
  const btn = document.getElementById("confirm-delete-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="loading-spinner"></span> Deleting…`;

  try {
    await api.deleteTask(state.deletingTaskId);
    toast("Task deleted.", "success");
    closeModal("delete-modal");
    state.deletingTaskId = null;
    if (state.tasks.length === 1 && state.pagination.page > 1) {
      state.pagination.page--;
    }
    await loadTasks();
    await loadMetrics();
  } catch (err) {
    toast(err.message || "Failed to delete task.", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Delete Task";
  }
}

// ─── Modal helpers ────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
  document.body.style.overflow = "";
}

// ─── Init ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadMetrics();
  loadTasks();

  // Search
  document.getElementById("header-search").addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.filters.search = e.target.value.trim();
      state.pagination.page = 1;
      loadTasks();
    }, 350);
  });

  // Filters
  document.getElementById("filter-priority").addEventListener("change", (e) => {
    state.filters.priority = e.target.value;
    state.pagination.page = 1;
    loadTasks();
  });

  document.getElementById("filter-status").addEventListener("change", (e) => {
    state.filters.status = e.target.value;
    state.pagination.page = 1;
    loadTasks();
  });

  document.getElementById("filter-limit").addEventListener("change", (e) => {
    state.pagination.limit = parseInt(e.target.value);
    state.pagination.page = 1;
    loadTasks();
  });

  // Form submit
  document.getElementById("task-form").addEventListener("submit", handleTaskSubmit);

  // Close modals on overlay click
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("open");
        document.body.style.overflow = "";
      }
    });
  });

  // Keyboard escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.open").forEach((m) => {
        m.classList.remove("open");
        document.body.style.overflow = "";
      });
    }
  });
});
