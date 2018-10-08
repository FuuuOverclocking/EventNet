import { hasPromise } from '../util/env';

export class QueueScheduler {
  public active = false;
  public actions: Array<(this: null) => void> = [];
  public schedule(fn: (this: null) => void) {
    this.actions.push(fn);
    if (this.active) {
      return;
    }
    this.flush();
  }
  public flush() {
    this.active = true;

    let fn: (this: null) => void;
    let result: any;
    while (fn = this.actions.shift() as any) {
      result = fn.call(null);
      if (hasPromise && result instanceof Promise) {
        result.then(() => this.flush());
        return;
      }
    }

    this.active = false;
  }
}

export const defaultQueue = new QueueScheduler();
