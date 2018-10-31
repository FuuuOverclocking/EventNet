import { ElementType } from '../types';
import { handleError } from './debug';
import { Element } from './element';
import { Line } from './line';
import { Node } from './node';
import { returnTrue } from './util/index';

export abstract class Port {
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

  public weld(port: Port) {
    this.add(port.owner);
    port.add(this.owner);
  }
  public deweld(port: Port) {
    this.del(port.owner);
    port.del(this.owner);
  }

  public onchange?(
    this: this,
    operationType: number,
    i: number | null,
    el: Element | null
  ): void;
  public static readonly operationType = {
    add: 0,
    del: 1,
    clear: 2,
  };
}

export interface NodePort {
  weld(port: LinePort): void;
  deweld(port: LinePort): void;
}
export class NodePort extends Port {
  constructor(
    owner: Node,
    onchange?: typeof Port.prototype.onchange) {
    super(owner);
    onchange && (this.onchange = onchange);
  }
  public readonly owner: Node;
  protected elements: Array<Line | undefined> = [];
  protected elementsById: { [id: string]: Line } = {};
  /**
   * Get all the lines of the port.
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
        handleError(
          new Error('the port of the same id already exists'),
          'Port.add',
          this.owner);
      }

      this.elementsById[line.id] = line;
    }

    const i = this.elements.push(line);

    this.onchange &&
      this.onchange(Port.operationType.add, i - 1, line);
  }

  public del(line: Line) {
    const i = this.elements.indexOf(line);
    if (!~i) { return; }
    if (line.id) {
      (this.elementsById[line.id] as any) = void 0;
    }
    this.elements[i] = void 0;

    this.onchange &&
      this.onchange(Port.operationType.del, i, line);
  }

  public clear() {
    this.elements.length = 0;
    this.elementsById = {};

    this.onchange &&
      this.onchange(Port.operationType.del, null, null);
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
      handleError(
        new Error('invalid querystring'),
        'NodePort.query',
        this.owner);
    }

    let typeCheck: (line: Line) => boolean = returnTrue;
    let classCheck: (line: Line) => boolean = returnTrue;

    if (type) {
      const _type = type === 'arrow' ? ElementType.Arrow : ElementType.Pipe;
      typeCheck = line => line.type === _type;
    }

    if (classes) {
      classCheck = line => {
        for (const cl of classes as string[]) {
          if (cl.charAt(1) === '!') {
            if (!line.classes) { continue; }
            if (~line.classes.indexOf(cl.substr(2))) { return false; }
          } else if (!line.classes || !~line.classes.indexOf(cl.substr(1))) { return false; }
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
      if (!line) { return false; }

      for (const cl of classes) {
        if (cl.charAt(0) === '!') {
          if (!line.classes) { continue; }
          if (~line.classes.indexOf(cl)) { return false; }
        } else if (!line.classes || !~line.classes.indexOf(cl)) { return false; }
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

export interface LinePort {
  weld(port: NodePort): void;
  deweld(port: NodePort): void;
}
export class LinePort extends Port {
  public readonly owner: Line;
  protected element: Node | undefined = void 0;
  constructor(
    owner: Line,
    onchange?: typeof Port.prototype.onchange) {
    super(owner);
    onchange && (this.onchange = onchange);
  }
  public get() {
    return this.element;
  }
  public add(node: Node) {
    this.element = node;
    this.onchange &&
      this.onchange(Port.operationType.add, null, node);
  }
  public del(node: Node) {
    node === this.element && (this.element = void 0);
    this.onchange &&
      this.onchange(Port.operationType.del, null, node);

  }
  public clear() {
    this.element = void 0;
    this.onchange &&
      this.onchange(Port.operationType.clear, null, null);
  }
}
