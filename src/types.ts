export interface IDictionary {
    [index: string]: any;
}

export interface INode {
    //////////////////////////
}

export type INodeCode = (downstream?: INodeCodeDWS, upstream?: INodeCodeUPS, thisExec?: INodeCodeThisExec) => any;

interface INodeCodeDWS {
    (data: any): void;
    [index: number]: IDownStreamLike;
    all: (data: any) => void;
    get: (id: string, data?: any) => IDownStreamLike;
    dispense: (keyValue: {[key: string]: any}) => void;
}
interface INodeCodeUPS {
    caller: INode|undefined;
}
interface INodeCodeThisExec {
    node: INode;
}

export interface IAttrStore {
    normalAttr: {
        [index: string]: INormalAttr;
    };
    typedAttr: {
        [index: string]: "number"|"string"|"object"|"symbol"|"boolean"|"function";
    };
}
export interface INormalAttr {
    before?: INormalAttrFunc;
    beforePriority?: number;
    after?: undefined|INormalAttrFunc;
    afterPriority?: number;
}
export type INormalAttrFunc = (condition: IAttrFuncCondition, currentNode: any) => void;
export interface IAttrFuncCondition {
    data: any;
    attrValue: any;
    shut: boolean;
}

export interface IDownStreamLike {//////////////////
    (data: any): void;
    [index: string]: any;
}

export interface IUpStreamLike {///////////////////
    (data: any): void;
    [index: string]: any;
}
