export interface IDictionary {
    [index: string]: any;
}

export interface ITypedDictionary<T> {
    [index: string]: T;
}

export interface IElementLike {
    run: (data: any, caller?: IElementLike) => any;
    upstream: IStreamOfElement;
    downstream: IStreamOfElement;
}

export interface IStreamOfElement {
    add: (stream: IElementLike) => void;
    get: (index?: number) => IElementLike[]|IElementLike;
}

export interface INode extends IElementLike {
    parentNode?: INode;
    watchers: IDictionary;
}

export interface ILine extends IElementLike {
    id?: string;
}

export type INodeCode = (downstream: INodeCodeDWS, upstream: INodeCodeUPS, thisExec: INodeCodeThisExec) => any;

export interface INodeCodeDWS {
    [index: number]: IElementLike;
    all: (data: any) => void;
    get: (id: string, data?: any) => ILine|undefined;
    dispense: (keyValue: {[key: string]: any}) => void;
}
export interface INodeCodeUPS {
    data: any;
    caller: ILine|undefined;
}
export interface INodeCodeThisExec {
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
    collection?: boolean;
    node: INode;
    sync: boolean;
}
