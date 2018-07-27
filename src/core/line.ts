import { ElementType, ILineLike, ILineOptions, INodeLike, IStreamOfElement } from "./types";
import { handleError, tip } from "./util";

class StreamOfLine implements IStreamOfElement {
    public stream: INodeLike | undefined = void 0;

    public add(node: INodeLike) {
        this.stream = node;
    }
    public get() {
        return this.stream;
    }
    public del(node: INodeLike) {
        this.stream === node && (this.stream = void 0);
    }
}

export abstract class Line implements ILineLike {
    public _isEN = true;
    public abstract type: ElementType;
    public readonly id: string | undefined;
    constructor(
        ups: INodeLike | null | undefined,
        dws: INodeLike | null | undefined,
        { id, features }: ILineOptions = {},
    ) {
        this.id = id;
        this.features = features ?
            Array.isArray(features) ?
                features : [features]
            : [];
        ups && (this.upstream.stream = ups);
        dws && (this.downstream.stream = dws);
    }
    public features: string[] = [];

    /**
     * Run this Line
     * @param data if the line is Arrow, data only can be null or undefined
     */
    public abstract run(data: any, caller: INodeLike): void;
    public upstream = new StreamOfLine();
    public downstream = new StreamOfLine();
}

export class Arrow extends Line {
    public type = ElementType.Arrow;
    public run(data: any, caller: INodeLike) {
        if (process.env.NODE_ENV !== "production") {
            if (typeof data !== "undefined" || data !== null) {
                handleError(new Error("data can not pass through Arrow, replace with Pipe"), "Arrow", this);
                return;
            }
            if (!this.downstream.stream) {
                tip("the downstream of the arrow below is null", this);
                return;
            }
        }
        this.downstream.stream && this.downstream.stream.run(void 0, caller);
    }
}

export class Pipe extends Line {
    public type = ElementType.Pipe;
    public run(data: any, caller: INodeLike) {
        if (process.env.NODE_ENV !== "production") {
            if (!this.downstream.stream) {
                tip("the downstream of the pipe below is null", this);
                return;
            }
        }
        this.downstream.stream && this.downstream.stream.run(data, caller);
    }
}

export class Twpipe extends Line {
    public type = ElementType.Twpipe;
    public run(data: any, caller: INodeLike) {
        if (process.env.NODE_ENV !== "production") {
            if (!this.downstream.stream || !this.upstream.stream) {
                tip("the downstream or the upstream of the two-way pipe below is null", this);
                return;
            }
            if (caller !== this.upstream.stream && caller !== this.downstream.stream) {
                handleError(new Error("the caller is neither upstream nor downstream"), "Twpipe", this);
                return;
            }
        }

        if (this.upstream.stream && this.downstream.stream) {
            if (caller === this.upstream.stream) {
                this.downstream.stream.run(data, caller);
            } else if (caller === this.downstream.stream) {
                this.upstream.stream.run(data, caller);
            }
        }
    }
}
