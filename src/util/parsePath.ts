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
