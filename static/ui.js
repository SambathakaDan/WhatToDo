// ui.js (B): draws the screen from `state`, reports clicks to `actions`.
// Never calls the server. All user text goes in with textContent.

let currentActions = null; // remembered so the static add-task form can use it
let openId = null;         // id of the task that is expanded for editing

function make(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ---------- sidebar ----------
function renderSidebar(state, actions) {
  currentActions = actions;
  const box = document.getElementById("sidebar");
  box.innerHTML = "";

  function item(label, view, onDelete) {
    const row = make("div", "nav" + (state.view === view ? " active" : ""));
    const name = make("button", "name", label);
    name.onclick = () => actions.setView(view);
    row.appendChild(name);
    if (onDelete) {
      const x = make("button", "x", "×");
      x.title = "Delete list";
      x.onclick = onDelete;
      row.appendChild(x);
    }
    box.appendChild(row);
  }

  item("Today", "today");
  item("Important", "important");
  item("All", "all");

  box.appendChild(make("h3", "", "Lists"));
  state.lists.forEach(l => item(l.name, l.id, () => actions.deleteList(l.id)));

  const form = make("form");
  const input = make("input");
  input.placeholder = "+ New list";
  form.appendChild(input);
  form.onsubmit = e => {
    e.preventDefault();
    const name = input.value.trim();
    if (name) actions.addList(name);
  };
  box.appendChild(form);
}

// ---------- tasks ----------
function renderTasks(state, actions) {
  currentActions = actions;
  const box = document.getElementById("tasks");
  box.innerHTML = "";

  if (state.shown.length === 0) {
    box.appendChild(make("p", "empty", "Nothing here yet."));
    return;
  }

  state.shown.forEach(t => {
    const card = make("div", "task" + (t.done ? " done" : ""));
    const row = make("div", "row");

    const check = make("input");
    check.type = "checkbox";
    check.checked = t.done;
    check.onchange = () => actions.toggleDone(t.id);

    const title = make("button", "title", t.title);
    title.onclick = () => {
      openId = openId === t.id ? null : t.id;
      renderTasks(state, actions);
    };

    const star = make("button", "star" + (t.important ? " on" : ""), t.important ? "★" : "☆");
    star.title = "Important";
    star.onclick = () => actions.updateTask(t.id, { important: !t.important });

    row.appendChild(check);
    row.appendChild(title);
    if (t.due_date) row.appendChild(make("span", "due", t.due_date));
    row.appendChild(star);
    card.appendChild(row);

    if (openId === t.id) card.appendChild(editPanel(t, actions));
    box.appendChild(card);
  });
}

function editPanel(t, actions) {
  const panel = make("div", "edit");

  const title = make("input");
  title.value = t.title;
  title.onchange = () => {
    if (title.value.trim()) actions.updateTask(t.id, { title: title.value.trim() });
  };

  const note = make("textarea");
  note.rows = 2;
  note.placeholder = "Note";
  note.value = t.note || "";
  note.onchange = () => actions.updateTask(t.id, { note: note.value });

  const date = make("input");
  date.type = "date";
  date.value = t.due_date || "";
  date.onchange = () => actions.updateTask(t.id, { due_date: date.value || null });

  const del = make("button", "del", "Delete task");
  del.onclick = () => { openId = null; actions.deleteTask(t.id); };

  panel.append(title, note, date, del);
  return panel;
}

// ---------- add-task box (lives in index.html) ----------
document.getElementById("add-form").onsubmit = e => {
  e.preventDefault();
  const input = document.getElementById("add-title");
  const title = input.value.trim();
  if (title && currentActions) {
    currentActions.addTask(title);
    input.value = "";
  }
};
