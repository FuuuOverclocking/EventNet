import { getElementProducer } from '../element';
import { Arrow, Pipe } from '../line';
import { NodeDwsMethods } from '../node-methods';
import { RawNode } from '../raw-node';
import { ILineOptions, INodeHasUps } from '../types';
import { IRawNodeCode } from '../types';
import { handleError } from '../util';

const redistCode: IRawNodeCode = (dws, ups, me) => {
  (me.origin as ReplayNode).upsDataSequence.push(ups.data);
  dws.all(ups.data);
};

export class ReplayNode extends RawNode {
  constructor() {
    super({ sync: true }, redistCode);
  }
  public upsDataSequence: any[] = [];
  public createArrow: (node: INodeHasUps, options?: ILineOptions) => Arrow;
  public createPipe: (node: INodeHasUps | null | undefined, options?: ILineOptions) => Pipe;

  public arrowNext: () => never;
  public pipeNext: () => never;
  public createTwpipe: () => never;
  public twpipe: () => never;
  public alsoTwpipe: () => never;
  public twpipeNext: () => never;
}
ReplayNode.prototype.createArrow = function(this: ReplayNode, node: INodeHasUps, options?: ILineOptions) {
  if (!node) {
    process.env.NODE_ENV !== 'production' &&
      handleError(new Error('the target node must be designated'), 'RedistNode.createArrow');
  }
  const line: Arrow = NodeDwsMethods.prototype.createArrow.call(this, node, options);
  for (const msg of this.upsDataSequence) {
    // if the msg !== undefined or null, it will cause errors
    line.run(msg, this);
  }
  return line;
};
ReplayNode.prototype.createPipe = function(this: ReplayNode, node: INodeHasUps, options?: ILineOptions) {
  if (!node) {
    process.env.NODE_ENV !== 'production' &&
      handleError(new Error('the target node must be designated'), 'RedistNode.createPipe');
  }
  const line: Pipe = NodeDwsMethods.prototype.createPipe.call(this, node, options);
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
