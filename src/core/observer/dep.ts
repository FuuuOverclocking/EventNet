import { remove } from "../util";
import { Watcher } from "./watcher";

let uid = 0;

export default class Dep {
  public id: number;
  public subs: Watcher[];

  constructor() {
    this.id = uid++;
    this.subs = [];
  }

  public addSub(sub: Watcher) {
    this.subs.push(sub);
  }

  public removeSub(sub: Watcher) {
    remove(this.subs, sub);
  }

  public notify() {
    // stabilize the subscriber list first
    const subs = this.subs.slice();
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update();
    }
  }
}
