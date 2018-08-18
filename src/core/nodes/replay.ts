import { getElementProducer } from '../element';
import { Arrow, Pipe } from '../line';
import { Node } from '../node';
import { NodeMethods } from '../node-methods';
import { NodeStream } from '../stream';
import { ElementType, ILineOptions, INodeLike } from '../types';
import { handleError } from '../util';

export class ReplayNode extends Node {

  public readonly type = ElementType.Node + ElementType.Stateful;

  public readonly upstream: NodeStream = new NodeStream(this);
  public readonly downstream: NodeStream = new NodeStream(this);

  public upsDataSequence: any[] = [];
  public run(data?: any) {
    this.upsDataSequence.push(data);
    this.downstream.get().forEach(line => line && line.run(data, this));
  }
}

ReplayNode.prototype.createArrow = function(this: ReplayNode, node: INodeLike, options?: ILineOptions) {
  if (!node) {
    process.env.NODE_ENV !== 'production' &&
      handleError(new Error('the target node must be designated'), 'RedistNode.createArrow');
  }
  const line: Arrow = NodeMethods.prototype.createArrow.call(this, node, options);
  for (const msg of this.upsDataSequence) {
    // if the msg !== undefined or null, it will cause errors
    line.run(msg, this);
  }
  return line;
};
ReplayNode.prototype.createPipe = function(this: ReplayNode, node: INodeLike, options?: ILineOptions) {
  if (!node) {
    process.env.NODE_ENV !== 'production' &&
      handleError(new Error('the target node must be designated'), 'RedistNode.createPipe');
  }
  const line: Pipe = NodeMethods.prototype.createPipe.call(this, node, options);
  for (const msg of this.upsDataSequence) {
    line.run(msg, this);
  }
  return line;
};
ReplayNode.prototype.arrowNext =
  ReplayNode.prototype.pipeNext =
  ReplayNode.prototype.createTwpipe =
  ReplayNode.prototype.twpipe =
  ReplayNode.prototype.alsoTwpipe =
  ReplayNode.prototype.twpipeNext =
  () => {
    handleError(new Error('the method "arrowNext", "pipeNext", "createTwpipe",' +
      ' "twpipe", "alsoTwpipe", "twpipeNext" is forbidden to use'), 'RedistNode');
    throw new Error('the method "arrowNext", "pipeNext", "createTwpipe",' +
      ' "twpipe", "alsoTwpipe", "twpipeNext" is forbidden to use');
  };

export const replay = getElementProducer(() => new ReplayNode(), 'Replay Node');
