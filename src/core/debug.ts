import { config } from '../index';
import { NodeRunPhase } from '../types';
import { longStringSub } from '../util/longStringSub';
import { Element } from './element';
import { Node } from './node';

export let debug: (issueId: string, ...data: any[]) => void = () => { };
export let tip: (msg: string, relatedElement?: Element) => void = () => { };
export let warn: (msg: string, relatedElement?: Element) => void = () => { };
export let generateElemTrace: (elem: Element) => string | void = () => { };

let generateKeyValue: (o: any) => any = () => {};

if (process.env.NODE_ENV !== 'production') {
  if (!config.silent && typeof console !== 'undefined') {
    tip = (msg: string, el?: Element) =>
      console.warn(msg + '\n' + (el ? generateElemTrace(el) : ''));
    warn = (msg: string, el?: Element) =>
      console.error(msg + '\n' + (el ? generateElemTrace(el) : ''));
  }
  generateKeyValue = (o: any) => {
    let result = '';
    for (const key of Object.keys(o)) {
      result += key + ' = "' + longStringSub(o[key], 20) + '", ';
    }
    return result;
  };
  generateElemTrace = (elem: Element) => {
    let result = '';
    let indent = '  ';
    if (elem.isLine &&
      (elem.upstream.get() || elem.downstream.get())) {
      elem = (elem.upstream.get() || elem.downstream.get()) as Node;
    }

    do {
      result += indent + '-> ' + (elem.isLine ? 'Line' : 'Node') + ' ' +
        generateKeyValue(elem.generateIdentity()) + '\n';
      indent += '  ';
    }
    while (elem = (elem as any).parent);
    return result;
  };

  const issues = {
    ArrowPassData:      ['tip', (data: any) =>
      `data '${longStringSub(data)}' can not pass through an Arrow, replace with a Pipe`],
    LineEmptyDws:       ['tip', 'the downstream of the line is empty'],
    LineImproperCall:   ['tip', 'the arrow is activited but not called by its upstream'],
    ElementifyParam:    ['err', 'an Element-like object is expected', 'elementify'],
    ToMakerClone:       ['err', 'an Element with clone method is expected', 'Element.toMaker'],
    StreamSameEl:       ['err', 'the stream of the same id already exists.', 'Stream.add'],
    NodeStreamAskQs:    ['err', 'invaild querystring', 'NodeStream.ask'],
    NodeStreamAskParam: ['err', 'the type of param is wrong', 'NodeStream.ask'],
  } as any;
  debug = (issueId: string, ...data: any[]) => {
    const op = issues[issueId];
    if (!op) {
      throw new Error('invalid debug call');
    }

    let msg: string;
    if (op[0] === 'tip') {
      msg = typeof op[1] === 'function' ? op[1](...data.slice(1)) : op[1];
      tip(msg, data[0]);
    } else if (op[0] === 'warn') {
      msg = typeof op[1] === 'function' ? op[1](...data.slice(1)) : op[1];
      warn(msg, data[0]);
    } else if (op[0] === 'err') {
      msg = typeof op[1] === 'function' ? op[1](...data.slice(2)) : op[1];
      data[1].message = msg;
      handleError(data[1], op[2] || '', data[0]);
    }
  };

}

export function handleError(
  err: any,
  location?: string,
  relatedElement?: Element,
) {
  if (process.env.NODE_ENV !== 'production') {
    warn(`Error [${location}]: ${
      err.message || String(err)
      }`, relatedElement);
  }
  throw err;
}

export function handleNodeError(when: NodeRunPhase, what: any, which: Node) {
  if (process.env.NODE_ENV !== 'production') {
    const errMsg = 'Unhandled Node error:' + '\n' +
      longStringSub(String(what), 100) + '\n' +
      '\t' + `in the run phase of '${NodeRunPhase[when]}' with characteristics:` + '\n' +
      '\t\t' + generateKeyValue(which.generateIdentity());

    warn(errMsg, which);
  }
  throw what;
}
