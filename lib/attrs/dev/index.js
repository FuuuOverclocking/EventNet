"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventnet_dev_1 = require("../../eventnet.dev");
const typed_attrs_1 = require("../typed_attrs");
const runPlan_1 = require("./runPlan");
eventnet_dev_1.installAttr("fold", typed_attrs_1.typedAttrs["fold"]);
eventnet_dev_1.installAttr("sync", typed_attrs_1.typedAttrs["sync"]);
eventnet_dev_1.installAttr("runPlan", runPlan_1.default);
//# sourceMappingURL=index.js.map