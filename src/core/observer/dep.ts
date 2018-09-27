
import { remove } from '../../util/remove';
import { Watcher } from './watcher';

let uid = 0;

export default class Dep {
  public static target: Watcher | null = null;

  public id: number;
  public subs: Watcher[];

  constructor() {
    this.id = ++uid;
    this.subs = [];
  }

  public addSub(sub: Watcher) {
    this.subs.push(sub);
  }

  public removeSub(sub: Watcher) {
    remove(this.subs, sub);
  }

  public depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }
  public notify() {
    // stabilize the subscriber list first
    const subs = this.subs.slice();
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }
}
