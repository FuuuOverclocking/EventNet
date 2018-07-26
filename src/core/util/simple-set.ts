import { isNative } from ".";
import { ISimpleSet, ISimpleSetConstructor } from "../types";

// tslint:disable-next-line:variable-name
let SimpleSet: ISimpleSetConstructor;

if (typeof Set !== "undefined" && isNative(Set)) {
    SimpleSet = Set;
} else {
    SimpleSet = class Set<T> implements ISimpleSet<T> {
        public set: any;
        constructor() {
            this.set = Object.create(null);
        }
        public has(key: T) {
            return this.set[key] === true;
        }
        public add(key: T) {
            this.set[key] = true;
            return this;
        }
        public clear() {
            this.set = Object.create(null);
        }
    };
}

export { SimpleSet };
