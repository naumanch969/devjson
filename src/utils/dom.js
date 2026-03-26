/**
 * Fast element creation helper.
 */
export const el = (tag, props = {}, children = []) => {
  const element = document.createElement(tag);
  
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on')) {
      element[key] = value;
    } else {
      element.setAttribute(key, value);
    }
  });

  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      element.appendChild(child);
    }
  });

  return element;
};
