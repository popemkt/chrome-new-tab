# Research: Codebase-to-Graph-DB Ingestion & Visualization

> Researched 2026-04-06. Context: replacing hand-crafted `architecture.html` with an automated, queryable graph representation of the codebase.

## Goal

Parse the codebase into a graph database after each PR, then visualize the architecture on demand. The current `architecture.html` encodes nodes (Bridge Server, @extension/protocol, Chrome Extension, Raycast Extension) and edges (WebSocket, HTTP, CDP, import connections) — we want this to be auto-generated and queryable.

---

## 1. Open-Source Codebase-to-Graph Tools

### Tier 1: Mature / Production-Ready

**dependency-cruiser** — [github.com/sverweij/dependency-cruiser](https://github.com/sverweij/dependency-cruiser) (6.5k stars, v17.3.10)
- Validates and visualizes dependencies for JS/TS
- Output: DOT (GraphViz), Mermaid, JSON, HTML, CSV
- Rule-based validation (circular deps, orphans, forbidden cross-boundary imports)
- Designed for CI pipeline integration
- **Limitation**: Module/file-level only — no function calls, class hierarchies, or data flow

**Joern** — [github.com/joernio/joern](https://github.com/joernio/joern)
- Code Property Graph (CPG) combining AST, control flow, and data flow
- Languages: C/C++, Java, Python, JavaScript, TypeScript, Kotlin
- Embedded graph DB (OverflowDB), Scala query DSL
- **Limitation**: Security-focused, overkill for architecture visualization

**CodeQL** — [github.com/github/codeql](https://github.com/github/codeql)
- GitHub's query-based analysis engine, SQL-like language
- Deep TS/JS support
- **Limitation**: Security-focused, proprietary DB format, no visualization

### Tier 2: Purpose-Built Codebase-to-Graph-DB (2024–2026)

**CodeGraphContext** — [github.com/CodeGraphContext/CodeGraphContext](https://github.com/CodeGraphContext/CodeGraphContext) (2.8k stars)
- CLI + MCP server that indexes code into a graph database
- Default DB: **KuzuDB** (embedded, zero-config)
- Also supports: FalkorDB Lite, Neo4j, FalkorDB Remote
- 14 languages via Tree-sitter (including TypeScript)
- Extracts: functions, classes, methods, parameters, inheritance, calls, imports
- Live file watching, web-based visualization with search
- **Best fit for our use case**: embedded DB, MCP integration, active development

**CodeGraph Analyzer** — [github.com/ChrisRoyse/CodeGraph](https://github.com/ChrisRoyse/CodeGraph) (73 stars)
- Two-pass analysis: ASTs per file, then cross-file relationships
- Neo4j backend exclusively
- Node types: files, dirs, classes, interfaces, functions, methods, variables, components
- Edge types: IMPORTS, EXPORTS, CALLS, EXTENDS, IMPLEMENTS, HAS_METHOD, RENDERS_ELEMENT
- **Limitation**: Early-stage, single developer

**Graph-Code** — [github.com/davidsuarezcdo/graph-code](https://github.com/davidsuarezcdo/graph-code) (13 stars)
- TypeScript Compiler API → Neo4j
- LLM-to-Cypher natural language queries
- **Limitation**: Very early (45 commits), AGPL, TS/JS only

**CodePrism** — [github.com/rustic-ai/codeprism](https://github.com/rustic-ai/codeprism) (24 stars)
- Rust-based, "Universal AST", 20 MCP tools
- Claims 1000+ files/sec indexing
- **Limitation**: AI-generated codebase, small community

**FalkorDB Code Graph** — [github.com/FalkorDB/code-graph](https://github.com/FalkorDB/code-graph)
- Official FalkorDB demo, maps GitHub repos into knowledge graphs
- Live demo at code-graph.falkordb.com
- **Limitation**: Demo/showcase, not a CI tool

### Tier 3: Simpler / Archived

| Tool | Notes |
|------|-------|
| **madge** ([github.com/pahen/madge](https://github.com/pahen/madge)) | Module dep graphs for JS/TS, DOT output, circular dep detection |
| **arkit** ([github.com/dyatko/arkit](https://github.com/dyatko/arkit)) | Auto-generates arch diagrams from JS/TS/Vue, PlantUML output. Unmaintained |
| **typescript-graph** ([github.com/ysk8hori/typescript-graph](https://github.com/ysk8hori/typescript-graph)) | CLI for TS file dep visualization |
| **ts-dependency-graph** ([github.com/PSeitz/ts-dependency-graph](https://github.com/PSeitz/ts-dependency-graph)) | DOT/Mermaid output for TS/React |
| **Sourcetrail** ([github.com/CoatiSoftware/Sourcetrail](https://github.com/CoatiSoftware/Sourcetrail)) | Beautiful interactive source explorer. Archived 2021. No TS |

---

## 2. Graph Databases Compared (CI Run-Once-Per-PR)

| Database | Type | Startup | Setup | Query Language | License | CI Fit |
|----------|------|---------|-------|---------------|---------|--------|
| **KuzuDB** | Embedded (C++) | Instant | `pip install kuzu` | Cypher | MIT | Best — zero config, no server |
| **FalkorDBLite** | Embedded (Python) | Instant | pip install | Cypher subset | Source-available | Great — process-level, no Docker |
| **Neo4j** | Server (JVM) | ~90ms cold | Docker container | Cypher | GPL/Commercial | Good — richest ecosystem, 30s Docker overhead |
| **Memgraph** | Server (C++) | Fast | Docker | Cypher + MAGE | BSL 1.1 | Good — fast, in-memory |
| **SurrealDB** | Multi-model | Moderate | Single binary or Docker | SurrealQL | BSL 1.1 | OK — multi-model, less graph-focused |
| **ArangoDB** | Multi-model | Moderate | Docker | AQL | BSL 1.1 | OK — good for mixed workloads |
| **Cozo** | Embedded | Instant | Library import | Datalog | MPL-2.0 | Good — SQLite-like simplicity |

**Recommendation**: KuzuDB or FalkorDBLite for ephemeral CI. No Docker, fast ingestion, Cypher queries.

> Note: KuzuDB was reportedly abandoned by its sponsor in late 2025 — verify current status before committing.

---

## 3. Visualization Layers

### Libraries

| Library | Rendering | Scale | Notes |
|---------|-----------|-------|-------|
| **Cytoscape.js** (~10k stars) | Canvas/WebGL | 100k+ elements | Most complete open-source graph viz |
| **Neo4j NVL** | Canvas | Thousands | Powers Neo4j Bloom, React component available |
| **D3.js (force layout)** (~110k stars) | SVG/Canvas | Hundreds | Maximum flexibility, most work |
| **React Flow** (~30k stars) | SVG | Thousands | Node-based UI framework |
| **Sigma.js** (~12k stars) | WebGL | Millions | Best for very large graphs |

### End-to-End

- **Neo4j Browser / Bloom** — query + explore Neo4j data interactively
- **Understand-Anything dashboard** — React Flow-based, color-coded layers, built-in search (Claude Code skill)
- **Gephi** — desktop app for large graph analysis, not web-based

### For CI Artifacts

Best approach: generate a **self-contained HTML file** with Cytoscape.js and data embedded as JSON. Upload as GitHub Pages or PR artifact.

---

## 4. CI Integration Patterns

### Pattern A — Lightweight (start here)

```
PR trigger → dependency-cruiser → Mermaid diagram → PR comment
```

5 minutes to set up. Already has a GitHub Action pattern: [dev.to/mh4gf](https://dev.to/mh4gf/visualize-typescript-dependencies-of-changed-files-in-a-pull-request-using-127j)

### Pattern B — Full Graph (the vision)

```
PR trigger
  → ts-morph / Tree-sitter parse codebase
  → Load into KuzuDB (embedded, no Docker)
  → Run Cypher queries for architectural view
  → Render Cytoscape.js HTML
  → Upload as GitHub Pages artifact
```

### Pattern C — LLM-Augmented (captures semantic relationships)

```
PR trigger
  → Collect changed files + context
  → Claude API extracts architecture graph (JSON)
  → Render Cytoscape.js HTML
  → Upload as artifact
```

[Swark](https://github.com/swark-io/swark) does a version of this via VS Code + Copilot.

### Pattern D — Hybrid (recommended)

Combine B + C: use Tree-sitter for structural edges (imports, calls, containment) and an LLM pass for semantic edges (WebSocket communication, CDP connections, protocol relationships).

---

## 5. Graph Schema for Architecture

### Nodes

| Type | Description | Properties |
|------|-------------|------------|
| Module | Package/directory = logical component | name, path, layer |
| File | Source file | path, language, LOC |
| Class/Interface | Type definition | name, file, exported |
| Function | Standalone function or method | name, file, exported, async |
| Endpoint | HTTP/WebSocket/CDP endpoint | method, path, protocol |
| ExternalDep | npm package | name, version |

### Edges

| Type | From → To | Description |
|------|-----------|-------------|
| IMPORTS | File → File | ES6/CommonJS import |
| CONTAINS | Module → File, File → Function | Containment hierarchy |
| CALLS | Function → Function | Direct function call |
| EXTENDS | Class → Class | Inheritance |
| IMPLEMENTS | Class → Interface | Interface implementation |
| DEPENDS_ON | Module → Module | Architectural dependency |
| COMMUNICATES_VIA | Module → Module | Runtime communication (WebSocket, HTTP, CDP) |
| EXPOSES | Module → Endpoint | Published API surface |

---

## 6. Key Insight

Our `architecture.html` encodes **semantic** relationships (Bridge ↔ Extension via WebSocket, CDP connections) — not just import graphs. Purely syntactic tools will miss runtime communication patterns. Options:

1. **Pattern matching** — custom script detecting `new WebSocket(...)`, CDP calls, etc.
2. **LLM extraction** — have Claude read the code and output the graph
3. **Explicit annotations** — JSDoc tags or config declaring architectural connections

---

## 7. Recommendation

| Phase | Approach | Effort |
|-------|----------|--------|
| **Now** | Run Understand-Anything (`/understand`) for instant interactive dashboard | 5 min |
| **Short-term** | Add dependency-cruiser to CI, post Mermaid to PR comments | 1 hour |
| **Medium-term** | CodeGraphContext + KuzuDB for structural graph in CI | 1 day |
| **Full vision** | Custom pipeline: ts-morph → KuzuDB → Cypher queries → Cytoscape.js HTML artifact, augmented with LLM pass for semantic edges | 1 week |
