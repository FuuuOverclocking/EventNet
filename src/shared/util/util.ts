export function noop() { }

export function isElement(elem: any) {
  return isObject(elem) && elem._isEN;
}

export function def(obj: any, key: string, value: any, enumerable: boolean = false) {
  Object.defineProperty(obj, key, {
    value,
    enumerable,
    writable: true,
    configurable: true,
  });
}

export function isObject(obj: any) {
  return obj !== null && typeof obj === "object";
}

export function hasOwn(obj: any, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function isPlainObject(obj: any): boolean {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

export function remove(arr: any[], item: any): any[] | void {
  if (arr.length) {
    const index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1);
    }
  }
}

const bailRE = /[^\w.$]/;
export function parsePath(path: string): any {
  if (bailRE.test(path)) {
    return;
  }
  const segments = path.split(".");
  return (obj: any) => {
    for (const segment of segments) {
      if (!obj) { return; }
      obj = obj[segment];
    }
    return obj;
  };
}

export function isNative(ctor: any): boolean {
  return typeof ctor === "function" && /native code/.test(ctor.toString());
}
