import { Node } from './core/node';
import { Port } from './core/port';

export interface DefaultPortType<I = any, O = any> {
   I: I;
   O: O;
   E: NodeErr;
   [name: string]: any;
}

export enum NodeRunStage {
   attr = 1,
   code,
   child,
}

export interface NodeRunPeriod {
   stage: NodeRunStage;
   attr_index?: number;
   caller: Port<any> | undefined;
   data_on_call: any;
   [i: string]: any;
}

export interface NodeErr {
   what: any;
   when: NodeRunPeriod;
   where: Node[];
}

export interface DebugHandler {
   /**
    * @returns prevent default behavior
    */
   err?(err: any, node?: Node, location?: string): boolean;
   /**
    * @returns prevent default behavior
    */
   warn?(msg: string, node?: Node, location?: string): boolean;
   /**
    * @returns prevent default behavior
    */
   tip?(msg: string): boolean;
   /**
    * @returns prevent default behavior
    */
   handleNodeErr?(err: NodeErr): boolean;
}
