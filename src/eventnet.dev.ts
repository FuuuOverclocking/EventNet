/** EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */

interface IDictionary {
    [index: string]: any;
}

type INodeCode = (downstream?: INodeCodeDWS, upstream?: INodeCodeUPS, thisExec?: INodeCodeThisExec) => any;

interface INodeCodeDWS {}
interface INodeCodeUPS {}
interface INodeCodeThisExec {}

/**
 * 创建一个节点
 */
function en(attr: IDictionary, state: IDictionary, code: INodeCode): ENNode;
function en(attr: IDictionary, code: INodeCode): ENNode;
function en(code: INodeCode): ENNode;

function en(attr: any, state?: any, code?: any) {
    if (typeof attr === "object" && typeof state === "object" && typeof code === "function") {
        return new ENNode(attr, state, code);
    } else if (typeof attr === "object" && typeof state === "function") {
        return new ENNode(attr, {}, state);
    } else {
        return new ENNode({}, {}, code);
    }
}

let eventnet: any = {};

eventnet.defaultState = {
    data: {},
    error: null,
    runTimes: 0,
    running: 0,
};

interface IAttrStore {
    normalAttr: {
        [index: string]: {
            before: undefined|IAttrFunc,
            beforePriority: number,
            after: undefined|IAttrFunc,
            afterPriority: number,
        },
    };
    typedAttr: {
        [index: string]: "number"|"string"|"object"|"symbol"|"boolean"|"function";
    };
}

type IAttrFunc = (condition: IAttrFuncCondition, currentNode: any) => void;

interface IAttrFuncCondition {
    data: any;
    attrValue: any;
    shut: boolean;
}
let attrStore: IAttrStore = {
    normalAttr: {
        runplan: {
            before() {
                // TODO
            },
            beforePriority: 100,
            after() {
                // TODO
            },
            afterPriority: 100,
        },
        timelimit: {
            before() {
                // TODO
            },
            beforePriority: 100,
            after() {
                // TODO
            },
            afterPriority: 100,
        },
    },
    typedAttr: {
        fold: "number",
        sync: "boolean",
    },
};

class ENNode {
    constructor(attr: IDictionary, state: IDictionary, code: INodeCode) {
        // Remove in min&mon version
        for (const i of Object.keys(attr)) {
            if (!attrStore.typedAttr[i] && !attrStore.normalAttr[i].before && !attrStore.normalAttr[i].after) {
                console.warn(`EventNet.Node: Attribution '${i}' has not been installed.`);
            }
            if (attrStore.typedAttr[i] && typeof attr[i] !== attrStore.typedAttr[i]) {
                throw new Error(`EventNet.Node: The type of attribution '${i}' must be ${attrStore.typedAttr[i]}.`);
            }
        }
    }
}
