import { Node } from './node';

export interface DefaultPorts<I = any, O = any> {
   $I: I;
   $O: O;
   $E: NodeErr;
   [name: string]: any;
}

export interface NodeErr<err = any> {
   what: err;
   where: Node[];
   when: {
      runningStage: NodeRuningStage;
      invocation: NodeInvocation;
      attr?: Attr;
   };
}

export enum NodeRuningStage {
   attr,
   code,
   child,
}

export interface NodeInvocation {
   port?: Port;
   data: any;
   [key: string]: any;
}
