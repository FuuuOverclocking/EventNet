import { Arrow, Pipe, Twpipe } from './line';
import { NodeErrorStream, NodeStream } from './stream';
import {
  ElementType, ICallableElementLike, IDictionary,
  ILineLike, ILineOptions, INodeCode,
  INodeLike, NodeRunningStage,
} from './types';
import { handleError, isNode, isPipe, isPipeLike, isTwpipe } from './util';
import { deweld, weld } from './weld';

const linesWaitingLink: ILineLike[] = [];

export abstract class BasicNode implements INodeLike {
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
  public out = this.downstream[0];
  protected errorReceiver = this.downstream[1];
  public abstract run(data: any, caller?: ILineLike): any | Promise<any>;
  public readonly code: INodeCode;
  constructor(code: INodeCode, name?: string) {
    this.code = code;
    this.name = name;

    Object.assign(this.out.wrappedContent, {
      all: BasicNode.codeParamDws.all.bind(this),
      ask: BasicNode.codeParamDws.ask.bind(this),
      id: BasicNode.codeParamDws.id.bind(this),
      dispense: BasicNode.codeParamDws.dispense.bind(this),
    });
    for (const line of linesWaitingLink) {
      weld(this.upstream, line.downstream);
      if (isTwpipe(line.type)) {
        weld(this.out, line.downstream);
      }
    }
    linesWaitingLink.length = 0;
  }

  public setErrorReceiver(elem: ILineLike | INodeLike | null) {
    const original = this.errorReceiver.get();
    if (original) {
      deweld(this.errorReceiver, original.upstream);
      if (isTwpipe(original.type)) {
        deweld(this.upstream, original.upstream);
      }
    }

    if (elem === null) {
      return;
    }
    if (isNode(elem.type)) {
      const pipe = new Pipe(this, elem as INodeLike, { classes: 'error' });
      weld(this.errorReceiver, pipe.upstream);
    } else if (isPipe(elem.type)) {
      weld(this.errorReceiver, elem.upstream);
    } else if (isTwpipe(elem.type)) {
      weld(this.errorReceiver, elem.upstream);
      weld(this.upstream, elem.upstream);
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
  public createLine(node: INodeLike, options: any = {}, type: ElementType) {
    if (isPipeLike(type)) {
      if (isTwpipe(type)) {
        return this.createTwpipe(node, options);
      } else {
        return this.createPipe(node, options);
      }
    } else {
      return this.createArrow(node, options);
    }
  }
  public createArrow(node: INodeLike | null | undefined, options?: ILineOptions): ILineLike {
    const line = new Arrow(this, node, options);
    weld(this.out, line.upstream);
    return line;
  }
  public createPipe(node: INodeLike | null | undefined, options?: ILineOptions): ILineLike {
    const line = new Pipe(this, node, options);
    weld(this.out, line.upstream);
    return line;
  }
  public createTwpipe(node: INodeLike | null | undefined, options?: ILineOptions): ILineLike {
    const line = new Twpipe(this, node, options);
    weld(this.out, line.upstream);
    weld(this.upstream, line.upstream);
    return line;
  }
  public arrow(node: INodeLike, options?: ILineOptions): INodeLike {
    this.createArrow(node, options);
    return node;
  }
  public pipe(node: INodeLike, options?: ILineOptions): INodeLike {
    this.createPipe(node, options);
    return node;
  }
  public twpipe(node: INodeLike, options?: ILineOptions): INodeLike {
    this.createTwpipe(node, options);
    return node;
  }
  public alsoArrow(node: INodeLike, options?: ILineOptions): INodeLike {
    this.createArrow(node, options);
    return this;
  }
  public alsoPipe(node: INodeLike, options?: ILineOptions): INodeLike {
    this.createPipe(node, options);
    return this;
  }
  public alsoTwpipe(node: INodeLike, options?: ILineOptions): INodeLike {
    this.createTwpipe(node, options);
    return this;
  }
  public arrowNext(options?: ILineOptions) {
    linesWaitingLink.push(this.createArrow(null, options));
    return this;
  }
  public pipeNext(options?: ILineOptions) {
    linesWaitingLink.push(this.createPipe(null, options));
    return this;
  }
  public twpipeNext(options?: ILineOptions) {
    linesWaitingLink.push(this.createTwpipe(null, options));
    return this;
  }
  protected static codeParamDws = {
    all(this: BasicNode, data: any) {
      for (const dws of (this.out.get() as Array<ILineLike | undefined>)) {
        dws && dws.run(data, this);
      }
    },
    id(this: BasicNode, id: string) {
      const dws = this.out.getById(id);
      if (!dws) { return; }

      const res = (data => {
        dws.run(data, this);
      }) as ICallableElementLike;
      res.origin = dws;
      return res;
    },
    ask(this: BasicNode, askFor: string | string[] | ((line: ILineLike) => boolean), data?: any) {
      const dws = this.out.ask(askFor as any);
      if (!dws.length) {
        return;
      }
      const res: ICallableElementLike[] = [];

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
          downstream = this.out.getById(id);

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
          downstream = this.out.get(Number(index)) as ILineLike | undefined;

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
