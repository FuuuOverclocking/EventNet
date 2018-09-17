export function assign<T extends any, U extends any>(target: T, source: U): T & U {
  Object.keys(source).forEach(key => {
    target[key] = source[key];
  });
  return target as T & U;
}

// tslint:disable:max-line-length
export function multiAssign<T, U, V>(target: T, source1: U, source2: V): T & U & V;
export function multiAssign<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
export function multiAssign(target: object, ...sources: any[]): any;
// tslint:enable:max-line-length
export function multiAssign(target: any): any {
  for (let i = 1; i < arguments.length; ++i) {
    const src = arguments[i];
    if (src === null || src === void 0) { continue; }
    Object.keys(src).forEach(key => {
      target[key] = src[key];
    });
  }
}
