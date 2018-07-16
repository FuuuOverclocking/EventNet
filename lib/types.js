"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ElementType
 * Lowest bit: 0 - Node,    1 - Line
 *
 * For Node:
 *** 2-th bit: 0 - Normal,  1 - Raw
 * For Line:
 *** 2-th bit: 0 - Normal,  1 - Smart
 *** 1-th bit: 0 - Arrow,   1 - Some kind of pipe
 *** 0-th bit: 0 - one-way, 1 - two-way
 *
 * @readonly
 * @enum {number}
 */
var ElementType;
(function (ElementType) {
    ElementType[ElementType["NormalNode"] = 0] = "NormalNode";
    ElementType[ElementType["RawNode"] = 2] = "RawNode";
    ElementType[ElementType["Arrow"] = 1] = "Arrow";
    ElementType[ElementType["SmartArrow"] = 3] = "SmartArrow";
    ElementType[ElementType["Pipe"] = 5] = "Pipe";
    ElementType[ElementType["SmartPipe"] = 7] = "SmartPipe";
    ElementType[ElementType["Twpipe"] = 13] = "Twpipe";
    ElementType[ElementType["SmartTwpipe"] = 15] = "SmartTwpipe";
})(ElementType = exports.ElementType || (exports.ElementType = {}));
var NodeRunningStage;
(function (NodeRunningStage) {
    NodeRunningStage[NodeRunningStage["before"] = 0] = "before";
    NodeRunningStage[NodeRunningStage["code"] = 1] = "code";
    NodeRunningStage[NodeRunningStage["after"] = 2] = "after";
    NodeRunningStage[NodeRunningStage["finish"] = 3] = "finish";
    NodeRunningStage[NodeRunningStage["over"] = 4] = "over";
})(NodeRunningStage = exports.NodeRunningStage || (exports.NodeRunningStage = {}));
//# sourceMappingURL=types.js.map