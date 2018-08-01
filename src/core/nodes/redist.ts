import { Arrow, Pipe } from '../line';
import { NodeDwsMethods } from '../node-methods';
import { RawNode } from '../raw-node';
import { ILineOptions, INodeHasUps } from '../types';
import { handleError } from '../util';
import { IRawNodeCode } from './../types';

const redistCode: IRawNodeCode = (dws, ups, me) => {
  (me.origin as RedistNode).upsDataSequence.push(ups.data);
  dws.all(ups.data);
};

export class RedistNode extends RawNode {
  constructor() {
    super(redistCode, true);
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
RedistNode.prototype.createArrow = function(this: RedistNode, node: INodeHasUps, options?: ILineOptions) {
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
RedistNode.prototype.createPipe = function(this: RedistNode, node: INodeHasUps, options?: ILineOptions) {
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
RedistNode.prototype.arrowNext =
  RedistNode.prototype.pipeNext =
  RedistNode.prototype.createTwpipe =
  RedistNode.prototype.twpipe =
  RedistNode.prototype.alsoTwpipe =
  RedistNode.prototype.twpipeNext =
  () => {
    handleError(new Error('the method "arrowNext", "pipeNext", "createTwpipe",' +
      ' "twpipe", "alsoTwpipe", "twpipeNext" is forbidden to use'), 'RedistNode');
    throw new Error('the method "arrowNext", "pipeNext", "createTwpipe",' +
      ' "twpipe", "alsoTwpipe", "twpipeNext" is forbidden to use');
  };
