# FlowGit — Landing Page

> **A terminal-grade, single-page landing site for FlowGit**, crafted strictly according to the **Axiom Design System** (`DESIGN.md`) and the technical core documented in `README.md`.

- **GitLab (Recommended / Primary):** [https://kazaamo.space/djjdjdbf9/flowgit](https://kazaamo.space/djjdjdbf9/flowgit)
- **GitHub (Backup Mirror):** [https://github.com/djjdjdbf9/flowgit](https://github.com/djjdjdbf9/flowgit)

---

## ⚡ Quick Preview

You can view the site immediately without installing heavy dependencies:

### Option A: Direct Browser Open
Double-click `index.html` or open it with your browser:
```cmd
start index.html
```

### Option B: Local Web Server
If you prefer running a local HTTP server:
```cmd
npx serve . -l 3000
```
Then navigate to `http://localhost:3000`.

---

## 🎨 Axiom Design System Compliance

This site strictly follows the tokens and visual rules specified in `DESIGN.md`:

| Token / Spec | Value | Implementation |
|---|---|---|
| **Palette Canvas** | `#000000` (Void) | Main page background, nav surface, terminal canvas |
| **Primary Surface** | `#111111` (Carbon) | Feature card surfaces, app chrome, code containers |
| **Elevated Surface**| `#191919` (Graphite) | Case study cards, product mock sub-panels |
| **Hairline Dividers**| `#202020` (Iron) | Structural hairline borders & row dividers |
| **Secondary Borders**| `#3a3a3a` (Slate) | Interactive controls, ghost buttons |
| **Primary Accent** | `#da5c2c` (Ember) | Action CTAs, active tab underlines, graph HEAD highlights, and the 2px left border on case-study cards |
| **Typography** | BerkeleyMono / JetBrains Mono | Universal monospace grid across headers, body, nav, buttons, and tables |
| **Geometry** | `2px` corners | Applied to cards, buttons, inputs, panels. `9999px` strictly for status pills |
| **Shadows & Gradients**| Flat / None | No soft blur shadows, no neon gradients, zero decorative slop |

---

## 🚀 Key Interactive Features

1. **Live Blueprint DAG Graph Engine (SVG)**:
   - Interactive directed acyclic graph with topological commit ancestry.
   - Panning (drag canvas) & smooth mouse-wheel zooming (0.4x to 2.5x).
   - Parent-child cubic Bezier connector splines with branch color indicators.
   - Live Minimap Radar widget synced with viewport coordinates.
   - Click any commit node to slide open the **Commit Inspector Drawer** with file diff stats.
   - Toolbar with live commit search filter, zoom-to-fit, and jump-to-HEAD.

2. **Porcelain-v1 Staging Simulator**:
   - Interactive Staged / Unstaged / Untracked file matrix.
   - Stage, unstage, or batch-stage files with immediate index feedback.
   - Commit message input with live 72-character limit counter.

3. **Advanced Diff Viewer**:
   - Interactive toggle between **Unified** and **Side-by-Side (Split)** diff views.
   - Syntax-highlighted additions (`+`), deletions (`-`), and folded hunk headers.

4. **Branch Matrix & Stashes**:
   - Local/remote branch tracking with `↑ ahead / ↓ behind` upstream indicators.
   - Stash list with one-click action feedback.

5. **Terminal Code Tabs with One-Click Copy**:
   - `Portable (.exe)`, `Compiled Binaries (.zip)`, and `source build` instructions.
   - Instant clipboard copy with monospaced toast confirmation.

6. **Global Keyboard Shortcuts**:
   - `1` — Switch to Blueprint Graph tab
   - `2` — Switch to Porcelain Staging tab
   - `3` — Switch to Diff Viewer tab
   - `4` — Switch to Branch Matrix tab
   - `H` — Jump to HEAD commit in DAG
   - `F` — Zoom-to-fit canvas
   - `Esc` — Close Commit Inspector drawer

---

## 📁 File Structure

```
website/
├── index.html       # Semantic single-page HTML5 structure
├── styles.css       # Authoritative Axiom design tokens & layout
├── app.js           # Interactive DAG engine, tabs, diff toggle, staging
├── package.json     # Optional local preview runner
└── README.md        # Documentation and design specifications
```
