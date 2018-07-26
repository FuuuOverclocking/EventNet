import { def } from "../util";

const arrayProto = Array.prototype as any;
export const arrayMethods = Object.create(arrayProto);

export const methodsToPatch = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

methodsToPatch.forEach((method: string) => {
  const original = arrayProto[method];

  def(arrayMethods, method, function(this: any, ...args: any[]) {
    const result = original.apply(this, args);
    const ob = this.__ob__;
    let inserted: any[] | void;
    switch (method) {
      case "push":
      case "unshift":
        inserted = args;
        break;
      case "splice":
        inserted = args.slice(2);
        break;
    }
    if (inserted) {
      ob.observeArray(inserted);
    }
    ob.dep.notify();
    return result;
  });
});
