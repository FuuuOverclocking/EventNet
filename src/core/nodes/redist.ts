import { Arrow, Pipe } from '../line';
import { NodeDwsMethods } from '../node-methods';
import { NormalNode } from '../normal-node';
import { IDictionary, ILineOptions, INodeHasDws, INodeHasUps, INormalNodeCode } from '../types';
import { handleError } from '../util';

const redistCode: INormalNodeCode = (dws, ups, me) => {
  me.state.data.push(ups.data);
  dws.all(ups.data);
};

export class RedistNode extends NormalNode {
  constructor() {
    super(
      { sync: true },
      {
        data: [],
      },
      redistCode);
  }
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
  for (const msg of this.state.data) {
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
  for (const msg of this.state.data) {
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
