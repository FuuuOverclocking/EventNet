"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class StreamOfNode {
    constructor(wrapper) {
        this.content = [];
        this.contentById = {};
        // tslint:disable-next-line:no-unused-expression
        wrapper && (this.wrappedContent = []) && (this.wrapper = wrapper);
    }
    add(line) {
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
    get(index) {
        return typeof index === "undefined" ? this.content : this.content[index];
    }
    getById(id) {
        return typeof id === "undefined" ? this.contentById : this.contentById[id];
    }
}
exports.StreamOfNode = StreamOfNode;
//# sourceMappingURL=stream_of_node.js.map