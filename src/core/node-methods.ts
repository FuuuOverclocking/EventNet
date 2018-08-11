import { Arrow, Pipe, Twpipe } from './line';
import { NodeErrorStream, NodeStream } from './stream';
import {
  ElementType, IElementLike, IElementStream,
  ILineHasDws, ILineOptions, INodeHasDws,
  INodeHasUps, INodeLike, IStreamOfNode,
} from './types';
import { isPipeLike, isTwpipe } from './util';
import { weld } from './weld';

export const linesWaitingLink: ILineHasDws[] = [];

export abstract class NodeUpsMethods { }

export abstract class NodeDwsMethods implements INodeHasDws {
  public createLine(node: INodeHasUps, options: any = {}, type: ElementType) {
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
  public createArrow(node: INodeHasUps | null | undefined, options?: ILineOptions) {
    const line: Arrow = new Arrow(this, node, options);
    weld(this.Out, line.upstream);
    return line;
  }
  public createPipe(node: INodeHasUps | null | undefined, options?: ILineOptions) {
    const line: Pipe = new Pipe(this, node, options);
    weld(this.Out, line.upstream);
    return line;
  }
  public arrow<T extends INodeHasUps>(node: T, options?: ILineOptions): T {
    this.createArrow(node, options);
    return node;
  }
  public pipe<T extends INodeHasUps>(node: T, options?: ILineOptions): T {
    this.createPipe(node, options);
    return node;
  }
  public alsoArrow(node: INodeHasUps, options?: ILineOptions): INodeHasDws {
    this.createArrow(node, options);
    return this;
  }
  public alsoPipe(node: INodeHasUps, options?: ILineOptions): INodeHasDws {
    this.createPipe(node, options);
    return this;
  }
  public arrowNext(options?: ILineOptions): INodeHasDws {
    linesWaitingLink.push(this.createArrow(null, options));
    return this;
  }
  public pipeNext(options?: ILineOptions): INodeHasDws {
    linesWaitingLink.push(this.createPipe(null, options));
    return this;
  }

  public abstract uid: number;
  public abstract Out: IStreamOfNode;
  public abstract downstream: IStreamOfNode | IStreamOfNode[];
  public abstract parent: INodeLike | undefined;
  public abstract run(data?: any, caller?: IElementLike): any;
  public abstract type: number;
}

export abstract class NodeDwsUpsMethods implements INodeHasDws, INodeHasUps {
  public createTwpipe(node: (INodeHasUps & INodeHasDws) | null | undefined, options?: ILineOptions) {
    const line = new Twpipe(this, node, options);
    weld(this.Out, line.upstream);
    weld(this.In, line.upstream);
    return line;
  }
  public twpipe<T extends (INodeHasUps & INodeHasDws)>(node: T, options?: ILineOptions): T {
    this.createTwpipe(node, options);
    return node;
  }
  public alsoTwpipe(node: (INodeHasUps & INodeHasDws), options?: ILineOptions): INodeHasUps & INodeHasDws {
    this.createTwpipe(node, options);
    return this;
  }
  public twpipeNext(options?: ILineOptions): INodeHasUps & INodeHasDws {
    linesWaitingLink.push(this.createTwpipe(null, options));
    return this;
  }

  public abstract uid: number;
  public abstract In: IStreamOfNode;
  public abstract Out: IStreamOfNode;
  public abstract upstream: IStreamOfNode | IStreamOfNode[];
  public abstract downstream: IStreamOfNode | IStreamOfNode[];
  public abstract parent: INodeLike | undefined;
  public abstract run(data?: any, caller?: IElementLike): any;
  public abstract type: number;
  public abstract createLine(node: INodeHasUps, options: any, type: ElementType): Arrow | Pipe | Twpipe;
  public abstract createArrow(node: INodeHasUps | null | undefined, options?: ILineOptions): Arrow;
  public abstract createPipe(node: INodeHasUps | null | undefined, options?: ILineOptions): Pipe;
  public abstract arrow<T extends INodeHasUps>(node: T, options?: ILineOptions): T;
  public abstract pipe<T extends INodeHasUps>(node: T, options?: ILineOptions): T;
  public abstract alsoArrow(node: INodeHasUps, options?: ILineOptions): INodeHasDws & INodeHasUps;
  public abstract alsoPipe(node: INodeHasUps, options?: ILineOptions): INodeHasDws & INodeHasUps;
  public abstract arrowNext(options?: ILineOptions): INodeHasDws & INodeHasUps;
  public abstract pipeNext(options?: ILineOptions): INodeHasDws & INodeHasUps;
}
