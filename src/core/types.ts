import { Node } from './node';

export interface DefaultPorts {
   $I: any;
   $O: any;
   $E: NodeErr;
   [name: string]: any;
}

export interface IOPorts<I = any, O = any> extends DefaultPorts {
   $I: I;
   $O: O;
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

export namespace Events {
   export type OnRun<PT = DefaultPorts> = (args: OnRunArgs<PT>) => void;

   export interface OnRunArgs<PT = DefaultPorts> {
      entry: {
         [_ in keyof PT]: boolean;
      } & { name: string };
      data: any;
      $$: any;
   }
}
