import { IDictionary } from '../types';
import { handleError, isObject, parsePath } from '../util';
import Dep from './dep';
import { queueWatcher } from './scheduler';
import { traverse } from './traverse';

let uid = 0;

export class Watcher {
  public id: number;
  public value: any;
  public target: any;
  public getter: (target: any) => any;
  public callback: (newVal: any, oldVal: any) => void;

  public active = true;
  public deps: Dep[] = [];
  public depIds = new Set<number>();
  public newDeps: Dep[] = [];
  public newDepIds = new Set<number>();

  public deep: boolean;
  public sync: boolean;
  constructor(
    target: any,
    expOrFn: string | ((this: IDictionary, state: IDictionary) => any),
    callback: (newVal: any, oldVal: any) => void,
    {
      deep = false,
      sync = false,
    },
  ) {
    this.deep = deep;
    this.sync = sync;
    this.id = uid++;
    this.target = target;
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn);
      if (!this.getter) {
        this.getter = () => { };
        process.env.NODE_ENV !== 'production' && handleError(
          new Error(`Failed watching path: "${expOrFn}" ` +
            'Watcher only accepts simple dot-delimited paths. ' +
            'For full control, use a function instead.'),
          'WatcherConstructor',
        );
      }
    }
    this.callback = callback;
    this.value = this.get();
  }

  public addDep(dep: Dep) {
    const id = dep.id;
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id);
      this.newDeps.push(dep);
      if (!this.depIds.has(id)) {
        dep.addSub(this);
      }
    }
  }

  public cleanupDeps() {
    let i = this.deps.length;
    while (i--) {
      const dep = this.deps[i];
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this);
      }
    }
    const tmpIds = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmpIds;
    this.newDepIds.clear();

    const tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  }

  public get() {
    Dep.target = this;

    let value: any;
    const obj = this.target;
    try {
      value = this.getter.call(obj, obj);
    } catch (e) {
      handleError(e, 'Watcher.getter');
    } finally {
      if (this.deep) {
        traverse(value);
      }
      Dep.target = null;
      this.cleanupDeps();
    }
    return value;
  }

  public teardown() {
    if (this.active) {
      let i = this.deps.length;
      while (i--) {
        this.deps[i].removeSub(this);
      }
      this.active = false;
    }
  }

  public update() {
    if (this.sync) {
      this.run();
    } else {
      queueWatcher(this);
    }
  }
  public run() {
    if (this.active) {
      this.getAndInvoke(this.callback);
    }
  }
  public getAndInvoke(cb: (newVal: any, oldVal: any) => void) {
    const value = this.get();
    if (value !== this.value || isObject(value) || this.deep) {
      const oldVal = this.value;
      this.value = value;
      if (process.env.NODE_ENV !== 'production') {
        try {
          cb.call(this.target, value, oldVal);
        } catch (e) {
          handleError(e, 'Watcher.callback');
        }
      } else {
        cb.call(this.target, value, oldVal);
      }
    }
  }
}
