/** EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
import { IDictionary, INodeCode } from "./types";
/**
 * 创建一个节点
 */
declare function en(attrs: IDictionary, states: IDictionary, code: INodeCode): ENNode;
declare function en(attrs: IDictionary, code: INodeCode): ENNode;
declare function en(codes: INodeCode): ENNode;
declare class ENNode {
    constructor(attr: IDictionary, state: IDictionary, code: INodeCode);
}
export default en;
