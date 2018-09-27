import { nextMoment } from '../../util/nextMoment';
import { Watcher } from './watcher';

const queue: Watcher[] = [];
let has: { [key: number]: true | null } = {};
let willFlush = false;
let flushing = false;
let index = 0;

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState() {
  index = queue.length = 0;
  has = {};
  willFlush = flushing = false;
}

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue() {
  flushing = true;
  let watcher;

  queue.sort((a, b) => a.id - b.id);

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; ++index) {
    watcher = queue[index];
    has[watcher.id] = null;
    watcher.run();
  }

  resetSchedulerState();
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher(watcher: Watcher) {
  const id = watcher.id;
  if (has[id] == null) {
    has[id] = true;
    if (!flushing) {
      queue.push(watcher);
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) {
        --i;
      }
      queue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    if (!willFlush) {
      willFlush = true;
      nextMoment(flushSchedulerQueue);
    }
  }
}
