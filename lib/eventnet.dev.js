"use strict";
/** EventNet
 * Created by X.Y.Z. at March 3rd, 2018.
 * @version 0.0.2
 */
Object.defineProperty(exports, "__esModule", { value: true });
function en(attrs, states, code) {
    if (typeof attrs === "object" && typeof states === "object" && typeof code === "function") {
        return new ENNode(attrs, states, code);
    }
    else if (typeof attrs === "object" && typeof states === "function") {
        return new ENNode(attrs, {}, states);
    }
    else {
        return new ENNode({}, {}, code);
    }
}
const eventnet = {};
eventnet.defaultState = {
    data: {},
    error: null,
    runTimes: 0,
    running: 0,
};
const attrStore = {
    normalAttr: {
        runplan: {
            before() {
                // TODO
            },
            beforePriority: 100,
            after() {
                // TODO
            },
            afterPriority: 100,
        },
        timelimit: {
            before() {
                // TODO
            },
            beforePriority: 100,
            after() {
                // TODO
            },
            afterPriority: 100,
        },
    },
    typedAttr: {
        fold: "number",
        sync: "boolean",
    },
};
class ENNode {
    constructor(attr, state, code) {
        // Remove in min&mon version
        for (const i of Object.keys(attr)) {
            if (!attrStore.typedAttr[i] && !attrStore.normalAttr[i].before && !attrStore.normalAttr[i].after) {
                console.warn(`EventNet.Node: Attribution '${i}' has not been installed.`);
            }
            if (attrStore.typedAttr[i] && typeof attr[i] !== attrStore.typedAttr[i]) {
                throw new Error(`EventNet.Node: The type of attribution '${i}' must be ${attrStore.typedAttr[i]}.`);
            }
        }
    }
}
exports.default = en;
//# sourceMappingURL=eventnet.dev.js.map