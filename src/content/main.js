import { parseData } from '../utils/parsers';
import { renderNode } from '../ui/tree';
import { computeDiff } from '../utils/diff';
import { showToast } from '../utils/toast';
import '../theme/core.css';

let v1Data = null;
let v2Data = null;
let isDiffMode = false;
let originalRaw = '';
let originalType = '';
let originalSize = '';

// Search state
let searchMatches = [];
let currentSearchIndex = -1;

const init = () => {
  const pre = document.querySelector('pre');
  const bodyText = pre ? pre.textContent : document.body.innerText;
  if (!bodyText || bodyText.length < 2) return;

  const { data, type, error } = parseData(bodyText);
  if (data && !error) {
    v1Data = data;
    originalRaw = bodyText;
    originalType = type;
    originalSize = (new Blob([bodyText]).size / 1024).toFixed(2);

    const uiRoot = document.createElement('div');
    uiRoot.id = 'devjson-root';
    document.body.innerHTML = '';
    document.body.appendChild(uiRoot);

    renderShell();
    showNormalMode();
  }
};

const renderShell = () => {
  const root = document.getElementById('devjson-root');
  root.innerHTML = `
    <div class="top-bar">
      <div class="logo">DevJSON</div>
      <div class="badge" id="type-badge">${originalType.toUpperCase()}</div>
      <div class="size-badge">${originalSize} KB</div>
      <div class="search-wrapper">
        <input type="text" id="search-input" placeholder="Search..." />
        <div class="search-nav">
          <button id="search-prev" class="nav-btn" title="Previous match">◀</button>
          <button id="search-next" class="nav-btn" title="Next match">▶</button>
        </div>
        <span id="search-count"></span>
      </div>
      <div class="spacer" style="flex: 1"></div>
      <button id="toggle-raw">Raw</button>
      <button id="copy-all">Copy All</button>
      <button id="toggle-view-mode">Diff Mode</button>
    </div>
    <div id="main-view" class="main-layout"></div>
  `;

  document.getElementById('toggle-raw').onclick = () => {
    const rawContent = v2Data ? JSON.stringify(v2Data, null, 2) : originalRaw;
    document.body.innerHTML = `<pre style="padding: 20px; background: #0b0e14; color: #a9b1d6; font-family: 'JetBrains Mono', monospace; white-space: pre-wrap; margin: 0; min-height: 100vh;">${rawContent}</pre>`;
    const backBtn = document.createElement('button');
    backBtn.innerText = 'Back to DevJSON';
    backBtn.style = 'position: fixed; top: 12px; right: 12px; z-index: 10000; padding: 10px 20px; background: #3d59a1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-family: sans-serif;';
    backBtn.onclick = () => window.location.reload();
    document.body.appendChild(backBtn);
  };

  document.getElementById('copy-all').onclick = (e) => {
    const dataToCopy = v2Data || v1Data;
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2)).then(() => {
      showToast('Copied JSON');
      e.target.innerText = 'Copied!';
      setTimeout(() => e.target.innerText = 'Copy All', 2000);
    });
  };

  document.getElementById('toggle-view-mode').onclick = (e) => {
    if (isDiffMode) {
      showNormalMode();
      e.target.innerText = 'Diff Mode';
    } else {
      showDiffMode();
      e.target.innerText = 'Normal Mode';
    }
  };

  const searchInput = document.getElementById('search-input');
  searchInput.oninput = (e) => performSearch(e.target.value);
  searchInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) navigateSearch(-1);
      else navigateSearch(1);
    }
  };

  document.getElementById('search-prev').onclick = () => navigateSearch(-1);
  document.getElementById('search-next').onclick = () => navigateSearch(1);
};

const showNormalMode = () => {
  isDiffMode = false;
  const main = document.getElementById('main-view');
  main.classList.remove('diff-active');
  main.innerHTML = `<div id="primary-view" class="view-pane"></div>`;
  const primary = document.getElementById('primary-view');
  primary.appendChild(renderNode(v2Data || v1Data));
  performSearch(document.getElementById('search-input')?.value || '');
};

const showDiffMode = () => {
  isDiffMode = true;
  if (!v2Data) v2Data = JSON.parse(JSON.stringify(v1Data));

  const main = document.getElementById('main-view');
  main.classList.add('diff-active');
  main.innerHTML = `
    <div class="diff-top-row">
      <div class="diff-pane" id="v1-pane">
        <div class="pane-header">Source (V1)</div>
        <div id="v1-root" class="tree-content"></div>
      </div>
      <div class="diff-pane" id="v2-pane" tabindex="0">
        <div class="pane-header">
           <span>Live Editor (V2)</span>
           <span style="font-size: 10px; opacity: 0.5; margin-left: auto;">[Edit value / Paste JSON]</span>
        </div>
        <div id="v2-root" class="tree-content"></div>
      </div>
    </div>
    <div class="diff-bottom-row">
      <div class="pane-header">Unified Git Diff (Total Structure)</div>
      <div id="diff-out" class="diff-content mono" style="font-size: 13px; font-family: 'JetBrains Mono', monospace; line-height: 1.4; white-space: pre; overflow: auto;"></div>
    </div>
  `;

  const v1Root = document.getElementById('v1-root');
  const v2Root = document.getElementById('v2-root');
  const diffOut = document.getElementById('diff-out');

  const refreshDiff = () => {
    const diffResult = computeDiff(v1Data, v2Data);
    diffOut.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'unified-diff-tree';
    renderUnifiedTree(v1Data, v2Data, diffResult.delta, container);
    diffOut.appendChild(container);
  };

  const onV2Change = (path, newVal) => {
    updateNestedValue(v2Data, path, newVal);
    refreshDiff();
  };

  v1Root.appendChild(renderNode(v1Data));
  v2Root.appendChild(renderNode(v2Data, null, 0, '', onV2Change));
  refreshDiff();

  document.getElementById('v2-pane').onpaste = (e) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    const { data, error } = parseData(text);
    if (!error) {
      v2Data = data;
      v2Root.innerHTML = '';
      v2Root.appendChild(renderNode(v2Data, null, 0, '', onV2Change));
      refreshDiff();
      showToast('JSON Updated');
    } else {
      showToast('Invalid JSON in Clipboard', true);
    }
  };
};

// --- RENDER UNIFIED DIFF TREE ---

const renderUnifiedTree = (v1, v2, delta, container, level = 0, key = null, isLast = true) => {
  const indent = '  '.repeat(level);
  const comma = isLast ? '' : ',';
  const prefix = (k) => k !== null ? `"${k}": ` : '';
  
  const addLine = (txt, cls = '') => {
    const line = document.createElement('div');
    line.className = `diff-line ${cls}`;
    line.textContent = txt;
    container.appendChild(line);
  };

  if (Array.isArray(delta)) {
    if (delta.length === 1) { // Added
      addLine(`+ ${indent}${prefix(key)}${JSON.stringify(delta[0], null, 2).split('\n').join('\n+ ' + indent)}${comma}`, 'added');
    } else if (delta.length === 3 && delta[1] === 0 && delta[2] === 0) { // Deleted
      addLine(`- ${indent}${prefix(key)}${JSON.stringify(delta[0], null, 2).split('\n').join('\n- ' + indent)}${comma}`, 'deleted');
    } else if (delta.length === 2) { // Modified
      addLine(`- ${indent}${prefix(key)}${JSON.stringify(delta[0])}${comma}`, 'deleted');
      addLine(`+ ${indent}${prefix(key)}${JSON.stringify(delta[1])}${comma}`, 'added');
    }
    return;
  }

  const currentVal = delta ? (v2 !== undefined ? v2 : v1) : (v2 !== undefined ? v2 : v1);
  const isObj = currentVal && typeof currentVal === 'object';
  const isArr = Array.isArray(currentVal);

  if (isObj) {
    addLine(`  ${indent}${prefix(key)}${isArr ? '[' : '{'}`);
    const keys = Array.from(new Set([
      ...Object.keys(v1 || {}),
      ...Object.keys(v2 || {})
    ])).filter(k => k !== '_t');
    keys.forEach((k, i) => {
      const subDelta = delta ? delta[k] : undefined;
      const last = i === keys.length - 1;
      renderUnifiedTree(v1 ? v1[k] : undefined, v2 ? v2[k] : undefined, subDelta, container, level + 1, isArr ? null : k, last);
    });
    addLine(`  ${indent}${isArr ? ']' : '}'}${comma}`);
  } else {
    addLine(`  ${indent}${prefix(key)}${JSON.stringify(currentVal)}${comma}`);
  }
};

const performSearch = (query) => {
  searchMatches = [];
  currentSearchIndex = -1;
  const counter = document.getElementById('search-count');

  // Clear previous matches and restore original text
  document.querySelectorAll('.search-container').forEach(el => {
    el.innerHTML = el.dataset.original || el.textContent;
    el.classList.remove('search-container', 'search-match', 'search-active');
  });
  
  document.querySelectorAll('.search-inner-match').forEach(el => el.replaceWith(el.textContent));

  if (!query || query.length < 1) {
    if (counter) counter.innerText = '';
    return;
  }

  const qLower = query.toLowerCase();
  const spans = document.querySelectorAll('.syn-key, .syn-string, .syn-number, .syn-boolean, .syn-null');
  
  spans.forEach(span => {
    const text = span.textContent;
    if (text.toLowerCase().includes(qLower)) {
      span.classList.add('search-match', 'search-container');
      if (!span.dataset.original) span.dataset.original = text;
      
      // Inject internal spans for precise text highlight
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      span.innerHTML = text.replace(regex, '<span class="search-inner-match">$1</span>');
      
      const inners = span.querySelectorAll('.search-inner-match');
      inners.forEach(inner => searchMatches.push(inner));
    }
  });

  if (searchMatches.length > 0) {
    currentSearchIndex = 0;
    navigateSearch(0);
  } else {
    if (counter) counter.innerText = '0 matches';
  }
};

const navigateSearch = (direction) => {
  if (searchMatches.length === 0) return;

  // Clear current active match
  if (currentSearchIndex >= 0 && searchMatches[currentSearchIndex]) {
    searchMatches[currentSearchIndex].classList.remove('search-active');
    searchMatches[currentSearchIndex].parentElement.classList.remove('line-active');
  }

  currentSearchIndex = (currentSearchIndex + direction + searchMatches.length) % searchMatches.length;
  const match = searchMatches[currentSearchIndex];
  match.classList.add('search-active');
  match.parentElement.classList.add('line-active');

  // Ensure all parents are expanded
  let parent = match.closest('.node-content');
  while (parent) {
    parent.style.display = 'block';
    const toggle = parent.parentElement.querySelector('.toggle');
    if (toggle) {
      toggle.innerText = '▼';
      toggle.classList.add('expanded');
    }
    parent = parent.parentElement.closest('.node-content');
  }

  // Scroll into view - instant behavior for speed as requested
  match.scrollIntoView({ behavior: 'auto', block: 'center' });

  const counter = document.getElementById('search-count');
  if (counter) counter.innerText = `${currentSearchIndex + 1} of ${searchMatches.length}`;
};

const updateNestedValue = (obj, path, value) => {
  if (!path) return;
  const parts = path.split(/\.|\[|\]/).filter(Boolean);
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    current = current[key];
  }
  current[parts[parts.length - 1]] = value;
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  window.addEventListener('DOMContentLoaded', init);
}
