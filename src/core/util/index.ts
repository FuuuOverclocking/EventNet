import { fulfilledPromise, hasPromise } from './env';

export * from './env';

const ObjectProto = Object.prototype;

/**
 * No operation
 */
export function noop() { }

/**
 * Always return true
 */
export function returnTrue() {
  return true;
}

export function isUndef(something: any): something is undefined {
  return typeof something === 'undefined';
}

export function isObject(obj: any): obj is { [i: string]: any } {
  return obj !== null && typeof obj === 'object';
}

export function isPlainObject(obj: any): boolean {
  return ObjectProto.toString.call(obj) === '[object Object]';
}

/**
 * Object.prototype.hasOwnProperty
 */
export function hasOwn(obj: any, key: string): boolean {
  return ObjectProto.hasOwnProperty.call(obj, key);
}

/**
 * Check if value is primitive (string, number, symbol, boolean)
 */
export function isPrimitive(value: any): boolean {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'symbol' ||
    typeof value === 'boolean';
}

export function tryCatch(fn: (this: any, ...args: any[]) => any): any {
  try {
    return fn();
  } catch (e) {
    tryCatch.err = e;
  }
}

export namespace tryCatch {
  export let err = void 0 as any;
  export function getErr() {
    const e = err;
    err = void 0;
    return e;
  }
}

/**
 * Define a property on the object, non-numerable by default
 */
export function def(obj: any, key: string, value: any, enumerable: boolean = false) {
  Object.defineProperty(obj, key, {
    value,
    enumerable,
    writable: true,
    configurable: true,
  });
}

/**
 * Shallow copy all own enumerable props of `source` to `target`
 */
export function assign<T extends any, U extends any>(target: T, source: U): T & U {
  for (let keys = Object.keys(source), i = 0, l = keys.length; i < l; ++i) {
    target[keys[i]] = source[keys[i]];
  }
  return target as T & U;
}

// tslint:disable:max-line-length
export function multiAssign<T, U, V>(target: T, source1: U, source2: V): T & U & V;
export function multiAssign<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
export function multiAssign(target: object, ...sources: any[]): any;
// tslint:enable:max-line-length

/**
 * Shallow copy all own enumerable props of all `source` to `target`
 */
export function multiAssign(target: any): any {
  for (let i = 1, len = arguments.length; i < len; ++i) {
    const src = arguments[i];
    if (src === null || src === void 0) { continue; }
    for (let keys = Object.keys(src), j = 0, l = keys.length; j < l; ++j) {
      target[keys[i]] = src[keys[i]];
    }
  }
}

/**
 * execute `fn` in next moment
 * use Promise.then to achieve if possible, elsewise use setTimeout
 */
// tslint:disable:ban-types
export const nextMoment: (fn: Function) => void =
  hasPromise ?
    (fn: Function) => { fulfilledPromise!.then(fn as any); } :
    (fn: Function) => { setTimeout(fn, 0); };
// tslint:enable:ban-types

export function isValidArrayIndex(val: any): boolean {
  const n = parseFloat(String(val));
  return n >= 0 && Math.floor(n) === n && isFinite(val);
}

/**
 * Truncate a string that is too long
 */
export function truncate(str: string, maxLength: number = 40, replaceWith = '...') {
  return str.length > maxLength ? str.substr(0, maxLength) + replaceWith : str;
}

const bailRE = /[^\w.$]/;
export function parsePath(path: string): any {
  if (bailRE.test(path)) {
    return;
  }
  const segments = path.split('.');
  const len = segments.length;
  return (obj: any) => {

    for (let i = 0; i < len; ++i) {
      if (!obj) { return; }
      obj = obj[segments[i]];
    }
    return obj;
  };
}

/**
 * remove `item` from `arr`
 */
export function remove(arr: any[], item: any): any[] | void {
  if (arr.length) {
    const index = arr.indexOf(item);
    if (~index) {
      return arr.splice(index, 1);
    }
  }
}
