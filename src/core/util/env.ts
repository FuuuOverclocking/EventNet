export const hasProto = { __proto__: [] } instanceof Array;
export const hasPromise =
  typeof Promise === 'function' &&
  typeof Promise.resolve === 'function' &&
  typeof Promise.prototype.then === 'function';
export const fulfilledPromise = hasPromise ? Promise.resolve() : null;

export const setProto: false | ((target: any, source: any) => void) =
  (Object as any).setPrototypeOf ||
  hasProto && ((d: any, b: any) => { d.__proto__ = b; });
