// ── Korea Policy Evaluation — Research Map ───────────────────────────────
// D3.js v7 force-directed graph

const TYPE_CONFIG = {
  topic:      { radius: 24, strokeWidth: 2.5 },
  subtopic:   { radius: 15, strokeWidth: 1.5 },
  paper:      { radius: 9,  strokeWidth: 1 },
  researcher: { radius: 13, strokeWidth: 1.5 },
};

const NODE_COLOR = {
  topic:      "#E05252",
  subtopic:   "#f08080",
  paper:      "#F6AD55",
  researcher: "#68D391",
};

const LINK_CONFIG = {
  has_subtopic: { color: "#E05252", opacity: 0.45, width: 2 },
  covers_topic: { color: "#F6AD55", opacity: 0.18, width: 1 },
  researches:   { color: "#68D391", opacity: 0.15, width: 1 },
  authored:     { color: "#68D391", opacity: 0.28, width: 1.5 },
};

let graphData  = null;
let simulation = null;
let activeFilter = "all";

const svg       = d3.select("#graph");
const container = document.getElementById("graph-container");
const tooltip   = document.getElementById("tooltip");
const loading   = document.getElementById("loading");

let width  = container.clientWidth;
let height = container.clientHeight;
svg.attr("width", width).attr("height", height);

const g = svg.append("g").attr("class", "root");

// ── Zoom ─────────────────────────────────────────────────────────────────
const zoom = d3.zoom()
  .scaleExtent([0.08, 5])
  .on("zoom", e => g.attr("transform", e.transform));
svg.call(zoom).on("dblclick.zoom", null);

document.getElementById("zoom-in").addEventListener("click", () =>
  svg.transition().duration(300).call(zoom.scaleBy, 1.35));
document.getElementById("zoom-out").addEventListener("click", () =>
  svg.transition().duration(300).call(zoom.scaleBy, 0.74));
document.getElementById("zoom-reset").addEventListener("click", () =>
  svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity));

// ── Load data ─────────────────────────────────────────────────────────────
fetch("graph.json")
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(data => {
    graphData = data;
    updateStats(data);
    render(data);
    loading.classList.add("hidden");
  })
  .catch(err => {
    loading.innerHTML =
      `<span style="color:#e85c4c">graph.json not found.</span>
       <code style="font-size:0.78rem;margin-top:6px;color:#718096">
         python scripts/build_graph.py
       </code>`;
    console.error(err);
  });

// ── Stats bar ─────────────────────────────────────────────────────────────
function updateStats(data) {
  const count = t => data.nodes.filter(n => n.type === t).length;
  document.getElementById("stat-topics").textContent =
    `${count("topic") + count("subtopic")} topics`;
  document.getElementById("stat-papers").textContent =
    `${count("paper")} papers`;
  document.getElementById("stat-researchers").textContent =
    `${count("researcher")} researchers`;
  document.getElementById("stat-links").textContent =
    `${data.links.length} connections`;
}

// ── Render ────────────────────────────────────────────────────────────────
function render(data) {
  const nodes = data.nodes.map(d => ({ ...d }));
  const links = data.links.map(d => ({ ...d }));

  // Arrow marker
  g.append("defs").append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 22)
    .attr("markerWidth", 4)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#3a3d50");

  // Force simulation
  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
      .id(d => d.id)
      .distance(d => {
        if (d.type === "has_subtopic") return 90;
        if (d.type === "authored")     return 55;
        if (d.type === "covers_topic") return 130;
        return 110;
      })
      .strength(d => d.type === "has_subtopic" ? 0.9 : 0.3))
    .force("charge", d3.forceManyBody()
      .strength(d => {
        if (d.type === "topic")      return -600;
        if (d.type === "subtopic")   return -220;
        if (d.type === "researcher") return -100;
        return -60;
      }))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide(d =>
      (TYPE_CONFIG[d.type]?.radius || 10) * 1.9))
    .force("x", d3.forceX(width / 2).strength(0.02))
    .force("y", d3.forceY(height / 2).strength(0.02))
    .alphaDecay(0.028);

  // ── Links ──────────────────────────────────────────────────────────────
  const link = g.append("g").attr("class", "links")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke",         d => LINK_CONFIG[d.type]?.color   || "#444")
    .attr("stroke-opacity", d => LINK_CONFIG[d.type]?.opacity || 0.2)
    .attr("stroke-width",   d => LINK_CONFIG[d.type]?.width   || 1);

  // ── Nodes ──────────────────────────────────────────────────────────────
  const node = g.append("g").attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .style("cursor", "pointer")
    .call(d3.drag()
      .on("start", dragStart)
      .on("drag",  dragged)
      .on("end",   dragEnd))
    .on("mouseenter", showTooltip)
    .on("mousemove",  moveTooltip)
    .on("mouseleave", hideTooltip)
    .on("click", (e, d) => {
      e.stopPropagation();
      hideTooltip();
      selectNode(d, nodes, links, node, link);
    });

  // Circle
  node.append("circle")
    .attr("r",            d => TYPE_CONFIG[d.type]?.radius || 10)
    .attr("fill",         d => nodeColor(d))
    .attr("fill-opacity", 0.88)
    .attr("stroke",       "#fff")
    .attr("stroke-width", d => TYPE_CONFIG[d.type]?.strokeWidth || 1)
    .attr("stroke-opacity", 0.2);

  // Label
  node.append("text")
    .attr("class", "node-label")
    .attr("dy", d => (TYPE_CONFIG[d.type]?.radius || 10) + 13)
    .text(d => {
      const maxLen = d.type === "paper" ? 30 : d.type === "topic" ? 20 : 22;
      return d.label.length > maxLen ? d.label.slice(0, maxLen) + "…" : d.label;
    })
    .attr("fill-opacity", d => d.type === "topic" ? 1 : d.type === "subtopic" ? 0.85 : 0.6);

  // Click background → deselect
  svg.on("click", () => {
    document.getElementById("panel").classList.add("hidden");
    resetHighlight(node, link);
  });

  // Tick
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  // Expose for search.js
  window._graphNodes   = nodes;
  window._graphLinks   = links;
  window._graphNodeSel = node;
  window._graphLinkSel = link;
  window._selectNode   = (d) => selectNode(d, nodes, links, node, link);
}

// ── Color helper ──────────────────────────────────────────────────────────
function nodeColor(d) {
  if (d.color) return d.color;
  return NODE_COLOR[d.type] || "#888";
}

// ── Tooltip ───────────────────────────────────────────────────────────────
function showTooltip(event, d) {
  const sub = d.type === "paper"
    ? `${(d.authors || []).slice(0,2).join(", ")}${(d.authors||[]).length > 2 ? " et al." : ""} · ${d.journal || ""} ${d.year || ""}${d.tag ? " " + d.tag : ""}`
    : d.type === "researcher"
    ? d.affiliation || ""
    : (d.description || "").slice(0, 90) + (d.description?.length > 90 ? "…" : "");

  tooltip.innerHTML =
    `<div class="tooltip-type" style="color:${nodeColor(d)}">${d.type}</div>
     <div class="tooltip-label">${d.label.length > 48 ? d.label.slice(0,48)+"…" : d.label}</div>
     ${sub ? `<div class="tooltip-sub">${sub}</div>` : ""}`;
  tooltip.classList.remove("hidden");
  moveTooltip(event);
}

function moveTooltip(event) {
  const x = event.clientX + 14;
  const y = event.clientY - 8;
  tooltip.style.left = (x + tooltip.offsetWidth > window.innerWidth ? x - tooltip.offsetWidth - 28 : x) + "px";
  tooltip.style.top  = y + "px";
}

function hideTooltip() {
  tooltip.classList.add("hidden");
}

// ── Select / highlight ────────────────────────────────────────────────────
function selectNode(d, nodes, links, nodeEl, linkEl) {
  const connectedIds = new Set();
  links.forEach(l => {
    if (l.source.id === d.id) connectedIds.add(l.target.id);
    if (l.target.id === d.id) connectedIds.add(l.source.id);
  });

  // Dim non-connected
  nodeEl.selectAll("circle")
    .attr("fill-opacity", n =>
      n.id === d.id ? 1 : connectedIds.has(n.id) ? 0.75 : 0.18)
    .attr("stroke-opacity", n =>
      n.id === d.id ? 0.8 : connectedIds.has(n.id) ? 0.3 : 0.1);

  linkEl.attr("stroke-opacity", l =>
    l.source.id === d.id || l.target.id === d.id
      ? (LINK_CONFIG[l.type]?.opacity || 0.2) * 2.2
      : 0.04);

  showPanel(d, connectedIds, nodes, links);
}

function resetHighlight(nodeEl, linkEl) {
  if (!nodeEl) return;
  nodeEl.selectAll("circle")
    .attr("fill-opacity", 0.88)
    .attr("stroke-opacity", 0.2);
  linkEl.attr("stroke-opacity", l => LINK_CONFIG[l.type]?.opacity || 0.2);
}

// ── Panel ─────────────────────────────────────────────────────────────────
function showPanel(d, connectedIds, nodes, links) {
  const panel = document.getElementById("panel");
  panel.classList.remove("hidden");

  // Type badge
  const badge = document.getElementById("panel-type-badge");
  badge.textContent = d.type;
  badge.style.background = nodeColor(d) + "22";
  badge.style.color       = nodeColor(d);

  document.getElementById("panel-title").textContent = d.label;

  // Meta chips
  const meta = document.getElementById("panel-meta");
  meta.innerHTML = "";
  if (d.year)    meta.innerHTML += `<span class="meta-chip year">${d.year}</span>`;
  if (d.journal) meta.innerHTML += `<span class="meta-chip journal">${d.journal}</span>`;
  if (d.affiliation) meta.innerHTML += `<span class="meta-chip">${d.affiliation}</span>`;
  if (d.tag)     meta.innerHTML += `<span class="meta-chip tag">${d.tag}</span>`;
  if (d.authors?.length) {
    const authStr = d.authors.slice(0, 3).join(", ") + (d.authors.length > 3 ? " et al." : "");
    meta.innerHTML += `<br><span style="font-size:0.72rem;color:var(--muted);margin-top:2px">${authStr}</span>`;
  }
  if (d.key_concepts?.length) {
    meta.innerHTML += `<br><span style="font-size:0.72rem;color:var(--muted)">${d.key_concepts.slice(0,4).join(" · ")}</span>`;
  }

  // Section line
  const secEl = document.getElementById("panel-section");
  secEl.textContent = d.section ? `§ ${d.section}` : "";

  // Abstract block
  const abstractWrap = document.getElementById("panel-abstract-wrap");
  const summaryEl    = document.getElementById("panel-summary");
  const abstractLink = document.getElementById("panel-abstract-link");

  const hasSummary = !!(d.summary || d.description);
  if (hasSummary) {
    abstractWrap.classList.remove("hidden");
    summaryEl.textContent = d.summary || d.description || "";
  } else {
    abstractWrap.classList.add("hidden");
    summaryEl.textContent = "";
  }

  // "↗ Full paper" link inside abstract block
  if (d.url) {
    abstractLink.href = d.url;
    abstractLink.classList.remove("hidden");
  } else {
    abstractLink.classList.add("hidden");
  }

  // Extra action buttons (website for researchers, or duplicate paper link)
  const actions = document.getElementById("panel-actions");
  actions.innerHTML = "";
  if (d.website) {
    const a = document.createElement("a");
    a.className = "action-btn";
    a.href = d.website;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML = "↗ Website";
    actions.appendChild(a);
  }

  // Connected nodes
  const linksDiv = document.getElementById("panel-links");
  linksDiv.innerHTML = "";

  const sortedConnected = [...connectedIds]
    .map(id => nodes.find(x => x.id === id))
    .filter(Boolean)
    .sort((a, b) => {
      const order = { topic: 0, subtopic: 1, paper: 2, researcher: 3 };
      return (order[a.type] ?? 4) - (order[b.type] ?? 4);
    });

  sortedConnected.forEach(n => {
    const el = document.createElement("div");
    el.className = "connected-node";
    el.innerHTML =
      `<span class="node-dot" style="background:${nodeColor(n)}"></span>
       <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.label.length > 42 ? n.label.slice(0,42)+"…" : n.label}</span>
       <span class="node-type-label">${n.type}</span>`;
    el.addEventListener("click", () => {
      if (window._selectNode) window._selectNode(n);
    });
    linksDiv.appendChild(el);
  });
}

// ── Filter buttons ────────────────────────────────────────────────────────
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.type;

    if (!window._graphNodeSel) return;

    window._graphNodeSel.style("display", d =>
      activeFilter === "all" || d.type === activeFilter ? null : "none");

    window._graphLinkSel.style("display", l => {
      if (activeFilter === "all") return null;
      const src = typeof l.source === "object" ? l.source.type : null;
      const tgt = typeof l.target === "object" ? l.target.type : null;
      return src === activeFilter || tgt === activeFilter ? null : "none";
    });
  });
});

// ── Panel close ───────────────────────────────────────────────────────────
document.getElementById("panel-close").addEventListener("click", () => {
  document.getElementById("panel").classList.add("hidden");
  resetHighlight(window._graphNodeSel, window._graphLinkSel);
});

// ── Resize ────────────────────────────────────────────────────────────────
window.addEventListener("resize", () => {
  width  = container.clientWidth;
  height = container.clientHeight;
  svg.attr("width", width).attr("height", height);
  if (simulation) {
    simulation
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.02))
      .force("y", d3.forceY(height / 2).strength(0.02))
      .alpha(0.15).restart();
  }
});

// ── Keyboard shortcuts ────────────────────────────────────────────────────
document.addEventListener("keydown", e => {
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    document.getElementById("search").focus();
  }
  if (e.key === "Escape") {
    document.getElementById("panel").classList.add("hidden");
    resetHighlight(window._graphNodeSel, window._graphLinkSel);
    document.getElementById("search").blur();
  }
});

// ── Drag ──────────────────────────────────────────────────────────────────
function dragStart(e, d) {
  if (!e.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x; d.fy = d.y;
}
function dragged(e, d) { d.fx = e.x; d.fy = e.y; }
function dragEnd(e, d) {
  if (!e.active) simulation.alphaTarget(0);
  d.fx = null; d.fy = null;
}
