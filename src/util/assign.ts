export function assign<T extends any, U extends any>(target: T, source: U): T & U {
  for (let keys = Object.keys(source), i = keys.length - 1; i >= 0; --i) {
    target[keys[i]] = source[keys[i]];
  }
  return target as T & U;
}

// tslint:disable:max-line-length
export function multiAssign<T, U, V>(target: T, source1: U, source2: V): T & U & V;
export function multiAssign<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
export function multiAssign(target: object, ...sources: any[]): any;
// tslint:enable:max-line-length
export function multiAssign(target: any): any {
  for (let i = 1, len = arguments.length; i < len; ++i) {
    const src = arguments[i];
    if (src === null || src === void 0) { continue; }
    for (let keys = Object.keys(src), j = keys.length - 1; j >= 0; --j) {
      target[keys[i]] = src[keys[i]];
    }
  }
}
