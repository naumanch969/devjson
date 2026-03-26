import { diff as jsondiff } from 'jsondiffpatch';

/**
 * Computes the structural diff between two parsed objects.
 */
export const computeDiff = (base, target) => {
  const delta = jsondiff(base, target);
  
  const stats = { added: 0, deleted: 0 };
  
  const countChanges = (d) => {
    if (!d) return;
    if (Array.isArray(d)) {
      if (d.length === 1) { // Added
        stats.added++;
      } else if (d.length === 3 && d[1] === 0 && d[2] === 0) { // Deleted
        stats.deleted++;
      } else if (d.length === 2) { // Modified
        stats.added++;
        stats.deleted++;
      }
    } else if (typeof d === 'object') {
      Object.keys(d).forEach(k => {
        if (k !== '_t') countChanges(d[k]);
      });
    }
  };
  
  countChanges(delta);

  return {
    base,
    target,
    delta,
    stats,
    hasChanges: delta !== undefined
  };
};

