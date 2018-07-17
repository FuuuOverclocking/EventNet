import { ILine, IStreamOfElement, ITypedDictionary } from "../../types";

export class StreamOfNode implements IStreamOfElement {
    public add(line: ILine) {
        this.content.push(line);

        // tslint:disable-next-line:no-unused-expression
        this.wrappedContent && this.wrappedContent.push(this.wrapper(line));

        if (typeof line.id !== "undefined") {
            // Parameter checking, remove in min&mon version.
            if (typeof this.contentById[line.id] !== "undefined") {
                throw new Error("EventNet.StreamOfNode.add: The stream of the same id already exists.");
            }

            this.contentById[line.id] = line;
        }
    }
    public get(index?: number): ILine | ILine[] | undefined {
        return typeof index === "undefined" ? this.content : this.content[index];
    }
    public getById(id?: string): ILine | ITypedDictionary<ILine> | undefined {
        return typeof id === "undefined" ? this.contentById : this.contentById[id];
    }
    private content: ILine[] = [];
    private contentById: ITypedDictionary<ILine> = {};
    public wrappedContent: any;
    private wrapper: (line: ILine) => any;
    public wrap(wrapper?: (line: ILine) => any) {
        // tslint:disable-next-line:no-unused-expression
        wrapper && (this.wrappedContent = []) && (this.wrapper = wrapper);
    }
    constructor(wrapper?: (line: ILine) => any) {
        this.wrap(wrapper);
    }
}
