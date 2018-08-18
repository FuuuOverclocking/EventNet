import { warn } from '../shared/util/debug';
import { Element } from './element';
import { linesWaitingLink, NodeMethods } from './node-methods';
import { NodeStream } from './stream';
import {
  ElementType, ICallableElementLike, IDictionary,
  IElementLike,
  ILineLike,
  INodeCodeDWS, INodeLike, INormalNodeCode, IRawNodeCode, IStreamOfNode, NodeRunningStage,
} from './types';
import {
  applyMixins, def, handleError,
  isTwpipe,
  isValidArrayIndex,
} from './util';
import { weld } from './weld';

/**
 * The ancestor of all the nodes.
 * Add methods to its prototype when need to patch.
 */
export abstract class Node extends Element implements INodeLike {
  public parent: INodeLike | undefined = void 0;
  public abstract readonly type: number;
  public abstract readonly upstream: IStreamOfNode;
  public abstract readonly downstream: IStreamOfNode;

  public _errorHandler(when: NodeRunningStage, what?: any, where?: IElementLike[]) {
    const er = this.downstream.get().filter(line => {
      if (!line || !line.classes) { return false; }
      return ~line.classes.indexOf('error');
    }) as ILineLike[];

    if (er.length) {
      er.forEach(line => line.run({ when, what, where }, this));
    } else if (this.parent) {
      where = where || [];
      where.push(this);
      this.parent._errorHandler(NodeRunningStage.child, what, where);
    } else {
      handleError(what, `Node running stage '${NodeRunningStage[when]}'`, this);
    }
  }
}

export abstract class BasicNode extends Node {

  public abstract readonly type: ElementType;

  public readonly upstream: NodeStream = new NodeStream(this);
  public readonly downstream: NodeStream = new NodeStream(this, toCallableDws, new NodeCodeDws());

  public readonly ondestory:
    Array<(this: BasicNode, node: BasicNode) => void> = [];
  /**
   * Destory the Node
   * execute all the functions in the array `ondestory`, then
   * 1. release the resources it using
   * 2. (if is stateful element)
   *    this.state = null
   * 3. (if is watch-able element)
   *    clear this._watchers by using this._watchers.teardown()
   * 4. (if has upstream)
   *    delete from its upstream, check if the upstream is isolate ? The upstream has destroy ? Destroy()
   * 5. (if has downstream) the same with what mentioned above
   */
  public abstract destory(): void;

  public abstract run(data?: any, caller?: ILineLike): any | Promise<any>;
  public readonly code: IRawNodeCode | INormalNodeCode;
  constructor(code: IRawNodeCode | INormalNodeCode) {
    super();

    def(this.downstream.wrappedElements, 'origin', this.downstream);

    this.code = code;

    // all types of Node with upstream(s), should contain the following lines in its constructor
    for (const line of linesWaitingLink) {
      weld(this.upstream, line.downstream);
      if (isTwpipe(line.type)) {
        weld(this.downstream, line.downstream);
      }
    }
    linesWaitingLink.length = 0;
    // all types of Node with upstream(s), should contain the lines abov in its constructor
  }

  public abstract clone(): BasicNode;

  /**
   * Return a function that firstly clone the node then run it with the given data when called
   * the function has a static property `origin` which pointed at this original node
   * @returns {ICallableElementLike}
   */
  public toIndepFunc(): ICallableElementLike {
    const fn = ((data?: any) => {
      const clonedNode = this.clone();
      return clonedNode.run(data);
    }) as ICallableElementLike;
    fn.origin = this;
    return fn;
  }

}

// mixin methods
export interface Node extends NodeMethods { }
applyMixins(Node, [NodeMethods]);

function toCallableDws(this: NodeStream, line: ILineLike) {
  const fn = ((data?: any) => {
    line.run(data, this.owner);
  }) as ICallableElementLike;
  fn.origin = line;
  return fn;
}

class NodeCodeDws extends Array<ICallableElementLike | undefined> implements INodeCodeDWS {
  public origin: NodeStream;
  public all(data?: any) {
    this.forEach(dws => dws && dws(data));
  }
  public id(id: string) {
    const dws = this.origin.getById(id);
    if (!dws) {
      if (process.env.NODE_ENV !== 'production') {
        warn(`Node.codeParamDws.id: There is no downstream with ID '${id}'.`,
          this.origin.owner);
      }
      return;
    }

    const res = (data => {
      dws.run(data, this.origin.owner);
    }) as ICallableElementLike;
    res.origin = dws;
    return res;
  }
  public ask(askFor: string | string[] | ((line: ILineLike) => boolean), data?: any) {
    const dws = this.origin.ask(askFor as any);
    const res: ICallableElementLike[] = [];
    if (!dws.length) {
      return res;
    }

    dws.forEach(line => {
      if (typeof data !== 'undefined') { line.run(data, this.origin.owner); }
      const fn = (d => {
        line.run(d, this.origin.owner);
      }) as ICallableElementLike;
      fn.origin = line;
      res.push(fn);
    });

    return res;
  }
  // tslint:disable-next-line:variable-name
  public dispense(IdValue_or_IndexValue: IDictionary) {
    let downstream: ILineLike | undefined;
    const isIndex = isValidArrayIndex(Object.keys(IdValue_or_IndexValue)[0]);

    for (const i of Object.keys(IdValue_or_IndexValue)) {
      downstream = (
        isIndex
          ? this.origin.get(Number(i))
          : this.origin.getById(i)
      ) as ILineLike | undefined;

      if (downstream) {
        downstream.run(IdValue_or_IndexValue[i], this.origin.owner);
      } else if (process.env.NODE_ENV !== 'production') {
        warn(`Node.codeParamDws.dispense: There is no downstream with ID or index '${i}'.`,
          this.origin.owner);
      }
    }
  }
}
