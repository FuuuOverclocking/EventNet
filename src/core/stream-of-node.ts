import { ILineLike, INodeLike, IStreamOfElement, ITypedDictionary } from "./types";
import { handleError } from "./util";

export class StreamOfNode implements IStreamOfElement {
    public add(line: ILineLike) {
        if (~this.content.indexOf(line)) {
            return;
        }

        this.content.push(line);

        // tslint:disable-next-line:no-unused-expression
        this.wrappedContent && this.wrappedContent.push(this.wrapper(line));

        if (typeof line.id !== "undefined") {
            if (process.env.NODE_ENV !== "production" && typeof this.contentById[line.id] !== "undefined") {
                handleError("The stream of the same id already exists.", "stream.add", this.node);
            }

            this.contentById[line.id] = line;
        }
    }

    public get(index?: number): ILineLike | Array<ILineLike | undefined> | undefined {
        return typeof index === "undefined" ? this.content : this.content[index];
    }

    // tslint:disable:unified-signatures
    public find(id: string): ILineLike | undefined;
    public find(features: string[]): ILineLike[];
    public find(filter: (line: ILineLike) => boolean): ILineLike[];
    // tslint:enable:unified-signatures
    public find(arg: any) {
        let fn: any;
        if (typeof arg === "string") {
            return this.contentById[arg];
        } else if (Array.isArray(arg)) {
            fn = (line: ILineLike | undefined) => {
                for (const feature of arg) {
                    if (!line) { continue; }
                    if (!~line.features.indexOf(feature)) { return false; }
                }
                return true;
            };
        } else if (typeof arg === "function") {
            fn = arg;
        } else if (process.env.NODE_ENV !== "production") {
            handleError("the type of param is wrong", "stream.find", this.node);
        }

        return this.content.filter(fn);
    }

    public del(line: ILineLike) {
        const i = this.content.indexOf(line);
        if (!~i) { return; }
        delete this.content[i];
        // tslint:disable-next-line:no-unused-expression
        this.wrappedContent && delete this.wrappedContent[i];
        if (line.id) {
            delete this.contentById[line.id];
        }
    }

    public node: INodeLike;
    private content: Array<ILineLike | undefined> = [];
    private contentById: ITypedDictionary<ILineLike> = {};

    public wrappedContent: any;
    private wrapper: (line: ILineLike) => any;
    public wrap(wrapper?: (line: ILineLike) => any) {
        // tslint:disable-next-line:no-unused-expression
        wrapper && (this.wrappedContent = []) && (this.wrapper = wrapper);
    }
    constructor(node: INodeLike, wrapper?: (line: ILineLike) => any) {
        this.node = node;
        this.wrap(wrapper);
    }
}
