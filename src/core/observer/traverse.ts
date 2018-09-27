import { isObject } from 'util';

let seenObjects = {};

export function traverse(val: any) {
  _traverse(val, seenObjects);
  seenObjects = {};
}

/**
 * One known problem is, if the val is a inextensible object and is in a reference ring,
 * then the function may immersed in a infinite recursion.
 */
function _traverse(val: any, seen: any) {
  let i;
  let keys;
  const isA = Array.isArray(val);
  if ((!isA && !isObject(val)) || Object.isFrozen(val)) {
    return;
  }
  if (val.__ob__) {
    const depId = val.__ob__.dep.id;
    if (seen[depId]) {
      return;
    }
    seen[depId] = true;
  }
  if (isA) {
    i = val.length;
    while (i--) { _traverse(val[i], seen); }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) { _traverse(val[keys[i]], seen); }
  }
}
