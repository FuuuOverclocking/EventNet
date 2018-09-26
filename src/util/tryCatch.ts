import { errorObject } from './errorObject';

export function tryCatch(fn: (this: any, ...args: any[]) => any): any {
  try {
    return fn();
  } catch (e) {
    errorObject.e = e;
  }
}
