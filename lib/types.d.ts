export interface IDictionary {
    [index: string]: any;
}
export declare type INodeCode = (downstream?: INodeCodeDWS, upstream?: INodeCodeUPS, thisExec?: INodeCodeThisExec) => any;
interface INodeCodeDWS {
}
interface INodeCodeUPS {
}
interface INodeCodeThisExec {
}
export interface IAttrStore {
    normalAttr: {
        [index: string]: INormalAttr;
    };
    typedAttr: {
        [index: string]: "number" | "string" | "object" | "symbol" | "boolean" | "function";
    };
}
interface INormalAttr {
    before: undefined | INormalAttrFunc;
    beforePriority: number;
    after: undefined | INormalAttrFunc;
    afterPriority: number;
}
declare type INormalAttrFunc = (condition: IAttrFuncCondition, currentNode: any) => void;
interface IAttrFuncCondition {
    data: any;
    attrValue: any;
    shut: boolean;
}
export {};
