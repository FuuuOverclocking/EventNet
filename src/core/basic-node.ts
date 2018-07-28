import { Arrow, Pipe, Twpipe } from './line';
import { getLinesWaitingLink, NodeDwsMethods, NodeDwsUpsMethods } from './node-methods';
import { NodeErrorStream, NodeStream } from './stream';
import {
  ElementType, ICallableElementLike, IDictionary,
  ILineHasDws, ILineHasUps, ILineLike,
  ILineOptions, INodeCode, INodeHasDws,
  INodeHasDwsAndErrorReceiver, INodeHasUps, INodeLike,
  NodeRunningStage,
} from './types';
import { applyMixins, copyAugment, handleError, isNode, isPipe, isTwpipe } from './util';
import { deweld, weld } from './weld';

export abstract class BasicNode implements INodeHasDwsAndErrorReceiver,
  INodeHasUps,
  NodeDwsMethods,
  NodeDwsUpsMethods {

  // mixin methods
  // tslint:disable:max-line-length
  public createLine: (node: INodeHasUps, options: any, type: ElementType) => Arrow | Pipe | Twpipe;
  public createArrow: (node: INodeHasUps | null | undefined, options?: ILineOptions) => Arrow;
  public createPipe: (node: INodeHasUps | null | undefined, options?: ILineOptions) => Pipe;
  public createTwpipe: (node: (INodeHasUps & INodeHasDws) | null | undefined, options?: ILineOptions) => Twpipe;
  public arrow: (node: INodeHasUps, options?: ILineOptions) => INodeHasUps;
  public pipe: (node: INodeHasUps, options?: ILineOptions) => INodeHasUps;
  public twpipe: (node: (INodeHasUps & INodeHasDws), options?: ILineOptions) => INodeHasUps & INodeHasDwsAndErrorReceiver;
  public alsoArrow: (node: INodeHasUps, options?: ILineOptions) => INodeHasDws & INodeHasUps;
  public alsoPipe: (node: INodeHasUps, options?: ILineOptions) => INodeHasDws & INodeHasUps;
  public alsoTwpipe: (node: (INodeHasUps & INodeHasDws), options?: ILineOptions) => INodeHasUps & INodeHasDwsAndErrorReceiver;
  public arrowNext: (options?: ILineOptions) => INodeHasDws & INodeHasUps;
  public pipeNext: (options?: ILineOptions) => INodeHasDws & INodeHasUps;
  public twpipeNext: (options?: ILineOptions) => INodeHasUps & INodeHasDwsAndErrorReceiver;
  // tslint:enable:max-line-length

  public readonly name: string | undefined;
  public abstract type: ElementType;
  public parentNode: INodeLike | undefined = void 0;
  public upstream: NodeStream = new NodeStream(this);
  public downstream: [NodeStream, NodeErrorStream] = [
    new NodeStream(this, line => {
      const func: ICallableElementLike = ((data?: any) => {
        line.run(data, this);
      }) as ICallableElementLike;
      func.origin = line;
      return func;
    }),
    new NodeErrorStream(this),
  ];

  // the default iostream of node
  public In: NodeStream = this.upstream;
  public Out = this.downstream[0];

  // the error stream of node
  public errorReceiver = this.downstream[1];

  public abstract run(data: any, caller?: ILineHasDws): any | Promise<any>;
  public readonly code: INodeCode;
  constructor(code: INodeCode, name?: string) {
    this.code = code;
    this.name = name;

    copyAugment(this.Out.wrappedContent, {
      all: BasicNode.codeParamDws.all.bind(this),
      ask: BasicNode.codeParamDws.ask.bind(this),
      id: BasicNode.codeParamDws.id.bind(this),
      dispense: BasicNode.codeParamDws.dispense.bind(this),
    }, [
      'all',
      'ask',
      'id',
      'dispense',
    ]);

    for (const line of getLinesWaitingLink()) {
      weld(this.In, line.downstream);
      if (isTwpipe(line.type)) {
        weld(this.Out, line.downstream);
      }
    }
    getLinesWaitingLink().length = 0;
  }

  public setErrorReceiver(elem: ILineHasUps | INodeHasUps | null) {
    const original = this.errorReceiver.get();
    if (original) {
      deweld(this.errorReceiver, original.upstream);
      if (isTwpipe(original.type)) {
        deweld(this.In, original.upstream);
      }
    }

    if (elem === null) {
      return;
    }
    if (isNode(elem.type)) {
      const pipe = new Pipe(null, elem as INodeHasUps, { classes: 'error' });
      weld(this.errorReceiver, pipe.upstream);
    } else if (isPipe(elem.type)) {
      weld(this.errorReceiver, (elem as ILineHasUps).upstream);
    } else if (isTwpipe(elem.type)) {
      weld(this.errorReceiver, (elem as ILineHasUps).upstream);
      weld(this.In, (elem as ILineHasUps).upstream);
    } else {
      handleError(new Error('errorReceiver must be assigned to Node, Pipe or Twpipe'), 'Node.setErrorReceiver', this);
    }
  }
  protected errorHandler(when: NodeRunningStage, what?: any) {
    const er = this.errorReceiver.get();
    if (er) {
      er.run({ when, what }, this);
    } else {
      handleError(what, `Node running stage '${NodeRunningStage[when]}'`, this);
    }
  }
  protected static codeParamDws = {
    all(this: BasicNode, data: any) {
      for (const dws of (this.Out.get() as Array<ILineLike | undefined>)) {
        dws && dws.run(data, this);
      }
    },
    id(this: BasicNode, id: string) {
      const dws = this.Out.getById(id);
      if (!dws) { return; }

      const res = (data => {
        dws.run(data, this);
      }) as ICallableElementLike;
      res.origin = dws;
      return res;
    },
    ask(this: BasicNode, askFor: string | string[] | ((line: ILineLike) => boolean), data?: any) {
      const dws = this.Out.ask(askFor as any);
      const res: ICallableElementLike[] = [];
      if (!dws.length) {
        return res;
      }

      dws.forEach(line => {
        if (typeof data !== 'undefined') { line.run(data, this); }
        const func = (d => {
          line.run(d, this);
        }) as ICallableElementLike;
        func.origin = line;
        res.push(func);
      });

      return res;
    },
    // tslint:disable-next-line:variable-name
    dispense(this: BasicNode, IdValue_or_IndexValue: IDictionary) {
      let downstream: ILineLike | undefined;
      if (isNaN(Number(
        Object.keys(IdValue_or_IndexValue)[0]))) {
        // Identify 'keyValue' with ID-value type.
        for (const id of Object.keys(IdValue_or_IndexValue)) {
          downstream = this.Out.getById(id);

          if (downstream) {
            downstream.run(IdValue_or_IndexValue[id], this);
          } else if (process.env.NODE_ENV !== 'production') {
            handleError(
              new Error(`There is no downstream with ID '${id}'.`),
              'Node.codeParamDws.get',
              this);
          }
        }
      } else {
        // Identify 'keyValue' with index-value type.

        // for-in will skip those index(es) that don't have value
        // tslint:disable-next-line:forin
        for (const index in IdValue_or_IndexValue) {
          downstream = this.Out.get(Number(index)) as ILineLike | undefined;

          if (typeof downstream !== 'undefined') {
            downstream.run(IdValue_or_IndexValue[index], this);
          } else if (process.env.NODE_ENV !== 'production') {
            handleError(
              new Error(`There is no downstream at position ${index}.`),
              'Node.codeParamDws.get',
              this);
          }
        }
      }
    },
  };
}

applyMixins(BasicNode, [NodeDwsMethods, NodeDwsUpsMethods]);
