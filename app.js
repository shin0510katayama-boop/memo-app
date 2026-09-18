const STORAGE_KEY = "memo-app.v1";
const COLORS = ["#f4efe6", "#f8e3d4", "#e7f0e4", "#e4ecf6", "#f3e6f1", "#f7e9c8"];

const els = {
  list: document.getElementById("memo-list"),
  search: document.getElementById("search"),
  newBtn: document.getElementById("new-btn"),
  emptyNew: document.getElementById("empty-new"),
  empty: document.getElementById("empty-state"),
  editor: document.getElementById("editor"),
  title: document.getElementById("title"),
  body: document.getElementById("body"),
  pin: document.getElementById("pin-btn"),
  archive: document.getElementById("archive-btn"),
  del: document.getElementById("delete-btn"),
  updated: document.getElementById("updated-at"),
  chars: document.getElementById("char-count"),
  colors: document.getElementById("color-picks"),
  countAll: document.getElementById("count-all"),
  countPinned: document.getElementById("count-pinned"),
  countArchive: document.getElementById("count-archive"),
};

let state = {
  memos: [],
  selectedId: null,
  filter: "all",
  query: "",
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.memos = raw ? JSON.parse(raw) : seed();
  } catch {
    state.memos = seed();
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.memos));
}

function seed() {
  const now = Date.now();
  return [
    {
      id: uid(),
      title: "ようこそ",
      body: "これはこのブラウザに保存されるメモアプリです。\n\n・新規作成\n・編集（自動保存）\n・ピン留め / アーカイブ / 削除\n・色分けと検索\n\nが使えます。",
      color: COLORS[1],
      pinned: true,
      archived: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function selected() {
  return state.memos.find((m) => m.id === state.selectedId) || null;
}

function filtered() {
  const q = state.query.trim().toLowerCase();
  return state.memos
    .filter((m) => {
      if (state.filter === "pinned") return m.pinned && !m.archived;
      if (state.filter === "archive") return m.archived;
      return !m.archived;
    })
    .filter((m) => !q || `${m.title}\n${m.body}`.toLowerCase().includes(q))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

function formatDate(ts) {
  return new Date(ts).toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderList() {
  const items = filtered();
  els.list.innerHTML = items
    .map((m) => {
      const preview = m.body.replace(/\s+/g, " ").trim() || "本文なし";
      const active = m.id === state.selectedId ? "is-active" : "";
      return `<li class="memo-item ${active}" data-id="${m.id}">
        <h3>
          <span class="dot" style="background:${m.color}"></span>
          ${escapeHtml(m.title || "無題")}
          ${m.pinned ? '<span class="pin-mark">ピン</span>' : ""}
        </h3>
        <p>${escapeHtml(preview)}</p>
      </li>`;
    })
    .join("");

  els.countAll.textContent = state.memos.filter((m) => !m.archived).length;
  els.countPinned.textContent = state.memos.filter((m) => m.pinned && !m.archived).length;
  els.countArchive.textContent = state.memos.filter((m) => m.archived).length;
}

function renderEditor() {
  const memo = selected();
  if (!memo) {
    els.editor.classList.add("hidden");
    els.empty.classList.remove("hidden");
    return;
  }
  els.empty.classList.add("hidden");
  els.editor.classList.remove("hidden");
  if (document.activeElement !== els.title && document.activeElement !== els.body) {
    els.title.value = memo.title;
    els.body.value = memo.body;
  }
  els.pin.textContent = memo.pinned ? "ピン解除" : "ピン";
  els.archive.textContent = memo.archived ? "元に戻す" : "アーカイブ";
  els.updated.textContent = `更新: ${formatDate(memo.updatedAt)}`;
  els.chars.textContent = `${memo.body.length} 文字`;
  renderColors(memo.color);
}

function renderColors(current) {
  els.colors.innerHTML = COLORS.map(
    (c) =>
      `<button type="button" class="color-btn ${c === current ? "is-selected" : ""}" data-color="${c}" style="background:${c}" aria-label="色を変更"></button>`
  ).join("");
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createMemo() {
  const now = Date.now();
  const memo = {
    id: uid(),
    title: "",
    body: "",
    color: COLORS[0],
    pinned: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  state.memos.unshift(memo);
  state.selectedId = memo.id;
  state.filter = "all";
  save();
  render();
  els.title.focus();
}

function updateSelected(patch) {
  const memo = selected();
  if (!memo) return;
  Object.assign(memo, patch, { updatedAt: Date.now() });
  save();
  render();
}

function render() {
  renderList();
  renderEditor();
}

els.newBtn.addEventListener("click", createMemo);
els.emptyNew.addEventListener("click", createMemo);
els.search.addEventListener("input", (e) => {
  state.query = e.target.value;
  renderList();
});
document.querySelectorAll(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    state.filter = btn.dataset.filter;
    render();
  });
});
els.list.addEventListener("click", (e) => {
  const item = e.target.closest(".memo-item");
  if (!item) return;
  state.selectedId = item.dataset.id;
  render();
});
els.title.addEventListener("input", () => updateSelected({ title: els.title.value }));
els.body.addEventListener("input", () => updateSelected({ body: els.body.value }));
els.pin.addEventListener("click", () => updateSelected({ pinned: !selected().pinned }));
els.archive.addEventListener("click", () => updateSelected({ archived: !selected().archived }));
els.del.addEventListener("click", () => {
  const memo = selected();
  if (!memo) return;
  if (!confirm("このメモを削除しますか？")) return;
  state.memos = state.memos.filter((m) => m.id !== memo.id);
  state.selectedId = null;
  save();
  render();
});
els.colors.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-color]");
  if (!btn) return;
  updateSelected({ color: btn.dataset.color });
});

load();
if (state.memos[0]) state.selectedId = state.memos[0].id;
render();
