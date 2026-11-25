// app.js (C): the app's logic.
// state holds the data, actions change it, render() redraws the screen with B's functions.
const THEME_KEY = "pyrite-theme";

function getSavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

const state = {
  lists: [],
  tasks: [],
  view: "all", // "today" | "important" | "all" | a list id (number)
  shown: [],   // tasks that match the current view; B's renderTasks draws these
  theme: getSavedTheme()
};

applyTheme(state.theme);

const WEEKDAY_MAP = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

function dateToString(d) {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

function todayString() {
  return dateToString(new Date());
}

// Computes the next due date strictly after today.
function nextDueDate(task) {
  const today = todayString();
  const d = task.due_date ? new Date(task.due_date + "T00:00:00") : new Date();

  if (task.repeat in WEEKDAY_MAP) {
    const targetDay = WEEKDAY_MAP[task.repeat];
    do {
      d.setDate(d.getDate() + 1);
    } while (d.getDay() !== targetDay || dateToString(d) <= today);
    return dateToString(d);
  }

  do {
    if (task.repeat === "daily") d.setDate(d.getDate() + 1);
    else if (task.repeat === "weekly") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  } while (dateToString(d) <= today);
  return dateToString(d);
}

function computeShown() {
  const today = todayString();
  state.shown = state.tasks.filter(t => {
    if (state.view === "today") return t.due_date === today;
    if (state.view === "important") return t.important;
    if (state.view === "all") return true;
    return t.list_id === state.view;
  });
}

function render() {
  computeShown();
  renderSidebar(state, actions);
  renderTasks(state, actions);
}

async function safely(work) {
  try {
    await work();
  } catch (err) {
    alert(err.message);
    render();
  }
}

// ---------- reminders ----------
const firedReminders = new Set();

function reminderKey(t) {
  return t.id + ":" + t.remind_at;
}

function markOldReminders() {
  const now = new Date();
  state.tasks.forEach(t => {
    if (t.remind_at && new Date(t.remind_at) <= now) firedReminders.add(reminderKey(t));
  });
}

function toastBox() {
  let box = document.getElementById("toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    box.style.cssText = "position:fixed;right:16px;bottom:16px;display:flex;flex-direction:column;gap:8px;z-index:1000";
    document.body.appendChild(box);
  }
  return box;
}

function showReminder(t) {
  const toast = document.createElement("div");
  toast.textContent = "Reminder: " + t.title;
  toast.style.cssText = "max-width:280px;padding:12px 16px;border-radius:8px;background:var(--toast-bg);color:var(--toast-ink);border:1px solid var(--toast-line);box-shadow:0 4px 12px rgba(0,0,0,.35);cursor:pointer";
  toast.onclick = () => toast.remove();
  toastBox().appendChild(toast);
  setTimeout(() => toast.remove(), 20000);
}

function checkReminders() {
  const now = new Date();
  state.tasks.forEach(t => {
    if (!t.remind_at || t.done) return;
    const key = reminderKey(t);
    if (firedReminders.has(key) || new Date(t.remind_at) > now) return;
    firedReminders.add(key);
    showReminder(t);
  });
}

const actions = {
  toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme(state.theme);
    render();
  },
  setView(view) {
    state.view = view;
    render();
  },
  addTask(title) {
    return safely(async () => {
      if (state.lists.length === 0) {
        state.lists.push(await api("POST", "/lists", { name: "My Tasks" }));
      }
      const listId = typeof state.view === "number" ? state.view : state.lists[0].id;
      const body = { list_id: listId, title: title };
      if (state.view === "today") body.due_date = todayString();
      if (state.view === "important") body.important = true;
      state.tasks.push(await api("POST", "/tasks", body));
      render();
    });
  },
  updateTask(id, changes) {
    return safely(async () => {
      const updated = await api("PATCH", "/tasks/" + id, changes);
      state.tasks = state.tasks.map(t => (t.id === id ? updated : t));
      render();
    });
  },
  toggleDone(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    const nowDone = !task.done;
    return safely(async () => {
      const updated = await api("PATCH", "/tasks/" + id, { done: nowDone });
      state.tasks = state.tasks.map(t => (t.id === id ? updated : t));
      if (nowDone && updated.repeat && updated.repeat !== "none") {
        const next = nextDueDate(updated);
        state.tasks.push(await api("POST", "/tasks", {
          list_id: updated.list_id,
          title: updated.title,
          note: updated.note,
          important: updated.important,
          repeat: updated.repeat,
          due_date: next,
          remind_at: updated.remind_at ? next + "T" + updated.remind_at.slice(11, 16) : null
        }));
      }
      render();
    });
  },
  deleteTask(id) {
    return safely(async () => {
      await api("DELETE", "/tasks/" + id);
      state.tasks = state.tasks.filter(t => t.id !== id);
      render();
    });
  },
  addList(name) {
    return safely(async () => {
      const created = await api("POST", "/lists", { name: name });
      state.lists.push(created);
      state.view = created.id;
      render();
    });
  },
  deleteList(id) {
    if (!confirm("Delete this list and all its tasks?")) return;
    return safely(async () => {
      await api("DELETE", "/lists/" + id);
      state.lists = state.lists.filter(l => l.id !== id);
      state.tasks = state.tasks.filter(t => t.list_id !== id);
      if (state.view === id) state.view = "all";
      render();
    });
  }
};

async function init() {
  await safely(async () => {
    const [lists, tasks] = await Promise.all([api("GET", "/lists"), api("GET", "/tasks")]);
    state.lists = lists;
    state.tasks = tasks;
  });
  markOldReminders();
  render();
  setInterval(checkReminders, 10000);
}

init();
