const STORAGE_KEY = "memo-app.v1";
const COLORS = ["#d7dde6", "#8aa0b8", "#7f8f72", "#c4a574", "#b57a7a", "#8b7ea8"];
const els = {
  app: document.getElementById("app"),
  list: document.getElementById("memo-list"),
  listEmpty: document.getElementById("list-empty"),
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
  back: document.getElementById("back-btn"),
  updated: document.getElementById("updated-at"),
  chars: document.getElementById("char-count"),
  colors: document.getElementById("color-picks"),
  countAll: document.getElementById("count-all"),
  countPinned: document.getElementById("count-pinned"),
  countArchive: document.getElementById("count-archive"),
};
let state = { memos: [], selectedId: null, filter: "all", query: "", editing: false };
function isMobile() { return window.matchMedia("(max-width: 859px)").matches; }
function uid() { return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(); }
function load() { try { const raw = localStorage.getItem(STORAGE_KEY); state.memos = raw ? JSON.parse(raw) : seed(); } catch { state.memos = seed(); } }
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.memos)); }
function seed() { const now = Date.now(); return [{ id: uid(), title: "ようこそ", body: "これはこのブラウザに保存されるメモアプリです。\n\n・新規作成\n・編集（自動保存）\n・ピン留め / アーカイブ / 削除\n・色分けと検索\n\nが使えます。", color: COLORS[1], pinned: true, archived: false, createdAt: now, updatedAt: now }]; }
function selected() { return state.memos.find((m) => m.id === state.selectedId) || null; }
function filtered() { const q = state.query.trim().toLowerCase(); return state.memos.filter((m) => { if (state.filter === "pinned") return m.pinned && !m.archived; if (state.filter === "archive") return m.archived; return !m.archived; }).filter((m) => !q || `${m.title}\n${m.body}`.toLowerCase().includes(q)).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt); }
function formatDate(ts) { return new Date(ts).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
function openEditor(id) { state.selectedId = id; state.editing = true; render(); }
function closeEditor() { state.editing = false; if (isMobile()) state.selectedId = null; render(); }
function renderList() { const items = filtered(); els.listEmpty.classList.toggle("hidden", items.length > 0); els.list.innerHTML = items.map((m) => { const preview = m.body.replace(/\s+/g, " ").trim() || "本文なし"; const active = m.id === state.selectedId ? "is-active" : ""; return `<li class="memo-item ${active}" data-id="${m.id}"><h3><span class="dot" style="background:${m.color}"></span>${escapeHtml(m.title || "無題")}${m.pinned ? '<span class="pin-mark">ピン</span>' : ""}</h3><p>${escapeHtml(preview)}</p></li>`; }).join(""); els.countAll.textContent = state.memos.filter((m) => !m.archived).length; els.countPinned.textContent = state.memos.filter((m) => m.pinned && !m.archived).length; els.countArchive.textContent = state.memos.filter((m) => m.archived).length; }
function renderEditor() { const memo = selected(); els.app.classList.toggle("is-editing", state.editing && !!memo); if (!memo) { els.editor.classList.add("hidden"); els.empty.classList.toggle("hidden", state.memos.length > 0); return; } els.empty.classList.add("hidden"); els.editor.classList.remove("hidden"); if (document.activeElement !== els.title && document.activeElement !== els.body) { els.title.value = memo.title; els.body.value = memo.body; } els.pin.textContent = memo.pinned ? "外す" : "ピン"; els.archive.textContent = memo.archived ? "戻す" : "アーカイブ"; els.updated.textContent = formatDate(memo.updatedAt); els.chars.textContent = `${memo.body.length}字`; renderColors(memo.color); }
function renderColors(current) { els.colors.innerHTML = COLORS.map((c) => `<button type="button" class="color-btn ${c === current ? "is-selected" : ""}" data-color="${c}" style="background:${c}" aria-label="色を変更"></button>`).join(""); }
function escapeHtml(s) { return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function createMemo() { const now = Date.now(); const memo = { id: uid(), title: "", body: "", color: COLORS[0], pinned: false, archived: false, createdAt: now, updatedAt: now }; state.memos.unshift(memo); state.filter = "all"; save(); openEditor(memo.id); setTimeout(() => els.title.focus(), 50); }
function updateSelected(patch) { const memo = selected(); if (!memo) return; Object.assign(memo, patch, { updatedAt: Date.now() }); save(); render(); }
function render() { renderList(); renderEditor(); }
els.newBtn.addEventListener("click", createMemo);
els.emptyNew.addEventListener("click", createMemo);
els.back.addEventListener("click", closeEditor);
els.search.addEventListener("input", (e) => { state.query = e.target.value; renderList(); });
document.querySelectorAll(".filter").forEach((btn) => { btn.addEventListener("click", () => { document.querySelectorAll(".filter").forEach((b) => b.classList.remove("is-active")); btn.classList.add("is-active"); state.filter = btn.dataset.filter; renderList(); }); });
els.list.addEventListener("click", (e) => { const item = e.target.closest(".memo-item"); if (!item) return; openEditor(item.dataset.id); });
els.title.addEventListener("input", () => updateSelected({ title: els.title.value }));
els.body.addEventListener("input", () => updateSelected({ body: els.body.value }));
els.pin.addEventListener("click", () => updateSelected({ pinned: !selected().pinned }));
els.archive.addEventListener("click", () => updateSelected({ archived: !selected().archived }));
els.del.addEventListener("click", () => { const memo = selected(); if (!memo) return; if (!confirm("このメモを削除しますか？")) return; state.memos = state.memos.filter((m) => m.id !== memo.id); state.selectedId = null; state.editing = false; save(); render(); });
els.colors.addEventListener("click", (e) => { const btn = e.target.closest("[data-color]"); if (!btn) return; updateSelected({ color: btn.dataset.color }); });
window.addEventListener("resize", () => { if (!isMobile() && state.selectedId) state.editing = true; render(); });
load();
if (!isMobile() && state.memos[0]) { state.selectedId = state.memos[0].id; state.editing = true; }
render();
