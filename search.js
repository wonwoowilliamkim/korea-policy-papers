// ── Client-side search for Behavioral Econ Map ────────────────────────────

const searchInput   = document.getElementById("search");
const searchWrap    = document.querySelector(".search-wrap");

// Inject results container inside the search wrapper (for positioning)
const resultsEl = document.createElement("div");
resultsEl.id = "search-results";
searchWrap.appendChild(resultsEl);

let focusedIndex = -1;
let currentMatches = [];

// ── Score helper ──────────────────────────────────────────────────────────
function scoreMatch(n, q) {
  const label   = (n.label || "").toLowerCase();
  const summary = (n.summary || n.description || "").toLowerCase();
  const authors = (n.authors || []).join(" ").toLowerCase();
  const journal = (n.journal || "").toLowerCase();
  const name    = (n.name || "").toLowerCase();

  if (label === q)              return 100;
  if (label.startsWith(q))      return 80;
  if (label.includes(q))        return 60;
  if (authors.includes(q))      return 50;
  if (journal.includes(q))      return 40;
  if (name.includes(q))         return 55;
  if (summary.includes(q))      return 20;
  return 0;
}

// ── Input handler ─────────────────────────────────────────────────────────
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  focusedIndex = -1;

  if (!q || !window._graphNodes) {
    closeResults();
    return;
  }

  currentMatches = window._graphNodes
    .map(n => ({ node: n, score: scoreMatch(n, q) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 9)
    .map(x => x.node);

  if (!currentMatches.length) {
    closeResults();
    return;
  }

  renderResults(currentMatches);
});

// ── Render results ────────────────────────────────────────────────────────
function renderResults(matches) {
  resultsEl.innerHTML = matches.map((n, i) => {
    const color = getNodeColor(n);
    const sub = n.type === "paper"
      ? `${(n.authors||[]).slice(0,2).join(", ")}${(n.authors||[]).length>2?" et al.":""} · ${n.journal||""} ${n.year||""}`
      : n.type === "researcher"
      ? n.affiliation || ""
      : "";

    return `
      <div class="search-result-item" data-index="${i}">
        <span class="result-dot" style="background:${color}"></span>
        <div class="result-text">
          <div class="type-tag">${n.type}</div>
          <div class="result-label">${n.label}</div>
          ${sub ? `<div class="result-sub">${sub}</div>` : ""}
        </div>
      </div>`;
  }).join("");

  resultsEl.style.display = "block";

  resultsEl.querySelectorAll(".search-result-item").forEach(item => {
    item.addEventListener("click", () => {
      selectResult(parseInt(item.dataset.index));
    });
    item.addEventListener("mouseenter", () => {
      setFocus(parseInt(item.dataset.index));
    });
  });
}

// ── Keyboard navigation ───────────────────────────────────────────────────
searchInput.addEventListener("keydown", e => {
  if (resultsEl.style.display !== "block") return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    setFocus(Math.min(focusedIndex + 1, currentMatches.length - 1));
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setFocus(Math.max(focusedIndex - 1, 0));
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (focusedIndex >= 0) selectResult(focusedIndex);
    else if (currentMatches.length) selectResult(0);
  }
});

function setFocus(idx) {
  focusedIndex = idx;
  resultsEl.querySelectorAll(".search-result-item").forEach((el, i) => {
    el.classList.toggle("focused", i === idx);
  });
}

function selectResult(idx) {
  const node = currentMatches[idx];
  if (!node) return;

  // Navigate graph
  if (window._selectNode) window._selectNode(node);

  // Pan to node
  if (node.x !== undefined && node.y !== undefined) {
    const targetScale = 1.4;
    svg.transition().duration(700).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2 - node.x * targetScale, height / 2 - node.y * targetScale)
        .scale(targetScale)
    );
  }

  searchInput.value = "";
  closeResults();
  searchInput.blur();
}

// ── Helpers ───────────────────────────────────────────────────────────────
function closeResults() {
  resultsEl.style.display = "none";
  focusedIndex = -1;
  currentMatches = [];
}

function getNodeColor(n) {
  if (n.color) return n.color;
  const colors = {
    topic:      "#4C9BE8",
    subtopic:   "#63b3ed",
    paper:      "#F6AD55",
    researcher: "#68D391",
  };
  return colors[n.type] || "#888";
}

// Close on outside click
document.addEventListener("click", e => {
  if (!e.target.closest(".search-wrap")) closeResults();
});

// Note: `svg`, `zoom`, `width`, `height` are defined as globals in graph.js
// and are accessible here since both files share browser global scope.

// Shortcut display hint for Windows (Ctrl) vs Mac (⌘)
const isMac = navigator.platform.toUpperCase().includes("MAC");
const shortcutEl = document.getElementById("search-shortcut");
if (shortcutEl) shortcutEl.textContent = isMac ? "⌘K" : "Ctrl+K";
