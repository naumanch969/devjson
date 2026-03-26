import { diff as jsondiff } from 'jsondiffpatch';

/**
 * Computes the structural diff between two parsed objects.
 */
export const computeDiff = (base, target) => {
  const delta = jsondiff(base, target);
  return {
    base,
    target,
    delta,
    hasChanges: delta !== undefined
  };
};
