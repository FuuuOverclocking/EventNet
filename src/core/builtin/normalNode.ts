import { BasicNodeMode, ElementType, NodeAttr, NodeRunPhase, NormalNodeCode} from '../../types';
import { assign, multiAssign } from '../../util/assign';
import { errorObject } from '../../util/errorObject';
import { isObject } from '../../util/isObject';
import { tryCatch } from '../../util/tryCatch';
import { hasPromise } from '../debug';
import { Line } from '../line';
import { Observer } from '../observer';
import { NodeStream } from '../stream';
import { Attrs } from './attr';
import { BasicNode, BasicNodeDws } from './basicNode';
import { QueueScheduler } from './queueScheduler';
import { State } from './state';

// The default state of each new NormalNode.
// The states of Node created by calling nn() is the result
// of assigning parameter `states` to the default state.
const defaultState = {
  // `store` is a special key who won't be observed,
  // which means its value won't be reactive.
  store: {} as { [i: string]: any },

  // record how many times the node has run
  runningTimes: 0,

  // how many node now is running
  running: 0,
};

export interface NormalNode<T = any, stateType = any> {
  mode: BasicNodeMode | [BasicNodeMode, QueueScheduler | undefined];
  runSync(data?: any, caller?: Line): T;
  queue(queue?: QueueScheduler): {
    run(data?: any, caller?: Line): Promise<T>;
  };
  runMicro(data?: any, caller?: Line): Promise<T>;
  runMacro(data?: any, caller?: Line): Promise<T>;
  runAnimationFrame(data?: any, caller?: Line): Promise<T>;
  noret(): {
    queue(queue?: QueueScheduler): {
      run(data?: any, caller?: Line): void;
    };
    runMacro(data?: any, caller?: Line): void;
    runAnimationFrame(data?: any, caller?: Line): void;
  };
}

export class NormalNode<T = any, stateType = any> extends BasicNode<T> {
  public readonly type = ElementType.NormalNode;

  public readonly ups: NodeStream = new NodeStream(this);
  public readonly dws: NodeStream = new NodeStream(this);


  public state: State & stateType & typeof defaultState;
  public stateGetter: null | (() => stateType) = null;


  protected _attrs = new Attrs();

  /**
   * Get a shallow copy of the node's own `attrs`.
   */
  public attrs() {
    return assign({}, this._attrs.own);
  }
  public setAttrs(attrs: { [i: string]: any | NodeAttr }) {
    this._attrs.setOwn(attrs);
  }

  /**
   * Get a shallow copy of the node's all `attrs`,
   * including its own and inherited.
   */
  public allAttrs() {
    return assign({}, this._attrs.all);
  }

  public readonly code: NormalNodeCode<
    T,
    stateType & typeof defaultState,
    NormalNode<T, stateType>
    >;
  protected readonly codeDws = new BasicNodeDws(this.dws);

  constructor(
    options:
      { $state: stateType; [i: string]: any; }
      | { $state: (() => stateType); [i: string]: any; }
      | stateType,
    code: NormalNodeCode<T, stateType & typeof defaultState, NormalNode<T, stateType>>,
  ) {
    super();

    this.code = code;

    const {
      $mode = BasicNodeMode.sync,
      store = {},
      $attrs = {},
    } = options as any;

    let state: { [key: string]: any };
    if (isObject((options as any).$state)) {
      state = (options as any).$state;
    } else if (typeof (options as any).$state === 'function') {
      this.stateGetter = (options as any).$state;
      state = (options as any).$state();
    } else {
      state = options;

      // Should not use `delete` for V8 optimization?
      // `state` is originally stored in hash table anyway.
      delete state.$mode;
      delete state.$attrs;
    }
    state.store || (state.store = store);

    this.mode = $mode;

    this.state = new State() as any;
    multiAssign(this.state, defaultState, state);
    State.toReactive(this.state, 'store');

    this._attrs.setOwn($attrs);
    this._attrs.toSort();

    this.preconnect();
  }

  /**
   * Clone a existing NormalNode
   * can be faster than creating by constructor.
   */
  public clone(): NormalNode<T, stateType> {
    let nd = Object.create(NormalNode.prototype);
    nd = BasicNode.call(nd) || nd;
    nd.type = ElementType.NormalNode;
    nd.ups = new NodeStream(nd);
    nd.dws = new NodeStream(nd);
    nd.stateGetter = this.stateGetter;
    nd._attrs = new Attrs();
    nd.codeDws = new BasicNodeDws(nd.dws);
    nd.code = this.code;
    nd.mode = this.mode;

    let state: any;
    if (this.stateGetter) {
      state = this.stateGetter();
    } else {
      state = assign({}, this.state);
      state.store = assign({}, this.state.store);
    }
    nd.state = new State() as any;
    multiAssign(nd.state, defaultState, state);
    State.toReactive(this.state, 'store');

    const attrs = this._attrs;
    assign(nd._attrs.own, attrs.own);
    assign(nd._attrs.all, attrs.own);

    if (Object.keys(attrs.inherited).length === 0
      && !attrs.willSort) {
      nd._attrs.beforeSeq = attrs.beforeSeq.slice();
      nd._attrs.afterSeq = attrs.afterSeq.slice();
    } else {
      nd._attrs.toSort();
    }
    return nd;
  }

  public generateIdentity(): { [field: string]: any } {
    return assign(super.generateIdentity(), { type: 'NormalNode' });
  }

  protected _run(data?: any, caller?: Line): T {
    this._attrs.sort();

    ++this.state.runningTimes;

    let phase: NodeRunPhase = NodeRunPhase.before;

    ++this.state.running;

    let shouldShut = false;

    const beforeSeq = this._attrs.beforeSeq;
    let i = beforeSeq.length;
    if (i) {
      const condition = {
        data,
        attrs: this._attrs.all,
        state: this.state,
        node: this,
        shut: (error?: any) => {
          shouldShut = true;
          if (phase === NodeRunPhase.before) {
            phase = NodeRunPhase.over;
            --this.state.running;
          }
          if (typeof error !== 'undefined') {
            this.errorHandler(NodeRunPhase.before, error);
          }
        },
      };
      while (--i) {
        beforeSeq[i][0](
          beforeSeq[i][1],
          condition,
        );
        if (shouldShut) {
          return void 0 as any;
        }
      }
      data = condition.data;
    }

    phase = NodeRunPhase.code;

    const result = tryCatch(this.code.bind(this, {
      dws: this.codeDws,
      ups: {},
      data,
      origin: this,
      state: this.state,
      store: this.state.store,
    })) as T;

    const afterSeqLen = this._attrs.afterSeq.length;

    if (hasPromise && result instanceof Promise) {
      return result
        .then(
          (theResult: any) =>
            afterSeqLen ?
              this._runAfter(theResult) :
              (--this.state.running, theResult),

          e => {
            --this.state.running;
            this.errorHandler(NodeRunPhase.code, e);
          }) as any;
    }

    if (errorObject.e) {
      --this.state.running;
      const e = errorObject.e;
      errorObject.e = void 0;
      this.errorHandler(NodeRunPhase.code, e);
      return void 0 as any;
    }

    return afterSeqLen ?
      this._runAfter(result) :
      --this.state.running, result;
  }
  protected _runAfter(result: any): any {
    let shouldShut = false;
    let phase = NodeRunPhase.after;
    const afterSeq = this._attrs.afterSeq;
    let i = afterSeq.length;
    const condition = {
      data: result,
      attrs: this._attrs.all,
      state: this.state,
      node: this,
      shut: (error?: any) => {
        shouldShut = true;
        if (phase === NodeRunPhase.after) {
          phase = NodeRunPhase.over;
          --this.state.running;
        }
        if (typeof error !== 'undefined') {
          this.errorHandler(NodeRunPhase.before, error);
        }
      },
    };
    while (--i) {
      afterSeq[i][0](
        afterSeq[i][1],
        condition,
      );
      if (shouldShut) {
        return void 0 as any;
      }
    }
    phase = NodeRunPhase.over;
    --this.state.running;
    return condition.data;
  }
}
