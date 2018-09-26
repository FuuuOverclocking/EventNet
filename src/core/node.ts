import { ElementType, LineLike, NodeLike, NodeRunPhase, UnaryFunction } from '../types';
import { assign } from '../util/assign';
import { handleNodeError } from './debug';
import { Element, getUid } from './element';
import { Arrow, Line, Pipe } from './line';
import { NodeStream, weld } from './stream';

export const linesWaitingLink: Line[] = [];

export abstract class Node<T = any> implements Element<T>, NodeLike<T> {
  public readonly uid = getUid();
  public abstract run(data?: any, caller?: Line): T;
  public parent: Node | undefined = void 0;
  public readonly isLine = false;
  public readonly type?: number;
  public abstract readonly ups: NodeStream;
  public abstract readonly dws: NodeStream;

  /**
   * Most types of nodes should call this method
   * at the end of their constructor, which adds
   * lines to the upstream of node.
   */
  public preconnect(data?: any, caller?: Line): void {
    linesWaitingLink.forEach(line => weld(this.ups, line.dws));
    linesWaitingLink.length = 0;
  }

  public generateIdentity(): { [field: string]: any } {
    return {
      uid: this.uid,
      is: 'Node',
    };
  }

  public errorHandler(when: NodeRunPhase, what?: any, where: Element[] = []) {
    const errDws = this.dws.get().filter(line => {
      if (!line || !line.classes) { return false; }
      return ~line.classes.indexOf('error');
    }) as LineLike[];

    where.push(this);
    if (errDws.length) {
      errDws.forEach(line => line.run({ when, what, where }, this));
      return;
    } else if (this.parent) {
      this.parent.errorHandler(when, what, where);
    } else {
      handleNodeError(when, what, where);
    }
  }


  public createLine<U>(
    type: ElementType.Arrow | ElementType.Pipe,
    node: NodeLike<U> | null | undefined,
    options: { id?: string, classes?: string[] } = {},
  ): Arrow<U> | Pipe<U> {
    node && Element.ify(node);
    const line: Arrow<U> | Pipe<U> =
      type === ElementType.Arrow ?
        new Arrow<U>(this, node as Node<U>, options) :
        new Pipe<U>(this, node as Node<U>, options);
    return line;
  }
}

export interface Node<T = any> extends Element<T> {
  createArrow<U>(
    node: NodeLike<U> | null | undefined,
    options?: { id?: string, classes?: string[] },
  ): Arrow<U>;
  createPipe<U>(
    node: NodeLike<U> | null | undefined,
    options?: { id?: string, classes?: string[] },
  ): Pipe<U>;
  arrow<U extends NodeLike>(
    node: U,
    options?: { id?: string, classes?: string[] },
  ): U;
  pipe<U extends NodeLike>(
    node: U,
    options?: { id?: string, classes?: string[] },
  ): U;
  alsoArrow(
    node: NodeLike,
    options?: { id?: string, classes?: string[] },
  ): this;
  alsoPipe(
    node: NodeLike,
    options?: { id?: string, classes?: string[] },
  ): this;
  arrowNext(options?: { id?: string, classes?: string[] }): this;
  pipeNext(options?: { id?: string, classes?: string[] }): this;
}

export namespace Node {
  /**
   * Trying to transform an object into Node
   */
  export const ify: <T extends NodeLike>(el: T) => Node = Element.ify;
}

const proto = Node.prototype;

proto.biu = Element.biu;

const createMethods = [proto.createArrow, proto.createPipe] =
  (
    (types, f) => [f(types[0]), f(types[1])]
  )(
    [ElementType.Arrow, ElementType.Pipe] as any,
    (type: ElementType.Arrow | ElementType.Pipe) => function <U>(
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
