import { Element } from './element';
import { Arrow, Pipe, Twpipe } from './line';
import {
  ElementType,
  IElementLike,
  ILineLike,
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
  public createLine(node: INodeLike, options: { id?: string, classes?: string[] } = {}, type: ElementType) {
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
  public createArrow(node: INodeLike | null | undefined, options?: { id?: string, classes?: string[] }) {
    const line: Arrow = new Arrow(this, node, options);
    weld(this.downstream, line.upstream);
    return line;
  }
  public createPipe(node: INodeLike | null | undefined, options?: { id?: string, classes?: string[] }) {
    const line: Pipe = new Pipe(this, node, options);
    weld(this.downstream, line.upstream);
    return line;
  }
  public arrow<T extends INodeLike>(node: T, options?: { id?: string, classes?: string[] }): T {
    this.createArrow(node, options);
    return node;
  }
  public pipe<T extends INodeLike>(node: T, options?: { id?: string, classes?: string[] }): T {
    this.createPipe(node, options);
    return node;
  }
  public alsoArrow(node: INodeLike, options?: { id?: string, classes?: string[] }) {
    this.createArrow(node, options);
    return this;
  }
  public alsoPipe(node: INodeLike, options?: { id?: string, classes?: string[] }) {
    this.createPipe(node, options);
    return this;
  }
  public arrowNext(options?: { id?: string, classes?: string[] }) {
    linesWaitingLink.push(this.createArrow(null, options));
    return this;
  }
  public pipeNext(options?: { id?: string, classes?: string[] }) {
    linesWaitingLink.push(this.createPipe(null, options));
    return this;
  }
  public createTwpipe(node: INodeLike | null | undefined, options?: { id?: string, classes?: string[] }) {
    const line = new Twpipe(this, node, options);
    weld(this.downstream, line.upstream);
    weld(this.upstream, line.upstream);
    return line;
  }
  public twpipe<T extends INodeLike>(node: T, options?: { id?: string, classes?: string[] }): T {
    this.createTwpipe(node, options);
    return node;
  }
  public alsoTwpipe(node: INodeLike, options?: { id?: string, classes?: string[] }) {
    this.createTwpipe(node, options);
    return this;
  }
  public twpipeNext(options?: { id?: string, classes?: string[] }) {
    linesWaitingLink.push(this.createTwpipe(null, options));
    return this;
  }
}
