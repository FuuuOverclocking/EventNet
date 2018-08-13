import {
  IDictionary, IElementLike, IElementStream,
  ILineHasUps, ILineLike, INodeHasDwsAndErrorStream,
  INodeLike, IStreamOfLine, IStreamOfNode,
} from './types';
import { handleError, isPipeLike, isTwpipe } from './util';

export class NodeStream implements IStreamOfNode {
  public add(line: ILineLike) {
    if (~this.elements.indexOf(line)) {
      return;
    }

    this.elements.push(line);

    this.wrappedElements && this.wrappedElements.push(this.wrapper(line));

    if (typeof line.id !== 'undefined') {
      if (process.env.NODE_ENV !== 'production' && typeof this.elementsById[line.id] !== 'undefined') {
        handleError('The stream of the same id already exists.', 'stream.add', this.owner);
      }

      this.elementsById[line.id] = line;
    }
  }

  public get(index?: number): ILineLike | Array<ILineLike | undefined> | undefined {
    return typeof index === 'undefined' ? this.elements : this.elements[index];
  }

  public getById(id: string): ILineLike | undefined {
    return this.elementsById[id];
  }

  // tslint:disable:unified-signatures
  /**
   * Return the lines meet the condition specified in the given querystring
   */
  public ask(querystring: string): ILineLike[];
  /**
   * Return the lines having these classes
   */
  public ask(classes: string[]): ILineLike[];
  /**
   * Return the lines that meet the condition specified in a callback function
   */
  public ask(filter: (line: ILineLike) => boolean): ILineLike[];
  // tslint:enable:unified-signatures
  public ask(arg: any) {
    let fn: any;
    if (typeof arg === 'string') {
      const res: ILineLike[] = [];

      const regLeading = /^\s*(arrow|pipelike|pipe|twpipe)/;
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
        handleError(new Error('invaild querystring'), 'NodeStream.ask', this.owner);
      }

      let typeCheck: (line: ILineLike) => boolean = () => true;
      let classCheck: (line: ILineLike) => boolean = () => true;
      if (type) {
        switch (type) {
          case 'arrow':
            typeCheck = (line: ILineLike) => !isPipeLike(line.type);
            break;
          case 'pipelike':
            typeCheck = (line: ILineLike) => isPipeLike(line.type);
            break;
          case 'pipe':
            typeCheck = (line: ILineLike) => isPipeLike(line.type) && !isTwpipe(line.type);
            break;
          case 'twpipe':
            typeCheck = (line: ILineLike) => isTwpipe(line.type);
            break;
        }
      }
      if (classes) {
        classCheck = (line: ILineLike) => {
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
      fn = (line: ILineLike | undefined) => {
        if (!line || !line.classes) { return; }
        for (const theClass of arg) {
          if (!~line.classes.indexOf(theClass)) { return false; }
        }
        return true;
      };
    } else if (typeof arg === 'function') {
      fn = arg;
    } else if (process.env.NODE_ENV !== 'production') {
      handleError(new Error('the type of param is wrong'), 'stream.find', this.owner);
    }

    return this.elements.filter(fn);
  }

  public del(line: ILineLike) {
    const i = this.elements.indexOf(line);
    if (!~i) { return; }
    this.elements[i] = void 0;
    this.wrappedElements && delete this.wrappedElements[i];
    if (line.id) {
      this.elementsById[line.id] = void 0;
    }
  }
  public clear() {
    this.elements.length = 0;
    this.wrappedElements.length = 0;
    this.elementsById = {};
  }

  public readonly owner: INodeLike;
  private elements: Array<ILineLike | undefined> = [];
  private elementsById: IDictionary<ILineLike> = {};

  public wrappedElements: any[];
  private wrapper: (line: ILineLike) => any;
  public useWrap(wrapper?: ((line: ILineLike) => any), wrappedElementsDefaultValue?: any) {
    if (!wrapper) { return; }
    this.wrappedElements = wrappedElementsDefaultValue || [];
    this.wrapper = wrapper;
  }
  constructor(owner: INodeLike, wrapper?: (line: ILineLike) => any, wrappedElementsDefaultValue?: any) {
    this.owner = owner;
    this.useWrap(wrapper, wrappedElementsDefaultValue);
  }
}

export class SingleStream<Owner extends IElementLike, Stream extends IElementLike> implements IElementStream {
  public readonly owner: Owner;
  public element: Stream | undefined = void 0;
  constructor(owner: Owner) {
    this.owner = owner;
  }

  public add(node: Stream) {
    this.element = node;
  }
  public get() {
    return this.element;
  }
  public del(node: Stream) {
    this.element === node && (this.element = void 0);
  }
  public clear() {
    this.element = void 0;
  }
}
export class LineStream extends SingleStream<ILineLike, INodeLike> implements IStreamOfLine { }
export class NodeErrorStream extends SingleStream<INodeHasDwsAndErrorStream, ILineHasUps> implements IStreamOfNode { }
