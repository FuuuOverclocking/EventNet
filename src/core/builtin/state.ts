import { WatchableObject } from '../../types';
import { def } from '../../util/defineProperty';
import { remove } from '../../util/remove';
import { Observer } from '../observer/index';
import { Watcher } from '../observer/watcher';

export class State implements WatchableObject {
  public static toReactive(state: State, except?: string) {
    new Observer(state, except);
  }
}
export interface State {
  watchMe: {
    (
      expOrFn: string | ((this: any, target: any) => any),
      callback: (newVal: any, oldVal: any) => void,
      options?: {
        deep?: boolean,
        sync?: boolean,
        immediate?: boolean,
      },
    ): () => void;
    watchers?: Watcher[];
  };
}
def(State.prototype, 'watchMe',
  function(this: State /* , ...args */): () => void {

    this.watchMe = function(
      this: State,
      eOrF: string | ((this: any, target: any) => any),
      cb: (newVal: any, oldVal: any) => void,
      opt?: {
        deep?: boolean,
        sync?: boolean,
        immediate?: boolean,
      },
    ) {
      let watcher = new Watcher(
        this,
        eOrF,
        cb,
        opt);
      this.watchMe.watchers!.push(watcher);

      if (opt && opt.immediate) {
        const value = watcher.getter.call(this, this);
        cb.call(this, value, value);
      }

      return () => {
        if (!watcher) { return; }
        remove(this.watchMe.watchers!, watcher);
        watcher.teardown();
        watcher = null as any;
      };
    } as any;

    this.watchMe.watchers = [] as Watcher[];

    return this.watchMe.apply(this, arguments);
  });

