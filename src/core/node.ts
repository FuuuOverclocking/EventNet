import { warn } from '../shared/util/debug';
import { Element } from './element';
import { Arrow, Pipe, Twpipe } from './line';
import { linesWaitingLink, NodeDwsMethods, NodeDwsUpsMethods, NodeUpsMethods } from './node-methods';
import { NodeErrorStream, NodeStream } from './stream';
import {
  ElementType, ICallableElementLike, IDictionary,
  ILineHasDws, ILineHasUps, ILineLike,
  ILineOptions,
  INodeCodeDWS, INodeHasDws, INodeHasDwsAndErrorStream,
  INodeHasUps, INodeLike, INormalNodeCode, IRawNodeCode, NodeRunningStage,
} from './types';
import {
  applyMixins, def, handleError,
  isNode, isPipe, isTwpipe,
  isValidArrayIndex,
} from './util';
import { deweld, weld } from './weld';

/**
 * The ancestor of all the nodes.
 * Add methods to its prototype when need to patch.
 */
export abstract class Node extends Element implements INodeLike {
  public parent: INodeLike | undefined = void 0;
  public abstract type: number;
}

export abstract class BasicNode extends Node implements
  INodeHasDwsAndErrorStream,
  INodeHasUps,
  NodeUpsMethods,
  NodeDwsMethods,
  NodeDwsUpsMethods {

  public abstract type: ElementType;

  public upstream: NodeStream = new NodeStream(this);
  public downstream: [NodeStream, NodeErrorStream] = [
    new NodeStream(this, toCallableDws, new NodeCodeDws()),
    new NodeErrorStream(this),
  ];

  // the default iostream of node
  public In: NodeStream = this.upstream;
  public Out: NodeStream = this.downstream[0];

  // the error stream of node
  public Err: NodeErrorStream = this.downstream[1];

  public ondestory: Array<(this: BasicNode, node: BasicNode) => void> = [];
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

  public abstract run(data?: any, caller?: ILineHasDws): any | Promise<any>;
  public readonly code: IRawNodeCode | INormalNodeCode;
  constructor(code: IRawNodeCode | INormalNodeCode) {
    super();

    def(this.Out.wrappedElements, 'origin', this.Out);

    this.code = code;

    // all types of Node with upstream(s), should contain the following lines in its constructor
    for (const line of linesWaitingLink) {
      weld(this.In, line.downstream);
      if (isTwpipe(line.type)) {
        weld(this.Out, line.downstream);
      }
    }
    linesWaitingLink.length = 0;
    // all types of Node with upstream(s), should contain the lines abov in its constructor
  }

  public setErrStream(elem: ILineHasUps | INodeHasUps | null) {
    const original = this.Err.get();
    if (original) {
      deweld(this.Err, original.upstream);
      if (isTwpipe(original.type)) {
        deweld(this.In, original.upstream);
      }
    }

    if (elem === null) {
      return;
    }
    if (isNode(elem.type)) {
      const pipe = new Pipe(null, elem as INodeHasUps, { classes: ['error'] });
      weld(this.Err, pipe.upstream);
    } else if (isPipe(elem.type)) {
      weld(this.Err, (elem as ILineHasUps).upstream);
    } else if (isTwpipe(elem.type)) {
      weld(this.Err, (elem as ILineHasUps).upstream);
      weld(this.In, (elem as ILineHasUps).upstream);
    } else {
      handleError(new Error('errorReceiver must be assigned to Node, Pipe or Twpipe'), 'Node.setErrStream', this);
    }
  }
  public _errorHandler(when: NodeRunningStage, what?: any) {
    const er = this.Err.get();
    if (er) {
      er.run({ when, what }, this);
    } else {
      handleError(what, `Node running stage '${NodeRunningStage[when]}'`, this);
    }
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


  // mixin method
  // tslint:disable:max-line-length
  public createLine: (node: INodeHasUps, options: any, type: ElementType) => Arrow | Pipe | Twpipe;
  public createArrow: (node: INodeHasUps | null | undefined, options?: ILineOptions) => Arrow;
  public createPipe: (node: INodeHasUps | null | undefined, options?: ILineOptions) => Pipe;
  public createTwpipe: (node: (INodeHasUps & INodeHasDws) | null | undefined, options?: ILineOptions) => Twpipe;
  public arrow: <T extends INodeHasUps>(node: T, options?: ILineOptions) => T;
  public pipe: <T extends INodeHasUps>(node: T, options?: ILineOptions) => T;
  public twpipe: <T extends (INodeHasUps & INodeHasDws) >(node: T, options?: ILineOptions) => T;
  public alsoArrow: (node: INodeHasUps, options?: ILineOptions) => BasicNode;
  public alsoPipe: (node: INodeHasUps, options?: ILineOptions) => BasicNode;
  public alsoTwpipe: (node: (INodeHasUps & INodeHasDws), options?: ILineOptions) => BasicNode;
  public arrowNext: (options?: ILineOptions) => BasicNode;
  public pipeNext: (options?: ILineOptions) => BasicNode;
  public twpipeNext: (options?: ILineOptions) => BasicNode;
  // tslint:enable:max-line-length

}

// mixin methods
applyMixins(BasicNode, [NodeUpsMethods, NodeDwsMethods, NodeDwsUpsMethods]);

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
