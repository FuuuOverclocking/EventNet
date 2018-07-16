import { installAttr } from "../../eventnet.dev";
import { typedAttrs } from "../typed_attrs";

import runPlan from "./runPlan";
installAttr("fold", typedAttrs["fold"]);
installAttr("sync", typedAttrs["sync"]);
installAttr("runPlan", runPlan);