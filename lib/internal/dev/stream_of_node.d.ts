import { ILine, IStreamOfElement, ITypedDictionary } from "../../types";
export declare class StreamOfNode implements IStreamOfElement {
    add(line: ILine): void;
    get(index?: number): ILine | ILine[] | undefined;
    getById(id?: string): ILine | ITypedDictionary<ILine> | undefined;
    private content;
    private contentById;
    wrappedContent: any;
    private wrapper;
    constructor(wrapper?: (line: ILine) => any);
}
