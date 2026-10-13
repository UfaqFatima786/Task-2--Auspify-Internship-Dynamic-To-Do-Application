
const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");

const totalCount = document.getElementById("total-count");
const pendingCount = document.getElementById("pending-count");
const completedCount = document.getElementById("completed-count");
const progressPercent = document.getElementById("progress-percent");
const progressFill = document.getElementById("progress-fill");
const progressTrack = document.getElementById("progress-track");
const listCount = document.getElementById("list-count");

const filterButtons = document.querySelectorAll(".filter-btn");
const clearCompletedBtn = document.getElementById("clear-completed");

const STORAGE_KEY = "taskFlowTasks";

let tasks = [];
let currentFilter = "all";

// Load tasks safely from Local Storage
try {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (savedTasks) {
    const parsedTasks = JSON.parse(savedTasks);

    if (Array.isArray(parsedTasks)) {
      tasks = parsedTasks.filter(task =>
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.completed === "boolean" &&
        typeof task.createdAt === "string"
      );
    }
  }
} catch (error) {
  console.error("Unable to load saved tasks:", error);
}

// Save tasks
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Unable to save tasks:", error);
    alert("Tasks could not be saved. Check your browser storage settings.");
    return false;
  }
}

// Generate a unique ID
function generateId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return Date.now().toString(36) +
    Math.random().toString(36).slice(2);
}

// Format date and time
function formatDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recently added";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

// Update the dashboard statistics
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;

  const percentage = total === 0
    ? 0
    : Math.round((completed / total) * 100);

  totalCount.textContent = total;
  pendingCount.textContent = pending;
  completedCount.textContent = completed;

  progressPercent.textContent = `${percentage}%`;
  progressFill.style.width = `${percentage}%`;

  progressTrack.setAttribute("aria-valuenow", percentage);

  listCount.textContent =
    `${total} ${total === 1 ? "task" : "tasks"}`;
}

// Update the empty state
function updateEmptyState(visibleTasks) {
  const isEmpty = visibleTasks.length === 0;

  emptyState.hidden = !isEmpty;
  taskList.hidden = isEmpty;

  if (isEmpty) {
    const title = document.getElementById("empty-title");
    const message = document.getElementById("empty-message");

    if (currentFilter === "completed" && tasks.length > 0) {
      title.textContent = "No completed tasks yet";
      message.textContent = "Complete a task to see it here.";
    } else if (currentFilter === "pending" && tasks.length > 0) {
      title.textContent = "All caught up!";
      message.textContent = "You have no pending tasks.";
    } else {
      title.textContent = "Your space is ready!";
      message.textContent =
        "Add your first task and start making progress.";
    }
  }
}

// Create a task element safely
function createTaskElement(task) {
  const item = document.createElement("article");
  item.className = "task-item";

  if (task.completed) {
    item.classList.add("completed");
  }

  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = "complete-btn";
  completeButton.textContent = task.completed ? "✓" : "";
  completeButton.setAttribute(
    "aria-label",
    task.completed ? "Mark task as pending" : "Mark task as completed"
  );
  completeButton.setAttribute(
    "aria-pressed",
    String(task.completed)
  );

  completeButton.addEventListener("click", () => {
    toggleTask(task.id);
  });

  const info = document.createElement("div");
  info.className = "task-info";

  const title = document.createElement("p");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("p");
  meta.className = "task-meta";
  meta.textContent = `Added ${formatDate(task.createdAt)}`;

  info.append(title, meta);

  const status = document.createElement("span");
  status.className = "task-status";
  status.textContent = task.completed ? "Completed" : "In Progress";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "✕";
  deleteButton.setAttribute("aria-label", `Delete task: ${task.title}`);

  deleteButton.addEventListener("click", () => {
    deleteTask(task.id);
  });

  item.append(completeButton, info, status, deleteButton);

  return item;
}

// Display tasks according to the active filter
function renderTasks() {
  taskList.replaceChildren();

  const visibleTasks = tasks.filter(task => {
    if (currentFilter === "pending") {
      return !task.completed;
    }

    if (currentFilter === "completed") {
      return task.completed;
    }

    return true;
  });

  visibleTasks.forEach(task => {
    taskList.appendChild(createTaskElement(task));
  });

  updateEmptyState(visibleTasks);
  updateStats();
}

// Add a new task
function addTask(title) {
  const task = {
    id: generateId(),
    title: title,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(task);

  if (!saveTasks()) {
    tasks.shift();
    renderTasks();
    return;
  }

  renderTasks();
}

// Toggle task completion
function toggleTask(id) {
  const task = tasks.find(task => task.id === id);

  if (!task) return;

  task.completed = !task.completed;

  if (!saveTasks()) {
    task.completed = !task.completed;
    renderTasks();
    return;
  }

  renderTasks();
}

// Delete a task
function deleteTask(id) {
  const index = tasks.findIndex(task => task.id === id);

  if (index === -1) return;

  const removedTask = tasks.splice(index, 1)[0];

  if (!saveTasks()) {
    tasks.splice(index, 0, removedTask);
    renderTasks();
    return;
  }

  renderTasks();
}
taskForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = taskInput.value.trim();

  if (!title) {
    taskInput.focus();
    return;
  }

  addTask(title);
  taskInput.value = "";
  taskInput.focus();
});
filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;

    filterButtons.forEach(filterButton => {
      const isActive = filterButton === button;

      filterButton.classList.toggle("active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });

    renderTasks();
  });
});

clearCompletedBtn.addEventListener("click", () => {
  const previousTasks = tasks;
  const remainingTasks = tasks.filter(task => !task.completed);

  if (remainingTasks.length === previousTasks.length) {
    return;
  }

  tasks = remainingTasks;

  if (!saveTasks()) {
    tasks = previousTasks;
    renderTasks();
    return;
  }

  renderTasks();
});
document.getElementById("current-date").textContent =
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).toUpperCase();
renderTasks();
