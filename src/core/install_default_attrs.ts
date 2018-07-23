/**
 * Install the default attrs.
 */

import { installAttr } from "./attr_manager";
import { runPlan, typedAttrs } from "./attrs";
// tslint:disable:no-string-literal

installAttr("fold", typedAttrs["fold"]);
installAttr("sync", typedAttrs["sync"]);
installAttr("runPlan", runPlan);
