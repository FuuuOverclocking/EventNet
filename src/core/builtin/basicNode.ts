import { isValidArrayIndex } from '../../util/isValidArrayIndex';
import { debug } from '../debug';
import { Line } from '../line';
import { Node } from '../node';
import { NodeStream } from '../stream';

export abstract class BasicNode<T = any> extends Node<T | Promise<T>> {
  public readonly ups: NodeStream = new NodeStream(this);
  public readonly dws: NodeStream = new NodeStream(this);
  public readonly code: (...args: any[]) => T;
  private readonly codeDws = new BasicNodeDws(this.dws);

  public abstract run(data?: any, caller?: Line): T | Promise<T>;
  public abstract readonly type: number;
  public abstract generateIdentity(): object;
  public abstract clone(): this;
}

function callableDws(line: Line, caller: Node, data?: any) {
  return line.run(data, caller);
}

export class BasicNodeDws {
  public readonly origin: NodeStream;
  constructor(thisStream: NodeStream) {
    this.origin = thisStream;
  }
  public get zero() {
    const line = this.origin.get()[0];
    if (process.env.NODE_ENV !== 'production' && !line) {
      debug('BN_NonexistDws', this.origin.owner, new Error());
    }
    return callableDws.bind(null, line as Line, this.origin.owner);
  }
  public get one() {
    const line = this.origin.get()[1];
    if (process.env.NODE_ENV !== 'production' && !line) {
      debug('BN_NonexistDws', this.origin.owner, new Error());
    }
    return callableDws.bind(null, line as Line, this.origin.owner);
  }
  public get two() {
    const line = this.origin.get()[2];
    if (process.env.NODE_ENV !== 'production' && !line) {
      debug('BN_NonexistDws', this.origin.owner, new Error());
    }
    return callableDws.bind(null, line as Line, this.origin.owner);
  }
  public get three() {
    const line = this.origin.get()[3];
    if (process.env.NODE_ENV !== 'production' && !line) {
      debug('BN_NonexistDws', this.origin.owner, new Error());
    }
    return callableDws.bind(null, line as Line, this.origin.owner);
  }
  public i(index: number, data?: any) {
    const line = this.origin.get()[index];
    if (process.env.NODE_ENV !== 'production' && !line) {
      debug('BN_NonexistDws', this.origin.owner, new Error());
    }
    const f = callableDws.bind(line, this.origin.owner);
    if (typeof data !== 'undefined') {
      f(data);
    }
    return f;
  }
  public all(data?: any) {
    this.origin.get().forEach(line =>
      line && line.run(data, this.origin.owner));
  }
  public allnerr(data?: any) {
    this.origin.get().filter(line => {
      if (!line) { return false; }
      if (!line.classes) { return true; }
      return !~line.classes.indexOf('error');
    }).forEach(line => (line as Line).run(data, this.origin.owner));
  }
  public id(id: string) {
    const line = this.origin.getById(id);
    if (!line) {
      if (process.env.NODE_ENV !== 'production') {
        debug('BN_NonexistDws', this.origin.owner, new Error());
      }
      return;
    }
    return callableDws.bind(line, this.origin.owner);
  }
  public dispense(id_value_or_index_value: { [index: number]: any } | { [id: string]: any }) {
    let downstream: Line | undefined;
    const isIndex = isValidArrayIndex(Object.keys(id_value_or_index_value)[0]);

    Object.keys(id_value_or_index_value).forEach(i => {
      downstream = (
        isIndex
          ? this.origin.get()[Number(i)]
          : this.origin.getById(i)
      ) as Line | undefined;

      if (downstream) {
        downstream.run((id_value_or_index_value as any)[i], this.origin.owner);
      } else if (process.env.NODE_ENV !== 'production') {
        debug('BN_NonexistDwsWarn', this.origin.owner);
      }
    });
  }
}
