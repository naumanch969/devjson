import { parseData } from '../utils/parsers';
import { renderNode } from '../ui/tree';
import { computeDiff } from '../utils/diff';
import { showToast } from '../utils/toast';
import '../theme/core.css';

let v1Data = null;
let v2Data = null;

const init = () => {
  const pre = document.querySelector('pre');
  const bodyText = pre ? pre.textContent : document.body.innerText;

  if (!bodyText || bodyText.length < 2) return;

  const { data, type, error } = parseData(bodyText);

  if (data && !error) {
    v1Data = data;
    const size = (new Blob([bodyText]).size / 1024).toFixed(2);
    const originalContent = bodyText;
    const uiRoot = document.createElement('div');
    uiRoot.id = 'devjson-root';

    document.body.innerHTML = '';
    document.body.appendChild(uiRoot);

    renderUI(data, type, originalContent, size);
  }
};

const renderUI = (data, type, raw, size) => {
  const root = document.getElementById('devjson-root');

  root.innerHTML = `
    <div class="top-bar">
      <div class="logo">DevJSON</div>
      <div class="badge">${type.toUpperCase()}</div>
      <div class="size-badge">${size} KB</div>
      <div class="search-wrapper">
        <input type="text" id="search-input" placeholder="Search keys or values..." />
        <span id="search-count"></span>
      </div>
      <div class="spacer" style="flex: 1"></div>
      <button id="toggle-raw">Raw</button>
      <button id="copy-all">Copy All</button>
      <button id="diff-mode">Diff Mode</button>
    </div>
    <div id="main-view" class="main-layout">
      <div id="primary-view" class="view-pane"></div>
    </div>
  `;

  document.getElementById('primary-view').appendChild(renderNode(data));

  document.getElementById('toggle-raw').onclick = () => {
    document.body.innerHTML = `<pre style="padding: 20px; background: #0b0e14; color: #a9b1d6; font-family: 'JetBrains Mono', monospace; white-space: pre-wrap; margin: 0; min-height: 100vh;">${raw}</pre>`;
    const backBtn = document.createElement('button');
    backBtn.innerText = 'Back to DevJSON';
    backBtn.style = 'position: fixed; top: 12px; right: 12px; z-index: 10000; padding: 10px 20px; background: #3d59a1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-family: sans-serif; box-shadow: 0 4px 15px rgba(0,0,0,0.5);';
    backBtn.onclick = () => window.location.reload();
    document.body.appendChild(backBtn);
  };

  document.getElementById('copy-all').onclick = (e) => {
    navigator.clipboard.writeText(raw).then(() => {
      showToast('Document copied to clipboard');
      e.target.innerText = 'Copied!';
      setTimeout(() => e.target.innerText = 'Copy All', 2000);
    });
  };

  const searchInput = document.getElementById('search-input');
  searchInput.oninput = (e) => performSearch(e.target.value.toLowerCase());

  document.getElementById('diff-mode').onclick = () => {
    activateTriplePane(data);
  };
};

const activateTriplePane = (initialV1) => {
  v1Data = initialV1;
  v2Data = JSON.parse(JSON.stringify(initialV1)); // Start with a clone
  
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
           <span style="font-size: 10px; opacity: 0.5; margin-left: auto;">[Click value to edit | Paste JSON anywhere]</span>
        </div>
        <div id="v2-root" class="tree-content"></div>
      </div>
    </div>
    <div class="diff-bottom-row">
      <div class="pane-header">Structural Changes (Git Style)</div>
      <div id="diff-out" class="diff-content mono"></div>
    </div>
  `;

  const v1Root = document.getElementById('v1-root');
  const v2Root = document.getElementById('v2-root');
  const diffOut = document.getElementById('diff-out');
  const v2Pane = document.getElementById('v2-pane');

  const refreshDiff = () => {
    const diffResult = computeDiff(v1Data, v2Data);
    if (!diffResult.hasChanges) {
      diffOut.innerHTML = '<div class="no-diff">Files are structurally identical.</div>';
    } else {
      diffOut.innerHTML = renderDelta(diffResult.delta);
    }
  };

  const onV2Change = (path, newVal) => {
    updateNestedValue(v2Data, path, newVal);
    refreshDiff();
  };

  v1Root.appendChild(renderNode(v1Data));
  v2Root.appendChild(renderNode(v2Data, null, 0, '', onV2Change));
  refreshDiff();

  // Handle Global Paste in V2 Pane
  v2Pane.onpaste = (e) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;

    const { data, error } = parseData(text);
    if (!error) {
      v2Data = data;
      v2Root.innerHTML = '';
      v2Root.appendChild(renderNode(v2Data, null, 0, '', onV2Change));
      refreshDiff();
      showToast('JSON Updated from Clipboard');
    } else {
      showToast('Invalid JSON in Clipboard', true);
    }
  };

  showToast('Live Tree Editor Enabled');
};

const performSearch = (query) => {
  const nodes = document.querySelectorAll('.node');
  let count = 0;
  nodes.forEach(node => {
    const text = node.textContent.toLowerCase();
    if (query && text.includes(query)) {
      node.classList.add('search-match');
      count++;
    } else {
      node.classList.remove('search-match');
    }
  });
  const counter = document.getElementById('search-count');
  if (counter) counter.innerText = query ? `${count} matches` : '';
};

// HELPER: Update nested object by path (e.g. "user.profile[0].name")
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

const renderDelta = (delta) => {
  let html = '<div class="delta-summary">';
  const process = (obj, path = '') => {
    for (let key in obj) {
      const val = obj[key];
      const fullPath = path ? `${path}.${key}` : key;
      if (Array.isArray(val)) {
        if (val.length === 1) { 
          html += `<div class="diff-line added">+ "${fullPath}": ${JSON.stringify(val[0])}</div>`;
        } else if (val.length === 3 && val[1] === 0 && val[2] === 0) { 
          html += `<div class="diff-line deleted">- "${fullPath}": ${JSON.stringify(val[0])}</div>`;
        } else if (val.length === 2) { 
          html += `<div class="diff-line modified">~ "${fullPath}": ${JSON.stringify(val[0])} → ${JSON.stringify(val[1])}</div>`;
        }
      } else if (typeof val === 'object' && val !== null) {
        process(val, fullPath);
      }
    }
  };
  process(delta);
  html += '</div>';
  return html;
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init();
} else {
  window.addEventListener('DOMContentLoaded', init);
}
