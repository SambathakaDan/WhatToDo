// app.js (C): the app's logic.
// state holds the data, actions change it, render() redraws the screen with B's functions.

const state = {
  lists: [],
  tasks: [],
  view: "all", // "today" | "important" | "all" | a list id (number)
  shown: []    // tasks that match the current view; B's renderTasks draws these
};

// Today's date as "YYYY-MM-DD" in the browser's local time.
// (toISOString() would use UTC and give the wrong day in the early morning in Cambodia.)
function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

// The Today / Important / All / one-list logic.
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

// Runs a request; on failure shows the error and redraws so the screen matches the data.
async function safely(work) {
  try {
    await work();
  } catch (err) {
    alert(err.message);
    render();
  }
}

const actions = {
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
    return actions.updateTask(id, { done: !task.done });
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
      state.tasks = state.tasks.filter(t => t.list_id !== id); // A's route deletes them too
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
  render();
}

init();