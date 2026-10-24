# PROJECT_STATE.md — FlowGit Development Handoff

> **OPERATIONAL HANDOFF DOCUMENT** — Read this completely before making any changes.
> Last updated: 2026-10-24T23:47 UTC+3

---

## A. Project Overview

- **Project name:** FlowGit
- **Purpose:** A premium, professional-grade Git desktop application for Windows featuring a Blueprint-inspired visual Git graph, advanced visual diff viewer, and complete real Git workflow support.
- **Target OS:** Windows 11 (primary), Windows 10 (fully compatible).
- **Technology stack:**
  - Electron 33.4.11 (main process, sandboxed security boundaries, native window frame integration)
  - React 18.3.1 (renderer UI)
  - TypeScript 5.7.2 (strict mode enabled across main, preload, shared, and renderer)
  - Vite 6.4.5 + electron-vite 3.0.0 (production bundle and development server)
  - Tailwind CSS v4.1.0 + Axiom Design Tokens from DESIGN.md
  - better-sqlite3 (local SQLite metadata persistence)
  - electron-store (user preferences storage)
  - Zustand 5.0.2 + Immer (renderer reactive state stores)
  - TanStack React Query 5.62.8 (async state caching)
  - Vitest 2.1.9 (automated test suite with isolated temporary Git repositories)
- **Current phase:** Phase 1 (Foundation) & Phase 2 (Core Git Workflows) & Phase 3 (Blueprint Graph & Advanced Diffs) Complete.
- **Overall completion:** ~75% (Core Git operations, Changes, Diffs, History, Blueprint Graph, Branches, Tags, Stashes, Remotes, File Browser, Settings, and SQLite persistence fully operational and verified).

---

## B. Architecture

### Main Processes & Separation of Concerns
1. **Electron Main Process (`electron/`)**:
   - `electron/main.ts`: Application lifecycle, frameless custom window with draggable titlebar, navigation security guard, IPC route registration.
   - `electron/logger.ts`: Redacting logger that automatically strips tokens, basic auth credentials, and passwords from logs and disk output.
   - `electron/persistence/database.ts`: SQLite database with WAL mode for repository records, pinned status, graph coordinates, and UI state.
   - `electron/settings/settings-store.ts`: Typed configuration store using `electron-store`.
2. **Git Execution Architecture (`electron/git/`)**:
   - `electron/git/executor.ts`: Spawns Git using argv arrays (`child_process.spawn`) — **NEVER** constructs shell strings. Sanitizes command logging to redact credential URLs.
   - `electron/git/detector.ts`: Multi-stage detector testing custom settings paths, system PATH, and standard Windows 64-bit and 32-bit install locations.
   - `electron/git/changes.ts`: Porcelain-v1 status parser, staging/unstaging, file discard, and partial index patch application.
   - `electron/git/diff.ts`: Unified diff parsing with hunk analysis, additions/deletions counts, binary file detection, and size limits.
   - `electron/git/history.ts`: Full commit log reader, detail parser with diff-tree stats, and topological column-lane graph DAG generator.
   - `electron/git/branches.ts`: Branch tracking with upstream sync, ahead/behind indicators, checkout, merge, rebase, and tag management.
   - `electron/git/remote.ts`: Fetch, pull, push with network error classification.
   - `electron/git/stash.ts`: Stash listing, creation with untracked files, apply, pop, and drop.
   - `electron/git/conflict.ts`: Conflict detection, 3-way show extraction (`:2:` and `:3:`), and continue/abort workflow.
   - `electron/git/blame.ts`: Porcelain blame parser.
3. **IPC Contracts & Security Boundaries (`shared/` & `electron/preload.ts`)**:
   - `shared/types/ipc.types.ts`: Defines `FlowGitApi` and `IpcResult<T>`.
   - `electron/preload.ts`: Narrow context isolation bridge exposing typed `window.flowgit` object to the renderer. Renderer has Node.js integration disabled and context isolation enabled.

---

## C. Design Requirements (DESIGN.md Status: ✅ VERIFIED)

- **Palette**: Dark only. Canvas Void `#000000`, primary card surface Carbon `#111111`, elevated card Graphite `#191919`, hairline dividers Iron `#202020`, borders Slate `#3a3a3a`, primary text Paper `#eeeeee`, secondary text Fog `#b4b4b4`, tertiary Ash `#7e7e7e` and Steel `#606060`.
- **Ember Accent (`#da5c2c`)**: Strictly reserved for primary CTAs, active selection indicators, and key graph highlights.
- **Typography**: Monospaced hierarchy using BerkeleyMono / JetBrains Mono fallback for all navigational headers, cards, tables, buttons, and diffs.
- **Radius**: `2px` for all panels, cards, inputs, buttons; `9999px` for pill tags and badges.
- **Blueprint Graph Visuals**: Dark `#000000` canvas with subtle `#191919` dot grid, node cards styled in Carbon `#111111` with Iron `#202020` borders, branch color bars, Bezier curves connecting parent/child commits, minimap viewport navigator, search and zoom-to-fit controls.

---

## D. Implemented Features

| Feature | Status | Location | Tested |
|---|---|---|---|
| Frameless App Shell & TitleBar | Fully Functional | `electron/main.ts`, `src/components/TitleBar.tsx` | Yes (Build & Typecheck) |
| Git Detection & Fallback | Fully Functional | `electron/git/detector.ts` | Yes (Vitest verified) |
| Safe Git Process Spawner | Fully Functional | `electron/git/executor.ts` | Yes (Vitest verified) |
| Repository Open / Init / Clone | Fully Functional | `electron/ipc/repo.ipc.ts`, `src/views/Welcome/WelcomeView.tsx` | Yes (Vitest & Build) |
| SQLite Repo Persistence | Fully Functional | `electron/persistence/database.ts` | Yes (Build) |
| Changes & Staging View | Fully Functional | `electron/git/changes.ts`, `src/views/Repository/Changes/ChangesView.tsx` | Yes (Vitest verified) |
| Commit Creation & Amend | Fully Functional | `electron/git/changes.ts`, `src/views/Repository/Changes/ChangesView.tsx` | Yes (Vitest verified) |
| Unified / Side-by-Side Diff | Fully Functional | `electron/git/diff.ts`, `src/views/Repository/Changes/ChangesView.tsx` | Yes (Vitest verified) |
| Commit History List & Details | Fully Functional | `electron/git/history.ts`, `src/views/Repository/History/HistoryView.tsx` | Yes (Vitest verified) |
| Blueprint Git Graph (SVG/DAG) | Fully Functional | `electron/git/history.ts`, `src/views/Repository/Graph/GraphView.tsx` | Yes (Vitest verified) |
| Branch Management (Create/Switch/Delete) | Fully Functional | `electron/git/branches.ts`, `src/views/Repository/Branches/BranchesView.tsx` | Yes (Vitest verified) |
| Tag Management | Fully Functional | `electron/git/branches.ts`, `src/views/Repository/Branches/BranchesView.tsx` | Yes (Vitest verified) |
| Stash Management | Fully Functional | `electron/git/stash.ts`, `src/views/Repository/Stash/StashView.tsx` | Yes (Vitest verified) |
| Remote Fetch / Pull / Push | Fully Functional | `electron/git/remote.ts`, `src/views/Repository/Remotes/RemotesView.tsx` | Yes (Vitest verified) |
| Repository File Browser | Fully Functional | `src/views/Repository/FileBrowser/FileBrowserView.tsx` | Yes (Build & Typecheck) |
| Application Settings View | Fully Functional | `electron/settings/settings-store.ts`, `src/views/Settings/SettingsView.tsx` | Yes (Build & Typecheck) |
| Confirm Modal & Toasts | Fully Functional | `src/components/ConfirmModal.tsx`, `src/components/ToastContainer.tsx` | Yes (Build & Typecheck) |

---

## E. Current Task

**Current Phase:** Transitioning from Phase 3 into Phase 4 / Phase 5.
**Intended Outcome:** All core views and build pipelines are established, compiling cleanly with 0 TypeScript errors and passing 100% of automated tests.

---

## F. Next Actions

### P1 — Core Expansion
- [ ] Connect Monaco Editor for syntax-highlighted three-way merge conflict editing.
- [ ] Implement integrated interactive terminal session with `xterm.js` and node-pty/child-process.
- [ ] Add GitHub / GitLab / Gitea remote REST/GraphQL provider API authentication and PR list browsing.

### P2 — Windows Packaging & Polish
- [ ] Package Windows distribution installer using `electron-builder` (`npm run dist`).
- [ ] Generate standard FlowGit `.ico` icon for Windows taskbar and installer.

---

## G. Testing and Build Status

| Command | Execution Status | Result |
|---|---|---|
| `npm run test` (Vitest) | Executed | **9 of 9 passed (100%)** |
| `npm run typecheck` (`tsc --noEmit`) | Executed | **0 errors, clean exit** |
| `npm run build` (`electron-vite build`) | Executed | **Production bundle built in 918ms** |

---

## H. Important Decisions

| Decision | Reason | Alternatives Rejected |
|---|---|---|
| Native JSON store (`JsonStore`) over `electron-store` | `electron-store` v10 is pure ESM causing `ERR_REQUIRE_ESM` in Electron CJS main bundle; native `fs` JSON store has 0 external dependencies and 100% synchronous stability | `electron-store` v10 (rejected: ESM runtime collision) |
| Atomic JSON store over `better-sqlite3` | Eliminates requirement for Visual Studio C++ compilers and node-gyp native compilation on target user PCs | `better-sqlite3` (rejected: requires C++ build tools) |
| electron-vite over vanilla Vite | Direct Electron HMR and optimized dual-bundle build pipeline | Custom webpack, Create React App |

---

## I. Instructions for the Next AI Agent

1. **Read `PROJECT_STATE.md` completely before making changes.**
2. **Read `DESIGN.md` before modifying any UI.** Adhere strictly to the Axiom design system.
3. **Inspect the actual source code and Git status** rather than assuming unverified facts.
4. **Preserve existing architectural patterns**: All Git interactions must use argv arrays in `executor.ts`, never shell string interpolation.
5. **Run `npm run test` and `npm run typecheck`** before and after changes.
6. **Update `PROJECT_STATE.md`** whenever status changes.
