import { CallableElement } from '../../types';
import { Line } from '../line';
import { Node } from '../node';
import { NodeStream, Stream } from '../stream';

export abstract class BasicNode<T = any> extends Node<T | Promise<T>> {
  public readonly upstream: NodeStream = new NodeStream(this);
  public readonly downstream: NodeStream = new NodeStream(this);
  public readonly code: BasicNodeCode<T>;

  public abstract run(data?: any, caller?: Line): T | Promise<T>;
  public abstract readonly type: number;
  public abstract generateIdentity(): object;
  public abstract clone(): this;
}

export namespace BasicNode {
  export const CallableDws = {
    onchange: toCallableDws,
    hostedObj: (thisStream: NodeStream) => new BasicNodeDws(thisStream),
  };
}

function callableDws(line: Line, caller: Node, data?: any) {
  return line.run(data, caller);
}

function toCallableDws(
  this: NodeStream,
  operationType: number,
  i: number | null,
  line: Line | null,
  hostedObj: BasicNodeDws,
) {
  switch (operationType) {
    case Stream.operationType.add:
      const f: CallableElement =
        callableDws.bind(null, line as Line, this.owner);
      f.origin = line as Line;
      hostedObj.push(f);
      break;
    case Stream.operationType.del:
      hostedObj[i as number] = void 0;
      break;
    case Stream.operationType.clear:
      hostedObj.length = 0;
  }
}

class BasicNodeDws extends Array<CallableElement | undefined> {
  constructor(thisStream: NodeStream) {
    super();

  }
}
