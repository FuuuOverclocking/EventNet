import { ElementType } from '../types';
import { debug } from './debug';
import { Element } from './element';
import { Line } from './line';
import { Node } from './node';

export abstract class Stream {
  public readonly owner: Element;
  constructor(owner: Element) {
    this.owner = owner;
  }
  public abstract get():
    Element |
    undefined |
    ReadonlyArray<Element | undefined>;
  public abstract add(el: Element): void;
  public abstract del(el: Element): void;
  public abstract clear(): void;

  public hostedObj?: any;
  public onchange?(
    operationType: number,
    el: Element | null,
    hostedObj: any,
  ): void;
  public static readonly operationType = {
    add: 0,
    del: 1,
    clear: 2,
  };
}

export function weld(stream1: NodeStream, stream2: LineStream): void;
export function weld(stream1: LineStream, stream2: NodeStream): void;
export function weld(stream1: any, stream2: any) {
  stream1.add(stream2.owner);
  stream2.add(stream1.owner);
}

export function deweld(stream1: NodeStream, stream2: LineStream): void;
export function deweld(stream1: LineStream, stream2: NodeStream): void;
export function deweld(stream1: any, stream2: any) {
  stream1.del(stream2.owner);
  stream2.del(stream1.owner);
}

export class NodeStream extends Stream {
  constructor(
    owner: Node,
    onchange?: typeof Stream.prototype.onchange,
    hostedObj?: any) {
    super(owner);
    onchange && (this.onchange = onchange);
    hostedObj && (this.hostedObj = hostedObj);
  }
  public readonly owner: Node;
  protected elements: Array<Line | undefined>;
  protected elementsById: { [id: string]: Line };
  /**
   * Get all the lines of the stream.
   * NOTE: the array should not be modified,
   *       which will also change the original array
   */
  public get(): ReadonlyArray<Line | undefined> {
    // The copy of the array should have been returned,
    // but for performance,
    return this.elements; // return this.elements.slice();
  }
  public getById(id: string): Line | undefined {
    return this.elementsById[id];
  }

  public add(line: Line) {
    if (~this.elements.indexOf(line)) {
      return;
    }

    if (typeof line.id !== 'undefined') {
      if (process.env.NODE_ENV !== 'production' &&
        typeof this.elementsById[line.id] !== 'undefined') {
        debug('StreamSameEl', this.owner, new Error());
      }

      this.elementsById[line.id] = line;
    }

    this.elements.push(line);

    this.onchange &&
      this.onchange(Stream.operationType.add, line, this.hostedObj);
  }
  public del(line: Line) {
    const i = this.elements.indexOf(line);
    if (!~i) { return; }
    if (line.id) {
      (this.elementsById[line.id] as any) = void 0;
    }
    this.elements[i] = void 0;

    this.onchange &&
      this.onchange(Stream.operationType.del, line, this.hostedObj);
  }
  public clear() {
    this.elements.length = 0;
    this.elementsById = {};

    this.onchange &&
      this.onchange(Stream.operationType.del, null, this.hostedObj);
  }

  // tslint:disable:unified-signatures
  /**
   * Return the lines meet the condition specified in the given querystring
   */
  public ask(querystring: string): Line[];
  /**
   * Return the lines having these classes
   */
  public ask(classes: string[]): Line[];
  /**
   * Return the lines that meet the condition specified in a callback function
   */
  public ask(filter: (line: Line) => boolean): Line[];
  // tslint:enable:unified-signatures
  public ask(arg: any) {
    let fn: any;
    if (typeof arg === 'string') {
      const res: Line[] = [];

      const regLeading = /^\s*(arrow|pipe)/;
      const regClasses = /(\.[0-9a-zA-Z\-_]+)/g;

      let regRes: RegExpMatchArray | null;
      let type: string | undefined;
      let classes: string[] | undefined;
      if (regRes = arg.match(regLeading)) {
        type = regRes[1];
      }
      if (regRes = arg.match(regClasses)) {
        classes = regRes;
      }
      if (process.env.NODE_ENV !== 'production' && !type && !classes) {
        debug('NodeStreamAskQs', this.owner, new Error());
      }

      let typeCheck: (line: Line) => boolean = () => true;
      let classCheck: (line: Line) => boolean = () => true;
      if (type === 'arrow') {
        typeCheck = (line: Line) => line.type === ElementType.Arrow;
      } else if (type === 'pipe') {
        typeCheck = (line: Line) => line.type === ElementType.Pipe;
      }

      if (classes) {
        classCheck = (line: Line) => {
          if (!line.classes) { return false; }
          for (const cl of classes as string[]) {
            if (!~line.classes.indexOf(cl.substr(1))) { return false; }
          }
          return true;
        };
      }

      for (const line of this.elements) {
        if (!line) { continue; }
        if (typeCheck(line) && classCheck(line)) {
          res.push(line);
        }
      }

      return res;

    } else if (Array.isArray(arg)) {
      fn = (line: Line | undefined) => {
        if (!line || !line.classes) { return; }
        for (const theClass of arg) {
          if (!~line.classes.indexOf(theClass)) { return false; }
        }
        return true;
      };
    } else if (typeof arg === 'function') {
      fn = arg;
    } else if (process.env.NODE_ENV !== 'production') {
      debug('NodeStreamAskParam', this.owner, new Error());
    }
    return this.elements.filter(fn);
  }
}

export class LineStream extends Stream {
  public readonly owner: Line;
  protected element: Node | undefined;
  public get() {
    return this.element;
  }
  public add(node: Node) {
    this.element = node;
  }
  public del(node: Node) {
    node === this.element && (this.element = void 0);
  }
  public clear() {
    this.element = void 0;
  }
}
