"""
Converts YAML ontology files → graph.json for D3.js visualization.
Run: python scripts/build_graph.py
Output: graph.json (repo root, served by GitHub Pages)
        site/graph.json (local dev copy)
"""

import json
import yaml
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ONTOLOGY = os.path.join(ROOT, "data", "ontology")
OUT = os.path.join(ROOT, "graph.json")
OUT_SITE = os.path.join(ROOT, "site", "graph.json")


def load(filename):
    with open(os.path.join(ONTOLOGY, filename), encoding="utf-8") as f:
        return yaml.safe_load(f)


def build():
    topics_data = load("topics.yaml")
    papers_data = load("papers.yaml")
    researchers_data = load("researchers.yaml")

    nodes = []
    links = []
    seen_ids = set()

    def add_node(id_, label, type_, **kwargs):
        if id_ not in seen_ids:
            nodes.append({"id": id_, "label": label, "type": type_, **kwargs})
            seen_ids.add(id_)

    # ── Topics & subtopics ──────────────────────────────────────────────
    for topic in topics_data["topics"]:
        add_node(topic["id"], topic["label"], "topic",
                 color=topic.get("color", "#999"),
                 description=topic.get("description", ""))

        for sub in topic.get("subtopics", []):
            add_node(sub["id"], sub["label"], "subtopic",
                     color=topic.get("color", "#ccc"),
                     parent=topic["id"],
                     key_concepts=sub.get("key_concepts", []))
            links.append({"source": topic["id"], "target": sub["id"],
                          "type": "has_subtopic"})

    # ── Papers ──────────────────────────────────────────────────────────
    for paper in papers_data["papers"]:
        add_node(paper["id"], paper["title"], "paper",
                 authors=paper.get("authors", []),
                 year=paper.get("year"),
                 journal=paper.get("journal", ""),
                 url=paper.get("url", ""),
                 tag=paper.get("tag", ""),
                 summary=paper.get("summary", "").strip())

        for topic_id in paper.get("topics", []):
            if topic_id in seen_ids:
                links.append({"source": paper["id"], "target": topic_id,
                              "type": "covers_topic"})

    # ── Researchers ─────────────────────────────────────────────────────
    for r in researchers_data["researchers"]:
        add_node(r["id"], r["name"], "researcher",
                 affiliation=r.get("affiliation", ""),
                 tag=r.get("tag", ""),
                 website=r.get("website", ""))

        for topic_id in r.get("topics", []):
            if topic_id in seen_ids:
                links.append({"source": r["id"], "target": topic_id,
                              "type": "researches"})

        for paper_id in r.get("key_papers", []):
            if paper_id in seen_ids:
                links.append({"source": r["id"], "target": paper_id,
                              "type": "authored"})

    graph = {"nodes": nodes, "links": links}
    payload = json.dumps(graph, indent=2, ensure_ascii=False)

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(payload)

    os.makedirs(os.path.dirname(OUT_SITE), exist_ok=True)
    with open(OUT_SITE, "w", encoding="utf-8") as f:
        f.write(payload)

    print(f"Built graph: {len(nodes)} nodes, {len(links)} links")
    print(f"  → {OUT}")
    print(f"  → {OUT_SITE}")


if __name__ == "__main__":
    build()
