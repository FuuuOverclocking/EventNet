import { BasicNodeMode, BasicNodeOpt, ElementType, FullNodeCode, NodeAttr, NodeRunPhase } from '../../types';
import { handleNodeError } from '../debug';
import { Line } from '../line';
import { NodePort } from '../port';
import { assign, hasPromise, isObject, multiAssign, tryCatch } from '../util/index';
import { AttrRunCtx, Attrs } from './attr';
import { BasicNode, BasicNodeDws } from './basicNode';
import { QueueScheduler } from './queueScheduler';
import { defaultState, State } from './state';

export interface FullNode<T = any, stateType = any> {
  mode: BasicNodeMode | [BasicNodeMode, QueueScheduler | undefined];
  runSync(data?: any, opt?: BasicNodeOpt): T;
  queue(queue?: QueueScheduler): {
    run(data?: any, opt?: BasicNodeOpt): Promise<T>;
  };
  runMicro(data?: any, opt?: BasicNodeOpt): Promise<T>;
  runMacro(data?: any, opt?: BasicNodeOpt): Promise<T>;
  runAnimationFrame(data?: any, opt?: BasicNodeOpt): Promise<T>;
}

export class FullNode<T = any, stateType = any> extends BasicNode<T> {
  public readonly type = ElementType.FullNode;

  public readonly ups: NodePort = new NodePort(this);
  public readonly dws: NodePort = new NodePort(this);


  public state: State & stateType & typeof defaultState;
  public stateGetter: null | (() => stateType) = null;


  public attrs: Attrs;

  public readonly code: FullNodeCode<
    T,
    stateType & typeof defaultState,
    FullNode<T, stateType>
    >;
  protected readonly codeDws = new BasicNodeDws(this.dws);

  constructor(
    options:
      { $state: stateType; [i: string]: any; }
      | { $state: (() => stateType); [i: string]: any; }
      | stateType,
    code: FullNodeCode<T, stateType & typeof defaultState, FullNode<T, stateType>>
  ) {
    super();

    this.code = code;

    const {
      $mode = BasicNodeMode.sync,
      store = {},
      $attrs,
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

    this.attrs = new Attrs($attrs);

    this.preconnect();
  }

  /**
   * Clone a existing FullNode
   * can be faster than creating by constructor.
   */
  public clone(): FullNode<T, stateType> {
    let nd = Object.create(FullNode.prototype);
    nd = BasicNode.call(nd) || nd;
    nd.type = ElementType.FullNode;
    nd.ups = new NodePort(nd);
    nd.dws = new NodePort(nd);
    nd.stateGetter = this.stateGetter;
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

    const attrs = Object.create(Attrs.prototype) as Attrs;
    attrs.value = assign({}, this.attrs.value);
    attrs.sequence = this.attrs.sequence.slice();
    this.attrs = attrs;

    return nd;
  }

  public generateIdentity(): { [field: string]: any } {
    return assign(super.generateIdentity(), { type: 'FullNode' });
  }

  protected _run(data: any, opt: BasicNodeOpt): T {

    ++this.state.runningTimes;

    ++this.state.running;

    const codeDws = opt.runStack ?
      new BasicNodeDws(this.dws, opt.runStack) :
      this.codeDws;

    const ctx: AttrRunCtx = {
      data,
      returnVal: void 0,
      state: this.state,
      node: this,
      attrValue: this.attrs.value,
    };
    this.attrs.onrun(ctx, () => {
      ctx.returnVal = this.code({
        dws: codeDws,
        ups: {},
        data,
        origin: this,
        state: this.state,
        store: this.state.store,
      });
    }, (err: any, index: number) => {
      this.handleError({
        phase: index === -1 ? NodeRunPhase.code : NodeRunPhase.attr,
        index,
      }, err);
    });

    if (ctx.returnVal instanceof Promise) {
      return ctx.returnVal.then(() => {
        --this.state.running;
      }) as any;
    }
    --this.state.running;
    return ctx.returnVal;
  }
}
