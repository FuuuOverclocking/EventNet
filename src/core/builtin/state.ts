import { WatchableObject } from '../../types';
import { Observer } from '../observer/index';
import { Watcher } from '../observer/watcher';
import { def, remove } from '../util/index';

// The default state.
// The states of Node created by calling nn() is the result
// of assigning parameter `states` to the default state.
export const defaultState = {
  // `store` is a special key who won't be observed,
  // which means its value won't be reactive.
  store: {} as { [i: string]: any },

  // record how many times the node has run
  runningTimes: 0,

  // how many node now is running
  running: 0,
};

export class State implements WatchableObject {
  public static toReactive(state: State, except?: string) {
    def(this, 'watchers', []);
    new Observer(state, except);
  }
}

export interface State {
  watchMe(
    expOrFn: string | ((this: any, target: any) => any),
    callback: (newVal: any, oldVal: any) => void,
    options?: {
      deep?: boolean,
      sync?: boolean,
      immediate?: boolean,
    }
  ): () => void;
  watchers: Watcher[];
}

def(State.prototype, 'watchMe',
  function(
    this: State,
    expOrFn: string | ((this: any, target: any) => any),
    callback: (newVal: any, oldVal: any) => void,
    options?: {
      deep?: boolean,
      sync?: boolean,
      immediate?: boolean,
    }
  ): () => void {
    let watcher = new Watcher(
      this,
      expOrFn,
      callback,
      options);
    this.watchers.push(watcher);

    if (options && options.immediate) {
      const value = watcher.getter.call(this, this);
      callback.call(this, value, value);
    }

    return () => {
      if (!watcher) { return; }
      remove(this.watchers, watcher);
      watcher.teardown();
      watcher = null as any;
    };
  });
