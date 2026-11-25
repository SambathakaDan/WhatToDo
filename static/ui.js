// ui.js (B): draws the screen from `state`, reports clicks to `actions`.
// Never calls the server. All user text goes in with textContent.
let currentActions = null; // remembered so the static add-task form can use it
let openId = null;         // id of the task that is expanded for editing

const REPEAT_OPTIONS = [
  ["none", "Does not repeat"],
  ["daily", "Every day"],
  ["weekly", "Every week"],
  ["monthly", "Every month"],
  ["mon", "Every Monday"],
  ["tue", "Every Tuesday"],
  ["wed", "Every Wednesday"],
  ["thu", "Every Thursday"],
  ["fri", "Every Friday"],
  ["sat", "Every Saturday"],
  ["sun", "Every Sunday"]
];

const REPEAT_BADGES = {
  daily: "Repeats daily",
  weekly: "Repeats weekly",
  monthly: "Repeats monthly",
  mon: "Every Mon",
  tue: "Every Tue",
  wed: "Every Wed",
  thu: "Every Thu",
  fri: "Every Fri",
  sat: "Every Sat",
  sun: "Every Sun"
};

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

  const top = make("div", "sidebar-top");
  top.appendChild(make("span", "brand", "WhatToDo"));
  const toggleBtn = make("button", "", state.theme === "dark" ? "Light" : "Dark");
  toggleBtn.id = "theme-toggle";
  toggleBtn.type = "button";
  toggleBtn.onclick = () => actions.toggleTheme();
  top.appendChild(toggleBtn);
  box.appendChild(top);

  function item(label, view, onDelete) {
    const row = make("div", "nav" + (state.view === view ? " active" : ""));
    const name = make("button", "name", label);
    name.onclick = () => actions.setView(view);
    row.appendChild(name);
    if (onDelete) {
      const x = make("button", "x", "\u00d7");
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
    const star = make("button", "star" + (t.important ? " on" : ""), t.important ? "\u2605" : "\u2606");
    star.title = "Important";
    star.onclick = () => actions.updateTask(t.id, { important: !t.important });
    row.appendChild(check);
    row.appendChild(title);
    if (t.due_date) row.appendChild(make("span", "due", t.due_date));
    if (t.repeat && t.repeat !== "none") {
      row.appendChild(make("span", "due repeat-badge", REPEAT_BADGES[t.repeat] || ("Repeats " + t.repeat)));
    }
    if (t.remind_at) row.appendChild(make("span", "due", "Remind " + t.remind_at.slice(5, 10) + " " + t.remind_at.slice(11, 16)));
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

  const dateLabel = make("label", "field-group", "Due date");
  const date = make("input");
  date.type = "date";
  date.value = t.due_date || "";
  date.onchange = () => actions.updateTask(t.id, { due_date: date.value || null });
  dateLabel.appendChild(date);

  const repeatLabel = make("label", "field-group", "Repeat");
  const repeat = make("select", "repeat-select");
  REPEAT_OPTIONS.forEach(pair => {
    const opt = make("option", "", pair[1]);
    opt.value = pair[0];
    repeat.appendChild(opt);
  });
  repeat.value = t.repeat || "none";
  repeat.onchange = () => actions.updateTask(t.id, { repeat: repeat.value });
  repeatLabel.appendChild(repeat);

  const remindLabel = make("label", "field-group", "Remind me");
  const remind = make("input");
  remind.type = "datetime-local";
  remind.value = t.remind_at ? t.remind_at.slice(0, 16) : "";
  remind.onchange = () => actions.updateTask(t.id, { remind_at: remind.value || null });
  remindLabel.appendChild(remind);

  const del = make("button", "del", "Delete task");
  del.onclick = () => { openId = null; actions.deleteTask(t.id); };

  panel.append(title, note, dateLabel, repeatLabel, remindLabel, del);
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
