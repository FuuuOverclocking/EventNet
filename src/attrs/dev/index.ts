import { installAttr } from "../../eventnet.dev";
import { typedAttrs } from "../typed_attrs";

// tslint:disable:no-string-literal

import runPlan from "./runplan";
installAttr("fold", typedAttrs["fold"]);
installAttr("sync", typedAttrs["sync"]);
installAttr("runPlan", runPlan);
