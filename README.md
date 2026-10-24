# FlowGit

> **A premium, Blueprint-inspired Git desktop application for Windows.**  
> Built with Electron, React, TypeScript, and the terminal-grade Axiom design system.

---

## Overview

**FlowGit** is a high-performance Windows Git desktop client designed for developers who demand both technical precision and visual elegance.

Traditional Git GUI clients present commit histories as dense vertical ladders or rudimentary tree diagrams. FlowGit introduces an interactive **Blueprint-inspired visual commit graph**—modeled after the spatial and node-based visual paradigm of node editors—rendering real Git topological directed acyclic graphs (DAG) with parent-child connections, lane allocations, branch color differentiation, minimap navigation, and smooth canvas panning and zooming.

All operations execute directly against the system Git binary via safe argument arrays (no shell string interpolation), guaranteeing that Git index semantics, hooks, configuration, and credentials remain authentic and secure.

---

## Key Features

### 1. Signature Blueprint Git Graph
- **Interactive Workspace**: Smooth panning and mouse-wheel zooming (0.25x to 3x) across an infinite dot-grid canvas.
- **Topological DAG Rendering**: Accurately computes commit ancestry, lane columns, and multi-parent merge commits.
- **Node Cards**: Displays short hashes, commit messages, author information, timestamps, and active branch/tag badges.
- **Navigation Tools**: Built-in real-time minimap radar, search filter with live node highlighting, jump-to-HEAD, and zoom-to-fit controls.
- **Contextual Inspection**: Click any commit node to inspect changes, file additions/deletions, and view full diffs.

### 2. Changes, Staging & Commit Flow
- **Porcelain-v1 Status Tracking**: Clear separation between Staged, Unstaged, Untracked, and Conflicted files.
- **Precise File Actions**: Stage, unstage, or discard individual files, or perform batch stage/unstage with one click.
- **Commit Management**: Full commit message editor with character count, commit amend support, and validation.
- **Destructive Action Safeguards**: Safety confirmation modals for destructive operations (discarding work, deleting branches).

### 3. Advanced Diff Viewer
- **Side-by-Side & Unified Diffs**: Toggle between split and unified comparison modes.
- **Hunk Analysis**: Visual additions/deletions highlighting, line numbers for old/new revisions, and unchanged context folding.
- **Binary & Large File Handling**: Gracefully handles binary files and large outputs without UI freezing.

### 4. Branch, Tag & Stash Operations
- **Branch Management**: View local and remote-tracking branches with upstream ahead/behind counts (`↑ ahead / ↓ behind`). Create, checkout, rename, merge, and delete branches.
- **Tag Management**: Inspect, create (annotated or lightweight), push, and delete tags.
- **Stash Management**: Create stashes (including untracked files), preview entries, apply, pop, or drop.

### 5. Remote Operations
- **Network Sync**: Fetch (all or individual remotes), Pull (with automatic merge conflict detection), and Push (with force-with-lease support).
- **Remote Configuration**: Add, edit, or remove remote URLs (HTTPS, SSH) for GitHub, GitLab, Gitea, or custom servers.
- **Diagnostic Error Handling**: Classifies network errors, authentication failures, and non-fast-forward rejections with actionable recovery steps.

### 6. Axiom Terminal-Grade Visual Design
- **Single Source of Truth**: Strictly implements the Axiom design language specified in `DESIGN.md`.
- **Pure Dark Palette**: Canvas Void (`#000000`), Carbon (`#111111`), Graphite (`#191919`), Iron (`#202020`), and Slate (`#3a3a3a`).
- **Functional Ember Accent**: `#da5c2c` is reserved strictly for primary actions, active navigation states, and DAG focus highlights.
- **Universal Monospaced Typography**: BerkeleyMono / JetBrains Mono geometry across all UI text, navigation, tables, and buttons.
- **Sharp Geometry**: Consistent 2px border radius across cards, buttons, and inputs; 9999px for status tags and pills.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Electron 33.x | Native Windows desktop integration, custom frameless window |
| **Frontend** | React 18 + TypeScript | UI component hierarchy with strict type safety |
| **Build Tool** | Vite 6 + electron-vite | Lightning-fast HMR and dual-target production bundling |
| **Styling** | Tailwind CSS v4 | Design token styling derived directly from `DESIGN.md` |
| **State** | Zustand 5 + Immer | Reactive global application state management |
| **Queries** | TanStack Query 5 | Async data caching and background invalidation |
| **Packaging** | electron-builder | Standalone Windows executable and installer compilation |
| **Persistence** | Custom atomic JSON store | Zero-dependency local data storage in `%APPDATA%\FlowGit\` |
| **Testing** | Vitest 2 | Automated Git integration tests on isolated temporary repositories |

---

## Prerequisites

Before building FlowGit from source, ensure you have:

1. **Operating System**: Windows 10 or Windows 11 (64-bit).
2. **Node.js**: `v20.x` or `v24.x` (LTS recommended). Check with:
   ```cmd
   node --version
   ```
3. **npm**: `v10.x` or `v11.x`. Check with:
   ```cmd
   npm --version
   ```
4. **Git for Windows**: Git must be installed on your system. Check with:
   ```cmd
   git --version
   ```
   *(Download from [git-scm.com](https://git-scm.com) if not already installed).*

---

## Quick Start (Fresh Repository Setup)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd FlowGit
```

### 2. Install Dependencies
```cmd
npm install
```

### 3. Run in Development Mode
Launch the application with Hot Module Replacement (HMR):
```cmd
npm run dev
```

---

## Build & Compilation Commands

### 1. Run Automated Test Suite
Executes all integration tests against isolated, temporary Git test repositories:
```cmd
npm run test
```

### 2. Type Checking
Verifies TypeScript code with strict checks across the main process, preload bridge, shared types, and renderer:
```cmd
npm run typecheck
```

### 3. Compile Production Bundle
Compiles the application with `electron-vite` into `out/`:
```cmd
npm run build
```
Output files:
- `out/main/main.js` (Electron Main Process)
- `out/preload/preload.js` (Context Isolation Bridge)
- `out/renderer/` (Optimized React Single Page Application)

### 4. Package Standalone Windows Executable (`.exe`)
Compiles the project and generates an unpacked, ready-to-run Windows application directory:
```cmd
npm run dist:dir
```
The compiled executable will be located at:
```plaintext
release\win-unpacked\FlowGit.exe
```

### 5. Generate Windows NSIS Installer & Portable Builds
Builds the complete distribution installer (`FlowGit Setup.exe`) and portable executable:
```cmd
npm run dist
```
Distribution packages are written to the `release/` directory.

---

## Project Structure

```
FlowGit/
├── electron/                   # Electron Main Process
│   ├── main.ts                 # Window management, frameless shell, IPC routes
│   ├── preload.ts              # Secure contextBridge API (`window.flowgit`)
│   ├── logger.ts               # Redacting logger (strips tokens and passwords)
│   ├── git/                    # Core Git Engine (argv-based process spawning)
│   │   ├── executor.ts         # Safe child_process spawner (never shell strings)
│   │   ├── detector.ts         # Multi-path Windows Git binary detector
│   │   ├── changes.ts          # Status porcelain parser, stage, unstage, discard
│   │   ├── diff.ts             # Unified diff parser & hunk generator
│   │   ├── history.ts          # Commit log, detail parser, topological DAG
│   │   ├── branches.ts         # Branch tracking, upstream ahead/behind, tags
│   │   ├── remote.ts           # Fetch, pull, push with network error classification
│   │   ├── stash.ts            # Stash creation, list, apply, pop, drop
│   │   ├── conflict.ts         # Merge conflict detection & show extraction
│   │   └── blame.ts            # Git blame porcelain parser
│   ├── ipc/                    # Typed IPC handlers (git, repo, settings, remotes)
│   ├── persistence/            # Atomic JSON store for repository list and UI state
│   └── settings/               # User configuration store
├── shared/                     # Cross-process shared TypeScript contracts
│   ├── constants.ts            # IPC channel constants
│   └── types/                  # Git models, IPC result wrappers, API interfaces
├── src/                        # Renderer UI (React 18 + TypeScript)
│   ├── main.tsx                # React mount entry
│   ├── App.tsx                 # Root router and global modal providers
│   ├── design/                 # Axiom design tokens and custom CSS
│   ├── store/                  # Zustand stores (repo, UI state)
│   ├── components/             # Reusable UI components (TitleBar, Sidebar, Modals, DiffViewer)
│   └── views/                  # Primary application views
│       ├── Welcome/            # First-run & repository picker
│       ├── Repository/         # Workspace shell
│       │   ├── Changes/        # Staging & commit view
│       │   ├── History/        # Commit history list & details
│       │   ├── Graph/          # Blueprint-inspired visual DAG commit graph
│       │   ├── Branches/       # Branch & tag management
│       │   ├── Stash/          # Stash manager
│       │   ├── Remotes/        # Remote sync & configuration
│       │   └── FileBrowser/    # File tree inspector
│       └── Settings/           # Application preferences
├── tests/                      # Automated Vitest integration tests
│   └── git/git.test.ts         # Isolated Git lifecycle test suite
├── electron.vite.config.ts     # electron-vite build configuration
├── package.json                # Dependencies, scripts, and electron-builder config
├── tsconfig.json               # Renderer TypeScript configuration
├── tsconfig.node.json          # Main process TypeScript configuration
└── DESIGN.md                   # Authoritative Axiom design specification
```

---

## Security Model

FlowGit adheres strictly to Electron security best practices:
- **Context Isolation Enabled**: The renderer runs in an isolated context and has no direct access to Node.js APIs or the host operating system.
- **Node Integration Disabled**: `nodeIntegration: false` is enforced in all browser windows.
- **Safe Process Execution**: Every Git operation is invoked using binary paths and argument arrays (`spawn('git', ['commit', '-m', msg])`). No arbitrary shell string concatenation is ever performed.
- **Automatic Credential Redaction**: All URLs, Bearer tokens, basic auth credentials, and passwords are automatically stripped prior to logging to disk or console.

---

## License

This project is licensed under the [MIT License](LICENSE).
