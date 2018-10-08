import { ElementType } from '../types';
import { debug } from './debug';
import { Element } from './element';
import { Line } from './line';
import { Node } from './node';
import { returnTrue } from './util/index';

export abstract class Stream {
  public readonly owner: Element;
  constructor(owner: Element) {
    this.owner = owner;
  }
  public abstract get():
    Element | undefined |
    ReadonlyArray<Element | undefined>;
  public abstract add(el: Element): void;
  public abstract del(el: Element): void;
  public abstract clear(): void;

  public weld(stream: Stream) {
    this.add(stream.owner);
    stream.add(this.owner);
  }
  public deweld(stream: Stream) {
    this.del(stream.owner);
    stream.del(this.owner);
  }

  public hostedObj?: any;
  public onchange?(
    this: this,
    operationType: number,
    i: number | null,
    el: Element | null,
    hostedObj: any,
  ): void;
  public static readonly operationType = {
    add: 0,
    del: 1,
    clear: 2,
  };
}

export interface NodeStream {
  weld(stream: LineStream): void;
  deweld(stream: LineStream): void;
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
  protected elements: Array<Line | undefined> = [];
  protected elementsById: { [id: string]: Line } = {};
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

    const i = this.elements.push(line);

    this.onchange &&
      this.onchange(Stream.operationType.add, i - 1, line, this.hostedObj);
  }

  public del(line: Line) {
    const i = this.elements.indexOf(line);
    if (!~i) { return; }
    if (line.id) {
      (this.elementsById[line.id] as any) = void 0;
    }
    this.elements[i] = void 0;

    this.onchange &&
      this.onchange(Stream.operationType.del, i, line, this.hostedObj);
  }

  public clear() {
    this.elements.length = 0;
    this.elementsById = {};

    this.onchange &&
      this.onchange(Stream.operationType.del, null, null, this.hostedObj);
  }

  /**
   * Get Line with given ID from the downstream if exist
   * @param id the id of Line
   */
  public id(id: string): Line | undefined {
    return this.elementsById[id];
  }

  /**
   * Return the lines meet the condition specified in the given querystring
   */
  public query(querystring: string): Line[] {
    const regLeading = /^\s*(arrow|pipe)/;
    const regClasses = /(\.\!?[0-9a-zA-Z\-_]+)/g;

    let regRes: RegExpMatchArray | null;
    let type: string | undefined;
    let classes: string[] | undefined;

    if (regRes = querystring.match(regLeading)) {
      type = regRes[1];
    }
    if (regRes = querystring.match(regClasses)) {
      classes = regRes;
    }
    if (process.env.NODE_ENV !== 'production' && !type && !classes) {
      debug('NodeStreamAskQs', this.owner, new Error());
    }

    let typeCheck: (line: Line) => boolean = returnTrue;
    let classCheck: (line: Line) => boolean = returnTrue;

    if (type) {
      const _type = type === 'arrow' ? ElementType.Arrow : ElementType.Pipe;
      typeCheck = line => line.type === _type;
    }

    if (classes) {
      classCheck = line => {
        if (!line.classes) { return false; }
        for (const cl of classes as string[]) {
          if (cl.charAt(1) === '!') {
            if (~line.classes.indexOf(cl.substr(2))) { return false; }
          } else if (!~line.classes.indexOf(cl.substr(1))) { return false; }
        }
        return true;
      };
    }

    return this.elements.filter(
      line =>
        line &&
        typeCheck(line) &&
        classCheck(line)) as Line[];
  }

  /**
   * Return the lines having these classes
   */
  public classes(classes: string[]): Line[] {
    return this.elements.filter((line: Line | undefined) => {
      if (!line || !line.classes) { return false; }

      for (const cl of classes) {
        if (cl.charAt(0) === '!') {
          if (~line.classes.indexOf(cl)) { return false; }
        } else if (!~line.classes.indexOf(cl)) { return false; }
      }
      return true;
    }) as Line[];
  }

  /**
   * Return the lines that meet the condition specified in a callback function
   */
  public filter(fn: (line: Line | undefined) => boolean): Array<Line | undefined> {
    return this.elements.filter(fn);
  }
}

export interface LineStream {
  weld(stream: NodeStream): void;
  deweld(stream: NodeStream): void;
}
export class LineStream extends Stream {
  public readonly owner: Line;
  protected element: Node | undefined = void 0;
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
