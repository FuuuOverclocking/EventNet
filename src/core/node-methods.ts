import { Element } from './element';
import { Arrow, Pipe, Twpipe } from './line';
import {
  ElementType,
  IElementLike,
  ILineLike,
  ILineOptions,
  INodeLike,
  IStreamOfNode,
  NodeRunningStage,
} from './types';
import { isPipeLike, isTwpipe } from './util';
import { weld } from './weld';

export const linesWaitingLink: ILineLike[] = [];

export abstract class NodeMethods extends Element {
  public abstract readonly downstream: IStreamOfNode;
  public abstract readonly upstream: IStreamOfNode;
  public abstract parent: INodeLike | undefined;
  public abstract readonly type: number;
  public abstract _errorHandler(when: NodeRunningStage, what?: any, where?: IElementLike[]): void;
  public createLine(node: INodeLike, options: any = {}, type: ElementType) {
    if (isPipeLike(type)) {
      if (isTwpipe(type)) {
        return (this as any).createTwpipe(node, options) as Twpipe;
      } else {
        return this.createPipe(node, options);
      }
    } else {
      return this.createArrow(node, options);
    }
  }
  public createArrow(node: INodeLike | null | undefined, options?: ILineOptions) {
    const line: Arrow = new Arrow(this, node, options);
    weld(this.downstream, line.upstream);
    return line;
  }
  public createPipe(node: INodeLike | null | undefined, options?: ILineOptions) {
    const line: Pipe = new Pipe(this, node, options);
    weld(this.downstream, line.upstream);
    return line;
  }
  public arrow<T extends INodeLike>(node: T, options?: ILineOptions): T {
    this.createArrow(node, options);
    return node;
  }
  public pipe<T extends INodeLike>(node: T, options?: ILineOptions): T {
    this.createPipe(node, options);
    return node;
  }
  public alsoArrow(node: INodeLike, options?: ILineOptions) {
    this.createArrow(node, options);
    return this;
  }
  public alsoPipe(node: INodeLike, options?: ILineOptions) {
    this.createPipe(node, options);
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
  public createTwpipe(node: INodeLike | null | undefined, options?: ILineOptions) {
    const line = new Twpipe(this, node, options);
    weld(this.downstream, line.upstream);
    weld(this.upstream, line.upstream);
    return line;
  }
  public twpipe<T extends INodeLike>(node: T, options?: ILineOptions): T {
    this.createTwpipe(node, options);
    return node;
  }
  public alsoTwpipe(node: INodeLike, options?: ILineOptions) {
    this.createTwpipe(node, options);
    return this;
  }
  public twpipeNext(options?: ILineOptions) {
    linesWaitingLink.push(this.createTwpipe(null, options));
    return this;
  }
}
