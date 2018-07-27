import { Arrow, Pipe, Twpipe } from "./line";
import { StreamOfNode } from "./stream-of-node";
import {
    ElementType, ICallableElementLike, IDictionary,
    ILineLike, ILineOptions, INodeCode,
    INodeLike, NodeRunningStage,
} from "./types";
import { handleError } from "./util";

const linesWaitingLink: ILineLike[] = [];

export abstract class BasicNode implements INodeLike {
    public _isEN = true;
    public readonly name: string | undefined;
    public abstract type: ElementType;
    public parentNode: INodeLike | undefined = void 0;
    public upstream: StreamOfNode = new StreamOfNode(this);
    public downstream: StreamOfNode = new StreamOfNode(this, (line) => {
        const func: ICallableElementLike = ((data?: any) => {
            line.run(data, this);
        }) as ICallableElementLike;
        func.origin = line;
        return func;
    });
    public abstract run(data: any, caller?: ILineLike): any | Promise<any>;
    public readonly code: INodeCode;
    constructor(code: INodeCode, name?: string) {
        this.code = code;
        this.name = name;

        Object.assign(this.downstream.wrappedContent, {
            all: BasicNode.codeParamDws.all.bind(this),
            ask: BasicNode.codeParamDws.ask.bind(this),
            dispense: BasicNode.codeParamDws.dispense.bind(this),
        });
        for (const line of linesWaitingLink) {
            line.downstream.add(this);
            this.upstream.add(line);
            if (line.type === ElementType.Twpipe) {
                this.downstream.add(line);
            }
        }
        linesWaitingLink.length = 0;
    }

    protected errorReceiver: ILineLike | null = null;
    public setErrorReceiver(elem: ILineLike | INodeLike | null) {
        if (this.errorReceiver) {
            const er = this.errorReceiver;
            er.upstream.del(this);
            if (er.type === ElementType.Twpipe) {
                this.upstream.del(er);
            }
        }

        if (elem === null) {
            this.errorReceiver = null;
            return;
        }
        if (!(elem.type & 1)) {
            this.errorReceiver = new Pipe(this, elem as INodeLike, { features: "error" });
        } else if (elem.type === ElementType.Pipe) {
            this.errorReceiver = elem as ILineLike;
            elem.upstream.add(this);
        } else if (elem.type === ElementType.Twpipe) {
            this.errorReceiver = elem as ILineLike;
            elem.upstream.add(this);
            this.upstream.add(elem as ILineLike);
        } else {
            handleError("errorReceiver must be assigned to Node, Pipe or Twpipe", "Node.setErrorReceiver", this);
        }
    }
    protected errorHandler(when: NodeRunningStage, what?: any) {
        if (this.errorReceiver) {
            this.errorReceiver.run({ when, what }, this);
        } else {
            handleError(what, `Node running stage '${NodeRunningStage[when]}'`, this);
        }
    }
    public createLine(node: INodeLike, options: any = {}, type: ElementType) {
        if (type & 0b10) {
            if (type & 0b100) {
                return this.createTwpipe(node, options);
            } else {
                return this.createPipe(node, options);
            }
        } else {
            return this.createArrow(node, options);
        }
    }
    public createArrow(node: INodeLike | null | undefined, options?: ILineOptions): ILineLike {
        const line = new Arrow(this, node, options);
        this.downstream.add(line);
        line.upstream.add(this);
        return line;
    }
    public createPipe(node: INodeLike | null | undefined, options?: ILineOptions): ILineLike {
        const line = new Pipe(this, node, options);
        this.downstream.add(line);
        line.upstream.add(this);
        return line;
    }
    public createTwpipe(node: INodeLike | null | undefined, options?: ILineOptions): ILineLike {
        const line = new Twpipe(this, node, options);
        this.downstream.add(line);
        this.upstream.add(line);
        line.upstream.add(this);
        return line;
    }
    public arrow(node: INodeLike, options?: ILineOptions): INodeLike {
        this.createArrow(node, options);
        return node;
    }
    public pipe(node: INodeLike, options?: ILineOptions): INodeLike {
        this.createPipe(node, options);
        return node;
    }
    public twpipe(node: INodeLike, options?: ILineOptions): INodeLike {
        this.createTwpipe(node, options);
        return node;
    }
    public alsoArrow(node: INodeLike, options?: ILineOptions): INodeLike {
        this.createArrow(node, options);
        return this;
    }
    public alsoPipe(node: INodeLike, options?: ILineOptions): INodeLike {
        this.createPipe(node, options);
        return this;
    }
    public alsoTwpipe(node: INodeLike, options?: ILineOptions): INodeLike {
        this.createTwpipe(node, options);
        return this;
    }
    public arrowNext(options?: ILineOptions) {
        linesWaitingLink.push(this.createArrow(null, options));
        return this;
    }
    public pipeNext(options?: ILineOptions) {
        linesWaitingLink.push(this.createPipe(null, options));
        return this;
    }
    public twpipeNext(options?: ILineOptions) {
        linesWaitingLink.push(this.createTwpipe(null, options));
        return this;
    }
    protected static codeParamDws = {
        all(this: BasicNode, data: any) {
            for (const dws of (this.downstream.get() as Array<ILineLike | undefined>)) {
                dws && dws.run(data, this);
            }
        },
        ask(this: BasicNode, askFor: string | string[] | ((line: ILineLike) => boolean), data?: any) {
            const dws = this.downstream.ask(askFor as any) as ILineLike | ILineLike[] | undefined;
            let res: ICallableElementLike[] | ICallableElementLike;
            if (!dws) {
                return;
            }
            if (Array.isArray(dws)) {
                res = [];

                dws.forEach((line) => {
                    if (typeof data !== "undefined") { line.run(data, this); }
                    const func = ((d: any) => {
                        line.run(d, this);
                    }) as ICallableElementLike;
                    func.origin = line;
                    (res as ICallableElementLike[]).push(func);
                });

            } else {
                if (typeof data !== "undefined") { dws.run(data, this); }
                const func = ((d: any) => {
                    dws.run(d, this);
                }) as ICallableElementLike;
                func.origin = dws;
                res = func;
            }
            return res;
        },
        // tslint:disable-next-line:variable-name
        dispense(this: BasicNode, IdValue_or_IndexValue: IDictionary) {
            let downstream: ILineLike | undefined;
            if (isNaN(Number(
                Object.keys(IdValue_or_IndexValue)[0]))) {
                // Identify 'keyValue' with ID-value type.
                for (const id of Object.keys(IdValue_or_IndexValue)) {
                    downstream = this.downstream.ask(id) as ILineLike | undefined;

                    if (downstream) {
                        downstream.run(IdValue_or_IndexValue[id], this);
                    } else if (process.env.NODE_ENV !== "production") {
                        handleError(
                            new Error(`There is no downstream with ID '${id}'.`),
                            "Node.codeParamDws.get",
                            this);
                    }
                }
            } else {
                // Identify 'keyValue' with index-value type.

                // for-in will skip those index(es) that don't have value
                // tslint:disable-next-line:forin
                for (const index in IdValue_or_IndexValue) {
                    downstream = this.downstream.get(Number(index)) as ILineLike | undefined;

                    if (typeof downstream !== "undefined") {
                        downstream.run(IdValue_or_IndexValue[index], this);
                    } else if (process.env.NODE_ENV !== "production") {
                        handleError(
                            new Error(`There is no downstream at position ${index}.`),
                            "Node.codeParamDws.get",
                            this);
                    }
                }
            }
        },
    };
}
