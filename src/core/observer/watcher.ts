import Dep from "./dep";

export class Watcher {
    public callback: (this: any, newVal: any, oldVal: any) => void;
    public deep: boolean;
    public expression: string;
    public id: number;
    public sync: boolean;
    public active: boolean = true;

    public deps: Dep[];
    public depIds: SimpleSet<number>;
    public newDeps: Dep[];
    public newDepIds: SimpleSet<number>;

    public getter: (obj: any) => any;
    public value: any;

    constructor() {
    }
}
