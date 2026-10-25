/**
 * FlowGit Landing Page Interactive Logic
 * Axiom Design System & Blueprint DAG Engine
 */

(function () {
  'use strict';

  // ── Global State ──
  const state = {
    activeTab: 'graph',
    zoom: 1,
    pan: { x: 40, y: 40 },
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    selectedNodeId: 'c1',
    diffMode: 'unified',
    commandTab: 'portable',
    stagedFiles: [
      { id: 'f1', name: 'electron/git/executor.ts', status: 'M', additions: 34, deletions: 2 },
      { id: 'f2', name: 'src/views/Repository/Graph/GraphView.tsx', status: 'A', additions: 188, deletions: 0 },
    ],
    unstagedFiles: [
      { id: 'f3', name: 'shared/types/git.types.ts', status: 'M', additions: 12, deletions: 4 },
      { id: 'f4', name: 'DESIGN.md', status: 'M', additions: 6, deletions: 1 },
      { id: 'f5', name: 'tests/git/executor.test.ts', status: 'U', additions: 45, deletions: 0 },
    ]
  };

  // ── Blueprint Commit Graph Topology ──
  const graphNodes = [
    {
      id: 'c1',
      hash: 'a94f1c0',
      shortHash: 'a94f1c0',
      branch: 'main',
      isHead: true,
      tags: ['HEAD -> main', 'origin/main'],
      color: '#da5c2c',
      x: 640,
      y: 100,
      author: 'Alex Vance <alex@flowgit.io>',
      date: '2026-10-25 22:41:18',
      message: 'feat(graph): topological DAG bezier connector & minimap sync',
      parentIds: ['c2', 'c3'],
      files: [
        { path: 'src/views/Repository/Graph/GraphView.tsx', status: 'M', adds: 84, dels: 12 },
        { path: 'electron/git/history.ts', status: 'M', adds: 42, dels: 5 }
      ],
      diffSnippet: `@@ -118,9 +118,15 @@ export function computeBezierCurves(nodes, edges) {
-  const path = \`M \${source.x} \${source.y} L \${target.x} \${target.y}\`;
+  const dx = Math.abs(target.x - source.x) * 0.5;
+  const cp1x = source.x + dx;
+  const cp2x = target.x - dx;
+  const path = \`M \${source.x} \${source.y} C \${cp1x} \${source.y}, \${cp2x} \${target.y}, \${target.x} \${target.y}\`;
+  return { id: \`\${source.id}-\${target.id}\`, d: path, color: edgeColor };
 }`
    },
    {
      id: 'c2',
      hash: '7b3e9a1',
      shortHash: '7b3e9a1',
      branch: 'main',
      isHead: false,
      tags: [],
      color: '#da5c2c',
      x: 360,
      y: 100,
      author: 'Alex Vance <alex@flowgit.io>',
      date: '2026-10-25 19:14:02',
      message: 'perf(sqlite): WAL mode persistence for 100k+ commit repositories',
      parentIds: ['c4'],
      files: [
        { path: 'electron/persistence/database.ts', status: 'M', adds: 26, dels: 3 }
      ],
      diffSnippet: `@@ -42,3 +42,7 @@ export function initDatabase(dbPath: string) {
+  db.pragma('journal_mode = WAL');
+  db.pragma('synchronous = NORMAL');
+  db.pragma('cache_size = -64000'); // 64MB memory cache`
    },
    {
      id: 'c3',
      hash: 'f419c82',
      shortHash: 'f419c82',
      branch: 'feature/blueprint-minimap',
      isHead: false,
      tags: ['feat/minimap'],
      color: '#38bdf8',
      x: 360,
      y: 260,
      author: 'Elena Rostova <elena@flowgit.io>',
      date: '2026-10-25 18:02:40',
      message: 'feat(minimap): radar viewport bounding box with pan listener',
      parentIds: ['c4'],
      files: [
        { path: 'src/components/MinimapRadar.tsx', status: 'A', adds: 112, dels: 0 }
      ],
      diffSnippet: `@@ -0,0 +1,18 @@
+export const MinimapRadar: React.FC<MinimapProps> = ({ bounds, viewport }) => {
+  const ratioX = 140 / bounds.width;
+  const ratioY = 90 / bounds.height;
+  return <div className="minimap-box" style={{ left: viewport.x * ratioX }} />;
+};`
    },
    {
      id: 'c4',
      hash: 'd28a011',
      shortHash: 'd28a011',
      branch: 'main',
      isHead: false,
      tags: ['v1.0.0-rc.2'],
      color: '#da5c2c',
      x: 80,
      y: 100,
      author: 'Alex Vance <alex@flowgit.io>',
      date: '2026-10-24 23:55:10',
      message: 'security(executor): enforce argv array spawning with safe env redaction',
      parentIds: [],
      files: [
        { path: 'electron/git/executor.ts', status: 'M', adds: 65, dels: 18 }
      ],
      diffSnippet: `@@ -15,7 +15,9 @@ export function executeGit(args: string[], cwd: string) {
-  // DEPRECATED: exec(\`git \${args.join(' ')}\`)
+  // Safe argv spawn — no shell string interpolation
+  return spawn(gitPath, args, { cwd, shell: false, env: sanitizedEnv });
 }`
    }
  ];

  // ── Initialization ──
  document.addEventListener('DOMContentLoaded', () => {
    initAnnouncement();
    initTabs();
    initBlueprintGraph();
    initStagingDemo();
    initDiffViewer();
    initHistogram();
    initTerminalTabs();
    initClipboardCopy();
    initKeyboardShortcuts();
    initRepoLinks();
    updateDiffDisplay();
  });

  // ── 1. Announcement Banner ──
  function initAnnouncement() {
    const banner = document.getElementById('announcementBanner');
    const closeBtn = document.getElementById('closeAnnouncement');
    if (!banner || !closeBtn) return;

    if (sessionStorage.getItem('flowgit_announcement_closed') === 'true') {
      banner.style.display = 'none';
    }

    closeBtn.addEventListener('click', () => {
      banner.style.display = 'none';
      sessionStorage.setItem('flowgit_announcement_closed', 'true');
    });
  }

  // ── 2. Showcase Navigation Tabs ──
  function initTabs() {
    const tabs = document.querySelectorAll('.product-tab');
    const panels = document.querySelectorAll('.view-panel');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        if (!target) return;

        tabs.forEach((t) => t.classList.remove('active'));
        panels.forEach((p) => p.classList.remove('active'));

        tab.classList.add('active');
        const activePanel = document.getElementById(`panel-${target}`);
        if (activePanel) {
          activePanel.classList.add('active');
        }

        state.activeTab = target;

        // If graph tab opened, recalculate center
        if (target === 'graph') {
          renderGraph();
        }
      });
    });
  }

  // ── 3. Blueprint DAG SVG Engine ──
  function initBlueprintGraph() {
    const container = document.getElementById('graphCanvasContainer');
    const svg = document.getElementById('graphSvg');
    if (!container || !svg) return;

    // Zoom Controls
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomFitBtn = document.getElementById('zoomFitBtn');
    const jumpHeadBtn = document.getElementById('jumpHeadBtn');
    const searchInput = document.getElementById('graphSearchInput');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        state.zoom = Math.min(2.5, state.zoom + 0.15);
        renderGraph();
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        state.zoom = Math.max(0.4, state.zoom - 0.15);
        renderGraph();
      });
    }

    if (zoomFitBtn) {
      zoomFitBtn.addEventListener('click', () => {
        fitGraphToView();
      });
    }

    if (jumpHeadBtn) {
      jumpHeadBtn.addEventListener('click', () => {
        jumpToHead();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        filterGraphNodes(query);
      });
    }

    // Mouse Pan & Drag
    container.addEventListener('mousedown', (e) => {
      // Ignore click on node cards or controls
      if (e.target.closest('.node-card-group') || e.target.closest('.graph-controls-toolbar')) {
        return;
      }
      state.isDragging = true;
      state.dragStart = { x: e.clientX - state.pan.x, y: e.clientY - state.pan.y };
      container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.isDragging) return;
      state.pan.x = e.clientX - state.dragStart.x;
      state.pan.y = e.clientY - state.dragStart.y;
      renderGraph();
    });

    window.addEventListener('mouseup', () => {
      if (state.isDragging) {
        state.isDragging = false;
        container.style.cursor = 'grab';
      }
    });

    // Mouse wheel zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.max(0.4, Math.min(2.5, state.zoom * zoomFactor));

      // Zoom centered on cursor
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      state.pan.x = mouseX - (mouseX - state.pan.x) * (newZoom / state.zoom);
      state.pan.y = mouseY - (mouseY - state.pan.y) * (newZoom / state.zoom);
      state.zoom = newZoom;

      renderGraph();
    }, { passive: false });

    // Close Inspector button
    const closeInspectorBtn = document.getElementById('closeInspectorBtn');
    if (closeInspectorBtn) {
      closeInspectorBtn.addEventListener('click', () => {
        const drawer = document.getElementById('commitInspector');
        if (drawer) drawer.classList.remove('open');
      });
    }

    renderGraph();
  }

  function renderGraph() {
    const svg = document.getElementById('graphSvg');
    if (!svg) return;

    const NODE_WIDTH = 230;
    const NODE_HEIGHT = 76;

    // Clear previous SVG content
    svg.innerHTML = '';

    // Create main viewport transformation group
    const gViewport = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gViewport.setAttribute('transform', `translate(${state.pan.x}, ${state.pan.y}) scale(${state.zoom})`);

    // 1. Draw Bezier Connector Edges
    graphNodes.forEach((node) => {
      node.parentIds.forEach((parentId) => {
        const parent = graphNodes.find((n) => n.id === parentId);
        if (!parent) return;

        // Source = parent right edge; Target = child left edge
        const startX = parent.x + NODE_WIDTH;
        const startY = parent.y + NODE_HEIGHT / 2;
        const endX = node.x;
        const endY = node.y + NODE_HEIGHT / 2;

        const dx = Math.max(40, Math.abs(endX - startX) * 0.5);
        const cp1x = startX + dx;
        const cp1y = startY;
        const cp2x = endX - dx;
        const cp2y = endY;

        const pathData = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'dag-edge');
        path.setAttribute('stroke', node.color);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-opacity', '0.7');
        gViewport.appendChild(path);
      });
    });

    // 2. Draw Commit Nodes
    graphNodes.forEach((node) => {
      const isSelected = state.selectedNodeId === node.id;

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', `node-card-group ${isSelected ? 'selected' : ''}`);
      group.setAttribute('data-node-id', node.id);
      group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      group.style.cursor = 'pointer';

      // Base card rectangle
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', NODE_WIDTH);
      rect.setAttribute('height', NODE_HEIGHT);
      rect.setAttribute('rx', '2');
      rect.setAttribute('fill', '#111111');
      rect.setAttribute('stroke', isSelected ? '#da5c2c' : '#202020');
      rect.setAttribute('stroke-width', isSelected ? '2' : '1');
      group.appendChild(rect);

      // Branch color indicator stripe on left edge (2px)
      const stripe = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      stripe.setAttribute('x', '0');
      stripe.setAttribute('y', '0');
      stripe.setAttribute('width', '3');
      stripe.setAttribute('height', NODE_HEIGHT);
      stripe.setAttribute('rx', '1');
      stripe.setAttribute('fill', node.color);
      group.appendChild(stripe);

      // Short Hash Tag Pill
      const hashText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      hashText.setAttribute('x', '12');
      hashText.setAttribute('y', '22');
      hashText.setAttribute('fill', '#eeeeee');
      hashText.setAttribute('font-family', 'var(--font-mono)');
      hashText.setAttribute('font-size', '12');
      hashText.setAttribute('font-weight', '700');
      hashText.textContent = node.shortHash;
      group.appendChild(hashText);

      // Branch / Tag Badge (if any)
      if (node.tags.length > 0) {
        const badgeBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        badgeBg.setAttribute('x', '76');
        badgeBg.setAttribute('y', '10');
        badgeBg.setAttribute('width', '140');
        badgeBg.setAttribute('height', '16');
        badgeBg.setAttribute('rx', '2');
        badgeBg.setAttribute('fill', '#191919');
        badgeBg.setAttribute('stroke', '#3a3a3a');
        group.appendChild(badgeBg);

        const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        badgeText.setAttribute('x', '82');
        badgeText.setAttribute('y', '22');
        badgeText.setAttribute('fill', node.color);
        badgeText.setAttribute('font-family', 'var(--font-mono)');
        badgeText.setAttribute('font-size', '10');
        badgeText.setAttribute('font-weight', '700');
        badgeText.textContent = node.tags.join(', ').substring(0, 22);
        group.appendChild(badgeText);
      }

      // Commit Message
      const msgText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      msgText.setAttribute('x', '12');
      msgText.setAttribute('y', '44');
      msgText.setAttribute('fill', '#b4b4b4');
      msgText.setAttribute('font-family', 'var(--font-mono)');
      msgText.setAttribute('font-size', '11');
      const truncated = node.message.length > 28 ? node.message.substring(0, 27) + '…' : node.message;
      msgText.textContent = truncated;
      group.appendChild(msgText);

      // Author & Time Footer
      const authorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      authorText.setAttribute('x', '12');
      authorText.setAttribute('y', '62');
      authorText.setAttribute('fill', '#606060');
      authorText.setAttribute('font-family', 'var(--font-mono)');
      authorText.setAttribute('font-size', '10');
      authorText.textContent = node.author.split('<')[0].trim() + ' • ' + node.date.split(' ')[0];
      group.appendChild(authorText);

      // Click event on node
      group.addEventListener('click', (e) => {
        e.stopPropagation();
        selectNode(node);
      });

      gViewport.appendChild(group);
    });

    svg.appendChild(gViewport);
    updateMinimap();
  }

  function selectNode(node) {
    state.selectedNodeId = node.id;
    renderGraph();

    // Populate Inspector Drawer
    const drawer = document.getElementById('commitInspector');
    if (!drawer) return;

    document.getElementById('inspHash').textContent = node.hash;
    document.getElementById('inspAuthor').textContent = node.author;
    document.getElementById('inspDate').textContent = node.date;
    document.getElementById('inspMessage').textContent = node.message;

    // Populate files
    const fileListEl = document.getElementById('inspFileList');
    if (fileListEl) {
      fileListEl.innerHTML = node.files
        .map(
          (f) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:11px;">
          <span style="color:#eeeeee;">${f.path}</span>
          <span style="color:#4ade80;">+${f.adds} <span style="color:#f87171;">-${f.dels}</span></span>
        </div>
      `
        )
        .join('');
    }

    const diffPreviewEl = document.getElementById('inspDiffCode');
    if (diffPreviewEl) {
      diffPreviewEl.textContent = node.diffSnippet;
    }

    drawer.classList.add('open');
  }

  function jumpToHead() {
    const headNode = graphNodes.find((n) => n.isHead);
    if (!headNode) return;

    const container = document.getElementById('graphCanvasContainer');
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    state.pan.x = w / 2 - (headNode.x + 115) * state.zoom;
    state.pan.y = h / 2 - (headNode.y + 38) * state.zoom;
    renderGraph();
  }

  function fitGraphToView() {
    const container = document.getElementById('graphCanvasContainer');
    if (!container) return;

    state.zoom = 0.9;
    state.pan.x = 40;
    state.pan.y = 80;
    renderGraph();
  }

  function filterGraphNodes(query) {
    const groups = document.querySelectorAll('.node-card-group');
    groups.forEach((g) => {
      const nodeId = g.getAttribute('data-node-id');
      const node = graphNodes.find((n) => n.id === nodeId);
      if (!node) return;

      if (!query || node.message.toLowerCase().includes(query) || node.hash.includes(query)) {
        g.style.opacity = '1';
      } else {
        g.style.opacity = '0.25';
      }
    });
  }

  function updateMinimap() {
    const box = document.getElementById('minimapBox');
    if (!box) return;

    // Compute relative viewport position
    const normX = Math.max(0, Math.min(100, (-state.pan.x / 10) + 20));
    const normY = Math.max(0, Math.min(60, (-state.pan.y / 10) + 10));

    box.style.left = `${normX}px`;
    box.style.top = `${normY}px`;
    box.style.width = `${Math.max(30, 80 / state.zoom)}px`;
    box.style.height = `${Math.max(20, 50 / state.zoom)}px`;
  }

  // ── 4. Interactive Staging Demo (Tab 2) ──
  function initStagingDemo() {
    renderStagingLists();

    const commitInput = document.getElementById('commitInputMsg');
    const charCounter = document.getElementById('commitCharCounter');
    const commitBtn = document.getElementById('commitBtn');

    if (commitInput && charCounter) {
      commitInput.addEventListener('input', () => {
        const len = commitInput.value.length;
        charCounter.textContent = `${len} / 72 chars`;
        if (len > 72) {
          charCounter.style.color = '#ef4444';
        } else {
          charCounter.style.color = '#606060';
        }
      });
    }

    if (commitBtn && commitInput) {
      commitBtn.addEventListener('click', () => {
        if (!commitInput.value.trim()) {
          showToast('Please enter a commit message');
          return;
        }
        if (state.stagedFiles.length === 0) {
          showToast('No changes staged to commit');
          return;
        }

        const msg = commitInput.value.trim();
        showToast(`[OK] Committed: "${msg.substring(0, 30)}..."`);
        state.stagedFiles = [];
        commitInput.value = '';
        if (charCounter) charCounter.textContent = '0 / 72 chars';
        renderStagingLists();
      });
    }

    const stageAllBtn = document.getElementById('stageAllBtn');
    if (stageAllBtn) {
      stageAllBtn.addEventListener('click', () => {
        state.stagedFiles = [...state.stagedFiles, ...state.unstagedFiles];
        state.unstagedFiles = [];
        renderStagingLists();
        showToast('All files staged (porcelain index updated)');
      });
    }

    const unstageAllBtn = document.getElementById('unstageAllBtn');
    if (unstageAllBtn) {
      unstageAllBtn.addEventListener('click', () => {
        state.unstagedFiles = [...state.unstagedFiles, ...state.stagedFiles];
        state.stagedFiles = [];
        renderStagingLists();
        showToast('All files unstaged');
      });
    }
  }

  function renderStagingLists() {
    const stagedEl = document.getElementById('stagedFilesContainer');
    const unstagedEl = document.getElementById('unstagedFilesContainer');
    const stagedCountEl = document.getElementById('stagedCount');
    const unstagedCountEl = document.getElementById('unstagedCount');

    if (stagedCountEl) stagedCountEl.textContent = `(${state.stagedFiles.length})`;
    if (unstagedCountEl) unstagedCountEl.textContent = `(${state.unstagedFiles.length})`;

    if (stagedEl) {
      stagedEl.innerHTML = state.stagedFiles.length === 0
        ? '<div style="padding:12px; color:#606060; font-size:11px;">No files staged in index.</div>'
        : state.stagedFiles.map((file) => `
          <div class="staging-file-row">
            <div class="staging-file-name">
              <span class="file-status-letter status-${file.status.toLowerCase()}">${file.status}</span>
              <span>${file.name}</span>
            </div>
            <button class="staging-action-btn" data-action="unstage" data-id="${file.id}">Unstage -</button>
          </div>
        `).join('');
    }

    if (unstagedEl) {
      unstagedEl.innerHTML = state.unstagedFiles.length === 0
        ? '<div style="padding:12px; color:#606060; font-size:11px;">Working tree clean.</div>'
        : state.unstagedFiles.map((file) => `
          <div class="staging-file-row">
            <div class="staging-file-name">
              <span class="file-status-letter status-${file.status.toLowerCase()}">${file.status}</span>
              <span>${file.name}</span>
            </div>
            <button class="staging-action-btn" data-action="stage" data-id="${file.id}">Stage +</button>
          </div>
        `).join('');
    }

    // Attach click handlers
    document.querySelectorAll('.staging-action-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');

        if (action === 'stage') {
          const item = state.unstagedFiles.find((f) => f.id === id);
          if (item) {
            state.unstagedFiles = state.unstagedFiles.filter((f) => f.id !== id);
            state.stagedFiles.push(item);
          }
        } else if (action === 'unstage') {
          const item = state.stagedFiles.find((f) => f.id === id);
          if (item) {
            state.stagedFiles = state.stagedFiles.filter((f) => f.id !== id);
            state.unstagedFiles.push(item);
          }
        }
        renderStagingLists();
      });
    });
  }

  // ── 5. Advanced Diff Viewer (Tab 3) ──
  function initDiffViewer() {
    const unifiedBtn = document.getElementById('diffUnifiedBtn');
    const splitBtn = document.getElementById('diffSplitBtn');

    if (unifiedBtn && splitBtn) {
      unifiedBtn.addEventListener('click', () => {
        state.diffMode = 'unified';
        unifiedBtn.classList.add('active');
        splitBtn.classList.remove('active');
        updateDiffDisplay();
      });

      splitBtn.addEventListener('click', () => {
        state.diffMode = 'split';
        splitBtn.classList.add('active');
        unifiedBtn.classList.remove('active');
        updateDiffDisplay();
      });
    }
  }

  function updateDiffDisplay() {
    const diffContainer = document.getElementById('diffLinesContainer');
    if (!diffContainer) return;

    const diffLines = [
      { type: 'header', text: '@@ -45,14 +45,21 @@ export async function executeGitSafe(args, options) {' },
      { type: 'context', oldNum: '45', newNum: '45', text: '  const binaryPath = await detectSystemGitBinary();' },
      { type: 'context', oldNum: '46', newNum: '46', text: '  if (!binaryPath) {' },
      { type: 'context', oldNum: '47', newNum: '47', text: '    throw new GitBinaryNotFoundError();' },
      { type: 'context', oldNum: '48', newNum: '48', text: '  }' },
      { type: 'deleted', oldNum: '49', newNum: '', text: '- const rawOutput = child_process.execSync(`git ${args.join(" ")}`);' },
      { type: 'added', oldNum: '', newNum: '49', text: '+ // SECURITY: Spawn directly with argv arguments array (no shell concatenation)' },
      { type: 'added', oldNum: '', newNum: '50', text: '+ const sanitizedArgs = redactAuthenticationTokens(args);' },
      { type: 'added', oldNum: '', newNum: '51', text: '+ const child = child_process.spawn(binaryPath, sanitizedArgs, {' },
      { type: 'added', oldNum: '', newNum: '52', text: '+   cwd: options.workingDirectory,' },
      { type: 'added', oldNum: '', newNum: '53', text: '+   shell: false,' },
      { type: 'added', oldNum: '', newNum: '54', text: '+   windowsHide: true,' },
      { type: 'added', oldNum: '', newNum: '55', text: '+ });' },
      { type: 'context', oldNum: '50', newNum: '56', text: '  return parsePorcelainOutput(child);' },
      { type: 'context', oldNum: '51', newNum: '57', text: '}' }
    ];

    if (state.diffMode === 'unified') {
      diffContainer.innerHTML = diffLines
        .map((line) => {
          if (line.type === 'header') {
            return `<div class="diff-line hunk-header"><div class="diff-num-col">...</div><div class="diff-text-col">${line.text}</div></div>`;
          }
          const cls = line.type === 'added' ? 'added' : line.type === 'deleted' ? 'deleted' : '';
          return `
            <div class="diff-line ${cls}">
              <div class="diff-num-col">${line.oldNum || ''}</div>
              <div class="diff-num-col" style="border-right: 1px solid var(--color-slate);">${line.newNum || ''}</div>
              <div class="diff-text-col">${escapeHtml(line.text)}</div>
            </div>
          `;
        })
        .join('');
    } else {
      // Split mode simulation
      diffContainer.innerHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; height: 100%;">
          <div style="border-right: 1px solid var(--color-iron);">
            <div style="padding:6px 12px; background:#111; font-size:11px; color:#f87171; border-bottom:1px solid #202020;">BASE (REVISION A)</div>
            <div class="diff-line"><div class="diff-num-col">45</div><div class="diff-text-col">  const binaryPath = await detectSystemGitBinary();</div></div>
            <div class="diff-line"><div class="diff-num-col">46</div><div class="diff-text-col">  if (!binaryPath) {</div></div>
            <div class="diff-line"><div class="diff-num-col">47</div><div class="diff-text-col">    throw new GitBinaryNotFoundError();</div></div>
            <div class="diff-line"><div class="diff-num-col">48</div><div class="diff-text-col">  }</div></div>
            <div class="diff-line deleted"><div class="diff-num-col">49</div><div class="diff-text-col">- const rawOutput = child_process.execSync(...);</div></div>
            <div class="diff-line"><div class="diff-num-col">50</div><div class="diff-text-col">  return parsePorcelainOutput(child);</div></div>
          </div>
          <div>
            <div style="padding:6px 12px; background:#111; font-size:11px; color:#4ade80; border-bottom:1px solid #202020;">HEAD (REVISION B)</div>
            <div class="diff-line"><div class="diff-num-col">45</div><div class="diff-text-col">  const binaryPath = await detectSystemGitBinary();</div></div>
            <div class="diff-line"><div class="diff-num-col">46</div><div class="diff-text-col">  if (!binaryPath) {</div></div>
            <div class="diff-line"><div class="diff-num-col">47</div><div class="diff-text-col">    throw new GitBinaryNotFoundError();</div></div>
            <div class="diff-line"><div class="diff-num-col">48</div><div class="diff-text-col">  }</div></div>
            <div class="diff-line added"><div class="diff-num-col">49</div><div class="diff-text-col">+ const child = child_process.spawn(binaryPath...);</div></div>
            <div class="diff-line added"><div class="diff-num-col">50</div><div class="diff-text-col">+ return parsePorcelainOutput(child);</div></div>
          </div>
        </div>
      `;
    }
  }

  // ── 6. Activity Histogram (Axiom Design Specification) ──
  function initHistogram() {
    const container = document.getElementById('histogramBars');
    if (!container) return;

    // Pattern of 48 activity bars
    const heights = [
      4, 6, 8, 4, 12, 16, 8, 4, 14, 18, 16, 20, 10, 6, 4, 8, 14, 16, 12, 18,
      22, 14, 10, 8, 4, 12, 16, 18, 20, 24, 16, 12, 8, 14, 18, 16, 20, 24, 28,
      18, 14, 10, 6, 12, 16, 20, 24, 18
    ];

    container.innerHTML = heights
      .map((h, i) => {
        const isAccent = h >= 22;
        return `<div class="histogram-bar ${isAccent ? 'active-accent' : ''}" style="height:${h}px;" title="Activity slot ${i + 1}: ${h * 3} events"></div>`;
      })
      .join('');
  }

  // ── 7. Interactive Terminal Commands Switcher ──
  function initTerminalTabs() {
    const tabs = document.querySelectorAll('.terminal-tab-btn');
    const codeBlock = document.getElementById('terminalCodeDisplay');
    if (!tabs || !codeBlock) return;

    const commands = {
      portable: `# Standalone Single-File Executable
# Download FlowGit-Portable.exe from GitHub Releases and launch directly:
.\\FlowGit-Portable.exe

# Zero installation, zero registry writes`,
      binaries: `# Compiled Binaries (Pre-compiled Unpacked Archive)
# 1. Download and extract FlowGit-win-x64-binaries.zip
Expand-Archive -Path .\\FlowGit-win-x64-binaries.zip -DestinationPath .\\FlowGit

# 2. Run the executable directly (no installer required):
.\\FlowGit\\FlowGit.exe`,
      source: `# 1. Clone repository
git clone <repository-url>
cd FlowGit

# 2. Install dependencies & run dev server
npm install
npm run dev

# 3. Compile standalone Windows directory or portable exe
npm run dist:dir
npx electron-builder --win portable`
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const type = tab.getAttribute('data-cmd');
        if (!type || !commands[type]) return;

        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        codeBlock.textContent = commands[type];
        state.commandTab = type;
      });
    });
  }

  // ── 8. Clipboard Copy Functionality ──
  function initClipboardCopy() {
    const copyBtns = document.querySelectorAll('[data-copy-target]');
    copyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-copy-target');
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        const text = targetEl.textContent || targetEl.innerText;
        navigator.clipboard.writeText(text.trim()).then(() => {
          const original = btn.textContent;
          btn.textContent = '✓ COPIED';
          showToast('Copied to clipboard');
          setTimeout(() => {
            btn.textContent = original;
          }, 1800);
        }).catch(() => {
          showToast('Error copying to clipboard');
        });
      });
    });

    const copyFloatingBtn = document.getElementById('copyTerminalFloatingBtn');
    if (copyFloatingBtn) {
      copyFloatingBtn.addEventListener('click', () => {
        const codeEl = document.getElementById('terminalCodeDisplay');
        if (!codeEl) return;
        navigator.clipboard.writeText(codeEl.textContent.trim()).then(() => {
          copyFloatingBtn.textContent = '✓ COPIED';
          showToast('Terminal command copied');
          setTimeout(() => {
            copyFloatingBtn.textContent = 'COPY';
          }, 1800);
        });
      });
    }
  }

  // ── 9. Global Keyboard Shortcuts ──
  function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't trigger when typing in inputs or textareas
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        return;
      }

      if (e.key === '1') {
        switchTab('graph');
      } else if (e.key === '2') {
        switchTab('staging');
      } else if (e.key === '3') {
        switchTab('diff');
      } else if (e.key === '4') {
        switchTab('branches');
      } else if (e.key === 'h' || e.key === 'H') {
        jumpToHead();
        showToast('Jumped to HEAD commit');
      } else if (e.key === 'f' || e.key === 'F') {
        fitGraphToView();
        showToast('Fitted DAG graph to viewport');
      } else if (e.key === 'Escape') {
        const drawer = document.getElementById('commitInspector');
        if (drawer) drawer.classList.remove('open');
      }
    });
  }

  function switchTab(tabId) {
    const tabBtn = document.querySelector(`.product-tab[data-tab="${tabId}"]`);
    if (tabBtn) tabBtn.click();
  }

  // ── 10. Repository Link Notification ──
  function initRepoLinks() {
    document.querySelectorAll('.github-repo-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href === '#downloads') {
          showToast('GitHub release repository link will be updated soon');
        }
      });
    });
  }

  // ── Helpers ──
  function showToast(message) {
    const toast = document.getElementById('globalToast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
})();
