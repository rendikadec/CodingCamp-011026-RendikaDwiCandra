// Daily Desk: JavaScript dasar untuk dashboard.
// Tiga challenge: Dark Mode, Custom Name, dan Prevent Duplicate Tasks.

const $ = (id) => document.getElementById(id);

const KEY = {
  tasks: "daily_desk_tasks",
  links: "daily_desk_links",
  name: "daily_desk_name",
  theme: "daily_desk_theme"
};

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showMessage("Data tidak dapat disimpan di browser.");
  }
}

let tasks = readStorage(KEY.tasks, []);
let links = readStorage(KEY.links, []);
let userName = readStorage(KEY.name, "");
let theme = readStorage(KEY.theme, "light");
let currentFilter = "all";
let timerSeconds = 25 * 60;
let timerInterval = null;
let messageTimeout;

if (!Array.isArray(tasks)) tasks = [];
if (!Array.isArray(links)) links = [];

function showMessage(text) {
  $("message").textContent = text;
  $("message").classList.add("show");
  clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => $("message").classList.remove("show"), 2400);
}

// Jam, tanggal, dan sapaan otomatis.
function updateDateAndTime() {
  const now = new Date();
  $("clock").textContent = now.toLocaleTimeString("id-ID", { hour12: false });
  $("date").textContent = now.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  $("topDate").textContent = now.toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric"
  });

  const hour = now.getHours();
  let greeting = "Selamat malam";
  if (hour >= 4 && hour < 11) greeting = "Selamat pagi";
  else if (hour >= 11 && hour < 15) greeting = "Selamat siang";
  else if (hour >= 15 && hour < 18) greeting = "Selamat sore";

  $("greeting").textContent = `${greeting}, ${userName || "Teman"}!`;
}
updateDateAndTime();
setInterval(updateDateAndTime, 1000);

// CHALLENGE 1: Custom Name in Greeting.
$("nameButton").addEventListener("click", () => {
  const answer = prompt("Nama apa yang ingin ditampilkan?", userName);
  if (answer === null) return;

  userName = answer.trim().replace(/\s+/g, " ").slice(0, 32);
  saveStorage(KEY.name, userName);
  updateDateAndTime();
  showMessage("Nama sapaan berhasil diperbarui.");
});

// CHALLENGE 2: Light / Dark Mode.
function applyTheme() {
  document.body.classList.toggle("dark", theme === "dark");
  $("themeButton").textContent = theme === "dark" ? "☀" : "☾";
  $("themeButton").title = theme === "dark" ? "Aktifkan light mode" : "Aktifkan dark mode";
}
$("themeButton").addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  saveStorage(KEY.theme, theme);
  applyTheme();
});
applyTheme();

// Focus timer dasar 25 menit.
function displayTimer() {
  const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, "0");
  const seconds = (timerSeconds % 60).toString().padStart(2, "0");
  $("timer").textContent = `${minutes}:${seconds}`;
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

$("startTimer").addEventListener("click", () => {
  if (timerInterval || timerSeconds <= 0) return;
  timerInterval = setInterval(() => {
    timerSeconds--;
    displayTimer();

    if (timerSeconds <= 0) {
      stopTimer();
      showMessage("Waktu fokus selesai. Istirahat sebentar, ya!");
    }
  }, 1000);
});

$("stopTimer").addEventListener("click", stopTimer);

$("resetTimer").addEventListener("click", () => {
  stopTimer();
  timerSeconds = 25 * 60;
  displayTimer();
});
displayTimer();

// To-Do List: tambah, edit, tandai selesai, hapus.
function renderTasks() {
  const list = $("taskList");
  list.innerHTML = "";

  let visibleTasks = tasks.filter(task => {
    if (currentFilter === "active") return !task.done;
    if (currentFilter === "done") return task.done;
    return true;
  });

  if (visibleTasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Belum ada tugas pada daftar ini.";
    list.appendChild(empty);
  }

  visibleTasks.forEach(task => {
    const item = document.createElement("li");
    item.className = "task-item" + (task.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", "Tandai tugas selesai");
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveStorage(KEY.tasks, tasks);
      renderTasks();
    });

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const editButton = document.createElement("button");
    editButton.className = "small-button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      const answer = prompt("Ubah nama tugas:", task.title);
      if (answer === null) return;
      const newTitle = answer.trim().replace(/\s+/g, " ");
      if (!newTitle) return showMessage("Nama tugas tidak boleh kosong.");

      // CHALLENGE 3: Prevent Duplicate Tasks.
      const duplicate = tasks.some(other =>
        other.id !== task.id && other.title.toLowerCase() === newTitle.toLowerCase()
      );
      if (duplicate) return showMessage("Tugas dengan nama itu sudah ada.");

      task.title = newTitle;
      saveStorage(KEY.tasks, tasks);
      renderTasks();
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "small-button delete";
    deleteButton.textContent = "Hapus";
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter(other => other.id !== task.id);
      saveStorage(KEY.tasks, tasks);
      renderTasks();
    });

    item.append(checkbox, title, editButton, deleteButton);
    list.appendChild(item);
  });

  const doneCount = tasks.filter(task => task.done).length;
  $("taskCount").textContent = tasks.length;
  $("taskSummary").textContent = `${doneCount} dari ${tasks.length} tugas selesai`;
}

$("taskForm").addEventListener("submit", event => {
  event.preventDefault();
  const title = $("taskInput").value.trim().replace(/\s+/g, " ");
  if (!title) return;

  // CHALLENGE 3: cek apakah nama tugas sudah ada.
  const duplicate = tasks.some(task => task.title.toLowerCase() === title.toLowerCase());
  if (duplicate) {
    showMessage("Tugas dengan nama itu sudah ada.");
    return;
  }

  tasks.push({
    id: Date.now().toString() + Math.random().toString(16).slice(2),
    title,
    done: false
  });
  saveStorage(KEY.tasks, tasks);
  $("taskInput").value = "";
  currentFilter = "all";
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.filter === "all");
  });
  renderTasks();
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    currentFilter = tab.dataset.filter;
    document.querySelectorAll(".tab").forEach(other => {
      other.classList.toggle("active", other === tab);
    });
    renderTasks();
  });
});

$("clearDone").addEventListener("click", () => {
  const before = tasks.length;
  tasks = tasks.filter(task => !task.done);
  saveStorage(KEY.tasks, tasks);
  renderTasks();
  showMessage(before === tasks.length ? "Belum ada tugas selesai." : "Tugas selesai sudah dibersihkan.");
});

renderTasks();

// Quick Links: simpan tautan favorit di Local Storage.
function renderLinks() {
  const list = $("linkList");
  list.innerHTML = "";

  if (links.length === 0) {
    const empty = document.createElement("li");
    empty.className = "link-empty";
    empty.textContent = "Belum ada link favorit. Tambahkan di atas.";
    list.appendChild(empty);
    return;
  }

  links.forEach(link => {
    const item = document.createElement("li");
    item.className = "link-item";

    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.name;

    const host = document.createElement("span");
    host.className = "link-host";
    try {
      host.textContent = new URL(link.url).hostname;
    } catch {
      host.textContent = link.url;
    }
    anchor.appendChild(host);

    const deleteButton = document.createElement("button");
    deleteButton.className = "small-button delete";
    deleteButton.textContent = "Hapus";
    deleteButton.addEventListener("click", () => {
      links = links.filter(other => other.id !== link.id);
      saveStorage(KEY.links, links);
      renderLinks();
    });

    item.append(anchor, deleteButton);
    list.appendChild(item);
  });
}

$("linkForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = $("linkName").value.trim();
  let urlText = $("linkUrl").value.trim();
  if (!name || !urlText) return;

  if (!/^https?:\/\//i.test(urlText)) urlText = "https://" + urlText;

  let url;
  try {
    url = new URL(urlText);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) {
      throw new Error("URL tidak valid");
    }
  } catch {
    showMessage("Alamat website tidak valid.");
    return;
  }

  const duplicate = links.some(link =>
    link.name.toLowerCase() === name.toLowerCase() || link.url === url.href
  );
  if (duplicate) return showMessage("Nama atau URL link tersebut sudah ada.");

  links.push({ id: Date.now().toString(), name, url: url.href });
  saveStorage(KEY.links, links);
  $("linkName").value = "";
  $("linkUrl").value = "";
  renderLinks();
  showMessage("Link berhasil ditambahkan.");
});
renderLinks();
