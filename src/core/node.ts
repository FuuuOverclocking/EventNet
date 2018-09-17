import { ElementType, LineLike, NodeLike, NodeRunPhase } from '../types';
import { assign } from '../util/assign';
import { handleNodeError } from './debug';
import { Element, elementify } from './element';
import { Arrow, Line, Pipe } from './line';
import { NodeStream, weld } from './stream';

export const linesWaitingLink: Line[] = [];

export abstract class Node<T = any>
  extends Element<T>
  implements NodeLike<T> {

  public abstract run(data?: any, caller?: Line): T;
  public parent: Node | undefined = void 0;
  public readonly isLine = false;
  public readonly type?: number;
  public abstract readonly upstream: NodeStream;
  public abstract readonly downstream: NodeStream;

  /**
   * Most types of nodes should call this method of the parent class
   * at the end of their constructor, which adds lines to the upstream of node.
   */
  public preconnect(data?: any, caller?: Line): void {
    linesWaitingLink.forEach(line => weld(this.upstream, line.downstream));
    linesWaitingLink.length = 0;
  }

  public generateIdentity(): object {
    return assign(super.generateIdentity(), { is: 'Node' });
  }

  public errorHandler(when: NodeRunPhase, what?: any, which = this) {
    const errDws = this.downstream.get().filter(line => {
      if (!line || !line.classes) { return false; }
      return ~line.classes.indexOf('error');
    }) as LineLike[];

    if (errDws.length) {
      errDws.forEach(line => line.run({ when, what, which }, this));
      return;
    } else if (this.parent) {
      this.parent.errorHandler(when, what, which);
    } else {
      handleNodeError(when, what, which);
    }
  }


  public createLine<U>(
    type: ElementType.Arrow | ElementType.Pipe,
    node: NodeLike<U> | null | undefined,
    options: { id?: string, classes?: string[] } = {},
  ): Arrow<U> | Pipe<U> {
    node && elementify(node);
    const line: Arrow<U> | Pipe<U> =
      type === ElementType.Arrow ?
        new Arrow<U>(this, node as Node<U>, options) :
        new Pipe<U>(this, node as Node<U>, options);
    return line;
  }
  public createArrow: <U>(
    node: NodeLike<U> | null | undefined,
    options?: { id?: string, classes?: string[] },
  ) => Arrow<U>;
  public createPipe: <U>(
    node: NodeLike<U> | null | undefined,
    options?: { id?: string, classes?: string[] },
  ) => Pipe<U>;
  public arrow: <U extends NodeLike>(
    node: U,
    options?: { id?: string, classes?: string[] },
  ) => U;
  public pipe: <U extends NodeLike>(
    node: U,
    options?: { id?: string, classes?: string[] },
  ) => U;
  public alsoArrow: (
    node: NodeLike,
    options?: { id?: string, classes?: string[] },
  ) => this;
  public alsoPipe: (
    node: NodeLike,
    options?: { id?: string, classes?: string[] },
  ) => this;
  public arrowNext: (options?: { id?: string, classes?: string[] }) => this;
  public pipeNext: (options?: { id?: string, classes?: string[] }) => this;
}

export namespace Node {
  /**
   * Trying to transform an object into Node
   */
  export const ify: <T extends NodeLike>(el: T) => Node = elementify;
}

const proto = Node.prototype;
const createMethods = [proto.createArrow, proto.createPipe] =
  (
    (types, f) => [f(types[0]), f(types[1])]
  )(
    [ElementType.Arrow, ElementType.Pipe],
    (type: ElementType) => function <U>(
      this: Node,
      node: NodeLike<U> | null | undefined,
      options?: { id?: string, classes?: string[] },
    ) {
      return this.createLine(type, node, options);
    }) as any;

// tslint:disable:trailing-comma
[
  proto.arrow, proto.pipe,
  proto.alsoArrow, proto.alsoPipe,
  proto.arrowNext, proto.pipeNext
] = (
  (methods, f1, f2, f3) => [
    f1(methods[0]), f1(methods[1]),
    f2(methods[0]), f2(methods[1]),
    f3(methods[0]), f3(methods[1]),
  ]
)(
  createMethods,
  (method: any) => function <U extends NodeLike>(
    this: Node,
    node: U,
    options?: { id?: string, classes?: string[] },
  ): U {
    method.call(this, node, options);
    return node;
  },
  (method: any) => function(
    this: Node,
    node: NodeLike,
    options?: { id?: string, classes?: string[] },
  ) {
    method.call(this, node, options);
    return this;
  },
  (method: any) => function(
    this: Node,
    options?: { id?: string, classes?: string[] },
  ) {
    linesWaitingLink.push(method.call(this, null, options));
    return this;
  },
) as any;
