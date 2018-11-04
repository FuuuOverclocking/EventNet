import { BasicNodeMode, BasicNodeOpt, ComNodeCode, ElementType, FullNodeCode, NodeAttr, NodeRunPhase } from '../../types';
import { handleNodeError } from '../debug';
import { Line } from '../line';
import { NodePort } from '../port';
import { assign, hasPromise, isObject, multiAssign, tryCatch } from '../util/index';
import { AttrRunCtx, Attrs } from './attr';
import { BasicNode, BasicNodeDws } from './basicNode';
import { QueueScheduler } from './queueScheduler';
import { defaultState, State } from './state';

export interface ComNode<T = any, stateType = any> {
  mode: BasicNodeMode | [BasicNodeMode, QueueScheduler | undefined];
  runSync(data?: any, opt?: BasicNodeOpt): T;
  queue(queue?: QueueScheduler): {
    run(data?: any, opt?: BasicNodeOpt): Promise<T>;
  };
  runMicro(data?: any, opt?: BasicNodeOpt): Promise<T>;
  runMacro(data?: any, opt?: BasicNodeOpt): Promise<T>;
  runAnimationFrame(data?: any, opt?: BasicNodeOpt): Promise<T>;
}

export class ComNode<T = any> extends BasicNode<T> {
  public readonly type = ElementType.ComNode;

  public readonly ups: NodePort = new NodePort(this);
  public readonly dws: NodePort = new NodePort(this);


  public attrs: Attrs;

  public readonly code: ComNodeCode<
    T,
    ComNode<T>
    >;
  protected readonly codeDws = new BasicNodeDws(this.dws);

  constructor(
    options: { [i: string]: any; },
    code: ComNodeCode<T, ComNode<T>>
  ) {
    super();

    this.code = code;

    const {
      $mode = BasicNodeMode.sync,
      $attrs,
    } = options as any;

    this.mode = $mode;
    this.attrs = new Attrs($attrs);

    this.preconnect();
  }

  /**
   * Clone a existing FullNode
   * can be faster than creating by constructor.
   */
  public clone(): ComNode<T> {
    let nd = Object.create(ComNode.prototype);
    nd = BasicNode.call(nd) || nd;
    nd.type = ElementType.FullNode;
    nd.ups = new NodePort(nd);
    nd.dws = new NodePort(nd);
    nd.codeDws = new BasicNodeDws(nd.dws);
    nd.code = this.code;
    nd.mode = this.mode;

    const attrs = Object.create(Attrs.prototype) as Attrs;
    attrs.value = assign({}, this.attrs.value);
    attrs.sequence = this.attrs.sequence.slice();
    this.attrs = attrs;

    return nd;
  }

  public generateIdentity(): { [field: string]: any } {
    return assign(super.generateIdentity(), { type: 'ComNode' });
  }

  protected _run(data: any, opt: BasicNodeOpt): T {
    const codeDws = opt.runStack ?
      new BasicNodeDws(this.dws, opt.runStack) :
      this.codeDws;

    const ctx: AttrRunCtx = {
      data,
      returnVal: void 0,
      node: this,
      attrValue: this.attrs.value,
    };
    this.attrs.onrun(ctx, () => {
      ctx.returnVal = this.code({
        dws: codeDws,
        ups: {},
        data,
        origin: this,
      });
    }, (err: any, index: number) => {
      this.handleError({
        phase: index === -1 ? NodeRunPhase.code : NodeRunPhase.attr,
        index,
      }, err);
    });

    return ctx.returnVal;
  }
}
