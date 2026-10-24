# FlowGit — Windows Git Client

You are the lead engineer building a new desktop application called FlowGit. This is a NEW product, not the previous Camunda Modeler plugin.

## 1. Product

Build a real, standalone Git client for Windows with deep integration for:
- GitHub
- GitLab, including self-hosted instances
- Gitea, including self-hosted instances

Support Personal Access Tokens (PAT) and OAuth/application authentication where supported. Provide a clear fallback to PAT when OAuth requires app registration.

The goal is a practical daily Git client, not a mockup or a simple remote repository viewer.

## 2. Design — Mandatory

Locate and read the existing design reference file in the workspace (`DESIGN.md` or the equivalent existing filename) completely before implementing the UI.

Treat its tokens and visual rules as the design source of truth. Follow the Axiom terminal aesthetic:
- Near-black background and layered dark surfaces.
- Berkeley Mono if available; otherwise JetBrains Mono or another suitable monospace font.
- Flat UI, 2px corners, subtle borders, no gradients or decorative shadows.
- Use the specified orange accent sparingly.
- No generic rounded SaaS UI, random colors, or unrelated illustrations.

Apply the design consistently to the entire application, including dialogs, settings, tables, forms, empty states, and error states. Do not merely create a landing page.

## 3. Technology

Use:
- Tauri 2 for the Windows desktop application.
- Rust for native operations and the application backend.
- React + TypeScript + Vite for the frontend.
- Git for Windows as the real Git engine, invoked safely by the Rust backend without shell-string interpolation.
- REST API adapters for GitHub, GitLab, and Gitea.
- Windows-protected credential storage. Never store tokens in localStorage, plaintext JSON, source files, logs, or Git.

Verify current stable dependencies and official documentation before selecting versions. Keep the dependency count reasonable.

The application must run on Windows 10/11 x64. Include clear setup instructions for the development environment and a reproducible Windows installer build. Detect missing Git and explain how to install or configure it.

Do not use a web-only mockup, Electron, a browser-only app, or fake Git implementations.

## 4. Architecture

Separate the application into:
- Native Git engine.
- Provider API adapters with a shared interface.
- Authentication and credential storage.
- Repository and account management.
- UI components and application state.
- Logging, error handling, and background task management.

Keep provider-specific features behind capability checks. Do not assume GitHub, GitLab, and Gitea expose identical APIs or authentication behavior.

Support custom base URLs for self-hosted providers, pagination, rate limits, timeouts, cancellation where safe, and clear authentication errors.

OAuth must use a secure flow appropriate for desktop applications, including PKCE or device authorization where supported. Never embed confidential client secrets in a public desktop binary. Document any provider-specific setup users must perform.

Use minimal Git permissions and minimal API scopes. Never perform destructive operations without explicit confirmation.

## 5. MVP Features

Build in this order:

1. **Application foundation**
   - Working Tauri Windows app.
   - Axiom design system.
   - Navigation, settings, error states, and logging.
   - `Git` installation and version detection.
   - Persistent window state and keyboard shortcuts.

2. **Local Git**
   - Open an existing local repository.
   - Clone, fetch, pull, and push.
   - View working tree status and changed files.
   - Stage/unstage files and individual diff hunks where practical.
   - Commit with a message.
   - Create, switch, rename, and delete branches.
   - View commit history and file diffs.
   - Manage remotes and tags.
   - Stash changes.
   - Merge and rebase with safe conflict handling.

3. **Accounts and providers**
   - Multiple accounts across all three providers.
   - PAT authentication and supported OAuth/application flows.
   - GitHub.com, GitLab.com, self-hosted GitLab, and custom Gitea URLs.
   - List, search, filter, and clone accessible repositories.
   - Show current user and connection status.
   - Secure credential storage and account removal.

4. **Remote collaboration**
   - Pull requests / merge requests.
   - View descriptions, authors, status, diffs, and comments where supported.
   - Create a PR/MR from a local branch.
   - Browse and create issues.
   - View releases and tags.
   - Show CI/CD or Actions pipeline status where provider APIs support it.

5. **Productivity**
   - Dashboard for recent repositories, local changes, and recent activity.
   - Command palette (`Ctrl+K`).
   - Search repositories, branches, commits, and files.
   - Compare branches and commits.
   - Blame view.
   - Background operation queue with useful logs.
   - Keyboard shortcuts and clear progress indicators.

Do not implement every advanced feature before the core workflow works end-to-end.

## 6. Security and Reliability

- Never log tokens or authorization headers.
- Never commit secrets.
- Never interpolate untrusted input into shell commands.
- Handle large repositories without blocking the UI.
- Handle API errors, expired tokens, rate limits, network failures, and missing permissions.
- Require confirmation for destructive actions such as force push, hard reset, branch deletion, and discarding changes.
- Explain exactly what an operation will change before confirming destructive actions.
- Use safe defaults and provide actionable errors.

## 7. Testing and Documentation

Create:
- `README.md`
- `HANDOFF.md`
- `TASKS.md`
- `PROGRESS.md`
- `docs/ARCHITECTURE.md`
- `docs/SECURITY.md`
- `docs/PROVIDERS.md`
- `docs/BUILD_WINDOWS.md`

Add automated tests for provider adapters, Git operations, authentication edge cases, error handling, and important UI flows. Use local temporary repositories for Git integration tests. Never require real user credentials in automated tests.

Set up CI to run formatting, linting, tests, and build checks. Keep documentation concise and accurate.

## 8. Context Preservation

Before any context compaction, update `HANDOFF.md`, `TASKS.md`, and `PROGRESS.md`. After compaction, read them before continuing. Critical decisions must not exist only in chat history.

Never claim tests, builds, provider compatibility, or Windows installation succeeded unless verified.

## 9. Git Rules

Preserve the user's Git identity. Never add Claude, Antigravity, an AI model, or an AI assistant as author/co-author. Never add AI `Co-authored-by` trailers. Do not change global Git settings or rewrite previous commits. Commit and push only when explicitly requested or authorized.

## 10. Start Now

First inspect the workspace and locate the design reference. If the current repository contains the old Camunda plugin, do not reuse its implementation; create a clean project in a separate directory and preserve the old repository.

Then:
1. Confirm the proposed architecture and important Windows prerequisites.
2. Initialize the new application and tracking documents.
3. Implement the first runnable vertical slice: launch the desktop app, detect Git, show the designed dashboard, open a local repository, and display its actual Git status.
4. Run available checks and build the Windows app where the environment supports it.
5. Record exact results and the next task.

Minimize unnecessary research and token usage. Prefer implementation over lengthy planning. Do not fake completed features. Deliver working code in small verified milestones.