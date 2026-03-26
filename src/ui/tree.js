import { el } from '../utils/dom';
import { showToast } from '../utils/toast';

/**
 * Renders a data node recursively and adds interactive editing capabilities.
 * @param {any} value The value to render.
 * @param {string} key Optional key.
 * @param {number} level Recursion depth.
 * @param {string} path Dot-separated path to this node.
 * @param {Function} onChange Callback for when values change.
 */
export const renderNode = (value, key = null, level = 0, path = '', onChange = null) => {
  const type = getValueType(value);
  const container = el('div', { className: `node ${type}-node level-${level}` });
  container.dataset.path = path;

  const isExpandable = !isPrimitive(value);

  if (isExpandable) {
    const toggle = document.createElement('span');
    toggle.className = 'toggle expanded';
    toggle.innerText = '▼';
    toggle.onclick = (e) => {
      e.stopPropagation();
      const content = container.querySelector('.node-content');
      if (content) {
        const isExpanded = content.style.display !== 'none';
        content.style.display = isExpanded ? 'none' : 'block';
        toggle.innerText = isExpanded ? '▶' : '▼';
        toggle.className = isExpanded ? 'toggle' : 'toggle expanded';
      }
    };
    container.appendChild(toggle);
  }

  // KEY
  if (key !== null) {
    const keySpan = document.createElement('span');
    keySpan.className = 'syn-key';
    keySpan.innerText = `"${key}": `;
    
    // Add Copy Path functionality
    keySpan.oncontextmenu = (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(path);
      showToast(`Path copied: ${path}`);
    };
    
    container.appendChild(keySpan);
  }

  // VALUE
  if (isPrimitive(value)) {
    const valSpan = document.createElement('span');
    valSpan.className = `syn-${type}`;
    valSpan.innerText = formatPrimitive(value, type);
    
    // Make values editable if onChange is provided
    if (onChange) {
      valSpan.contentEditable = "true";
      valSpan.spellcheck = false;
      valSpan.onblur = () => {
        let newValText = valSpan.innerText.trim();
        // Remove surrounding quotes if it's a string
        if (type === 'string' && newValText.startsWith('"') && newValText.endsWith('"')) {
          newValText = newValText.slice(1, -1);
        }
        
        // Try to cast back to original type
        let newVal = newValText;
        if (type === 'number') newVal = Number(newValText);
        if (type === 'boolean') newVal = newValText === 'true';
        if (type === 'null') newVal = null;

        onChange(path, newVal);
      };

      // Handle Enter to blur
      valSpan.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          valSpan.blur();
        }
      };
    }

    valSpan.oncontextmenu = (e) => {
      e.preventDefault();
      navigator.clipboard.writeText(JSON.stringify(value));
      showToast('Value Copied');
    };
    
    container.appendChild(valSpan);
  } else {
    // OBJECT / ARRAY
    const isArray = Array.isArray(value);
    const opener = isArray ? '[' : '{';
    const closer = isArray ? ']' : '}';
    const entries = Object.entries(value);
    const count = entries.length;

    container.appendChild(el('span', { className: 'bracket' }, [opener]));
    
    if (count > 0) {
      const content = el('div', { className: 'node-content' });
      entries.forEach(([k, v], i) => {
        const itemPath = isArray 
          ? (path ? `${path}[${k}]` : `${k}`) 
          : (path ? `${path}.${k}` : k);
          
        const item = renderNode(v, isArray ? null : k, level + 1, itemPath, onChange);
        if (i < count - 1) item.appendChild(el('span', { className: 'comma' }, [',']));
        content.appendChild(item);
      });
      container.appendChild(content);
    }

    container.appendChild(el('span', { className: 'bracket' }, [closer]));
  }

  return container;
};

const getValueType = (value) => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const type = typeof value;
  if (type === 'object') return 'object';
  return type;
};

const isPrimitive = (value) => {
  const type = getValueType(value);
  return type !== 'object' && type !== 'array';
};

const formatPrimitive = (value, type) => {
  if (type === 'string') return `"${value}"`;
  return String(value);
};
