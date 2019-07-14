import { DefaultPorts as DP, NodeInvocation } from './types';

export type Node<Ports extends DP = DP> = {
   // Ports are actually defined on `Node.$$`.
   // We use Proxy to access them.
   [name in keyof Ports]: Port<Ports[name]>;
} & OriginalNode<Ports>;

export const Node = {
   portsWaitingLink: [] as Array<{
      /** the port to be connected to the next declared node */
      from: Port<any>,
      /** the port name of the next declared node */
      to: string,
   }>,

   /**
    * Connect the ports that previously requested connecting to next node
    * to this node.
    *
    * Most types of nodes should call this method at the end of their constructor.
    */
   preconnect(target: Node): void {
      const { portsWaitingLink } = Node;
      for (const { from, to } of portsWaitingLink) {
         from.connect(target.$$.get(to));
      }
      portsWaitingLink.length = 0;
   },

   proxify<Ports extends DP>(node: OriginalNode<Ports>) {
      return new Proxy(node, {
         get(target, prop: string, receiver) {
            if (prop.startsWith('$') && !prop.startsWith('$$')) {
               return target.$$.get(prop);
            } else {
               return Reflect.get(target, prop, receiver);
            }
         },
      }) as Node<Ports>;
   },
};

export abstract class OriginalNode<Ports extends DP> {
   public abstract readonly uid: number;
   public abstract readonly type: string;
   public abstract readonly isSubnet: boolean;
   public readonly $$: PortSet<Ports>;
   public parent: Subnet | InvisibleNode | undefined;
   public domain: Domain;

   public abstract run(invocation: NodeInvocation): void;
   public abstract input(invocation: NodeInvocation): void;

   public abstract readState(path: string): any;

   protected abstract _setParent(parent: Subnet): void;

   public on(event: '', handler: () => void) { }

   public toString() {
      return `Node(${this.domain.name}/${this.uid}`;
   }

   public getIdentity(): { [field: string]: string } {
      return {
         domain: this.domain.name,
         uid: String(this.uid),
         type: this.type,
      };
   }

   public dispatch(map: {
      [name in keyof Ports]?:
      Node<DP<Ports[name]>> |
      PortSet<DP<Ports[name]>> |
      Port<Ports[name]> |
      string;
   }) {
      this.$$.dispatch(map);
      return this;
   }

   public pipe<U extends DP<Ports['$O']>>(node: Node<U>): Node<U>;
   public pipe<U extends DP<Ports['$O']>>(portSet: PortSet<U>): PortSet<U>;
   public pipe<U extends Port<Ports['$O']>>(port: U): U;
   public pipe(obj: any) {
      return this.$$.get('$O').pipe(obj);
   }

   public alsoPipe<U extends DP<Ports['$O']>>(node: Node<U>): this;
   public alsoPipe<U extends DP<Ports['$O']>>(portSet: PortSet<U>): this;
   public alsoPipe<U extends Port<Ports['$O']>>(port: U): this;
   public alsoPipe(obj: any) {
      this.$$.get('$O').alsoPipe(obj);
      return this;
   }

   public pipeNext(nextNodePortName = '$I') {
      this.$$.get('$O').pipeNext(nextNodePortName);
      return this;
   }
}
