import { DefaultPortType, NodeErr, NodeRunPeriod } from '../types';
import { debug } from './debug';
import { Port, PortSet, PortSetCtor } from './port';

export const ports_waiting_link: Array<{
   from: Port<any>,
   to: string,
}> = [];

export abstract class Node<
   PortType extends DefaultPortType = DefaultPortType
   > {
   public static global_node_uid = 0;

   public readonly uid = ++Node.global_node_uid;
   public readonly type?: string;
   public abstract run(data: any, caller: Port<any>): void;
   public parent: Node | undefined;

   public readonly $$: PortSet<PortType> = PortSetCtor<PortType>(this);
   public readonly port = this.$$;

   /**
    * Handle tje error occurred on this node.
    * The error will be transferred in following order until one
    * can handle this error
    * 1. nodes connected to `E` port of this node
    * 2. the parent of this node
    * 3. Global Error processor
    */
   public handleError(node_err: NodeErr) {
      node_err.where.push(this);

      if (this.$$.$get('E').links.size) {
         this.$$.__PortSet__.E.links.forEach(val => {
            val.call(node_err);
         });
      } else if (this.parent) {
         this.parent.handleError(node_err);
      } else {
         debug.handleNodeErr(node_err);
      }
   }
   /**
    * Add the ports previously requested to connect to this node
    *
    * Most types of nodes should call this method at the end of
    * their constructor.
    */
   public preconnect(): void {
      for (const { from, to } of ports_waiting_link) {
         Port.connect(from, this.$$.$get(to));
      }
      ports_waiting_link.length = 0;
   }

   /**
    * Generate description information for the node
    */
   public generateIdentity(): { [field: string]: any } {
      return {
         uid: this.uid,
         parent: this.parent,
         type: this.type,
      };
   }
}
