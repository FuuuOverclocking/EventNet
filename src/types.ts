export interface IDictionary {
    [index: string]: any;
}

export type INodeCode = (downstream?: INodeCodeDWS, upstream?: INodeCodeUPS, thisExec?: INodeCodeThisExec) => any;

interface INodeCodeDWS {
    (data: any): void;
    [index: number]: IDownStreamLike;
    all: (data: any) => void;
    get: (id: string|number, data?: any) => IDownStreamLike;
}
interface INodeCodeUPS {}
interface INodeCodeThisExec {}

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

interface IAttrFuncCondition {
    data: any;
    attrValue: any;
    shut: boolean;
}

interface IDownStreamLike {
    
}