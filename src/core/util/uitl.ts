
export function def(obj: any, key: string, value: any, enumerable: boolean = false) {
  Object.defineProperty(obj, key, {
    value,
    enumerable,
    writable: true,
    configurable: true,
  });
}

export function protoAugment(target: any, src: any) {
  target.__proto__ = src;
}

export function copyAugment(target: any, src: any, keys: string[]) {
  for (const key of keys) {
    def(target, key, src[key]);
  }
}

const bailRE = /[^\w.$]/;
export function parsePath(path: string): any {
  if (bailRE.test(path)) {
    return;
  }
  const segments = path.split('.');
  return (obj: any) => {
    for (const segment of segments) {
      if (!obj) { return; }
      obj = obj[segment];
    }
    return obj;
  };
}
