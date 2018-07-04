export interface IDictionary {
    [index: string]: any;
}
export interface IStreamLike {
    run: (data: void) => any;
    upstream: IStreamOfElement;
    downstream: IStreamOfElement;
}
export interface IDownstreamLike extends IStreamLike {
}
export interface IUpstreamLike extends IStreamLike {
}
export interface IStreamOfElement {
    add: (stream: IStreamLike) => void;
    get: (index?: number) => IStreamLike[] | IStreamLike;
    [index: string]: any;
}
export interface INode extends IDownstreamLike, IUpstreamLike {
    parentNode?: INode;
    watchers: IDictionary;
}
export declare type INodeCode = (downstream?: INodeCodeDWS, upstream?: INodeCodeUPS, thisExec?: INodeCodeThisExec) => any;
interface INodeCodeDWS {
    (data: any): void;
    [index: number]: IDownstreamLike;
    all: (data: any) => void;
    get: (id: string, data?: any) => IDownstreamLike;
    dispense: (keyValue: {
        [key: string]: any;
    }) => void;
}
interface INodeCodeUPS {
    caller: INode | undefined;
}
interface INodeCodeThisExec {
    node: INode;
}
export interface IAttrStore {
    normalAttr: {
        [index: string]: INormalAttr;
    };
    typedAttr: {
        [index: string]: "number" | "string" | "object" | "symbol" | "boolean" | "function";
    };
}
export interface INormalAttr {
    before?: INormalAttrFunc;
    beforePriority?: number;
    after?: undefined | INormalAttrFunc;
    afterPriority?: number;
}
export declare type INormalAttrFunc = (condition: IAttrFuncCondition, currentNode: any) => void;
export interface IAttrFuncCondition {
    data: any;
    attrValue: any;
    shut: boolean;
}
export {};
