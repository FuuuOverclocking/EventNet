import { DefaultPortType } from '../types';
import { debug } from './debug';
import { Node, ports_waiting_link } from './node';
import { canUseProxy, def } from './util';

export class Port<
   T,
   PortSetType extends DefaultPortType = DefaultPortType
> {
   public static connect<T>(port_a: Port<T>, port_b: Port<T>) {
      port_a.links.add(port_b);
      port_b.links.add(port_a);
   }

   public readonly links = new Set<Port<T>>();
   constructor(
      public readonly owner: PortSetType['__Owner__'],
      public readonly name: string
   ) { }

   public call(data: T) {
      this.owner.run(data, this);
   }

   public $pipe<U extends DefaultPortType<T>>(
      node: Node<U>
   ): U extends { O: infer R } ? Port<R> : Port<any>;

   public $pipe<U extends DefaultPortType<T>>(
      port_set: PortSet<U>
   ): U extends { O: infer R } ? Port<R> : Port<any>;
   public $pipe<U extends Port<T>>(port: U): U;

   public $pipe(obj: any) {
      let $: any;
      let ret: any;
      if (obj.links) {
         ret = $ = obj;
      } else if (obj.__PortSet__ || (obj = obj.$$)) {
         $ = obj.$get('I');
         ret = obj.$get('O');
      } else {
         debug.err('EventNet.Port.$pipe: invalid parameter');
      }
      Port.connect(this, $);
      return ret;
   }

   public $alsoPipe<U extends DefaultPortType<T>>(
      node: Node<U>
   ): this;
   public $alsoPipe<U extends DefaultPortType<T>>(
      port_set: PortSet<U>
   ): this;
   public $alsoPipe<U extends Port<T>>(port: U): this;

   public $alsoPipe(obj: any) {
      let $: any;
      if (obj.links) {
         $ = obj;
      } else if (obj.__PortSet__ || (obj = obj.$$)) {
         $ = obj.$get('I');
      } else {
         debug.err('EventNet.Port.$alsoPipe: invalid parameter');
      }
      Port.connect(this, $);
      return this;
   }

   public $pipeNext(port_name: string = 'I') {
      ports_waiting_link.push({
         from: this,
         to: port_name,
      });
   }
}

const PortSetProto = {};
def(PortSetProto, '$get', function(this: any, port_name: string) {
   const port_set = this.__PortSet__;
   if (!port_set[port_name]) {
      port_set[port_name] = new Port<any>(this.__Owner__, port_name);
   }
   return port_set[port_name];
});
def(PortSetProto, '$dispatch', function(this: any, name_target_pair: any) {
   for (const name of Object.keys(name_target_pair)) {
      const port = this.$get(name);
      const target = name_target_pair[name];

      if (target.links) {
         Port.connect(port, target);
      } else if (target.__PortSet__) {
         Port.connect(port, target.$get('I'));
      } else if (target.$$) {
         Port.connect(port, target.$$.$get('I'));
      } else if (target === 'next') {
         port.$pipeNext();
      } else if (typeof target === 'string'
         && target.startsWith('next ')) {
         port.$pipeNext(target.substr(5));
      } else {
         debug.err('EventNet.Node.$$.dispatch: invalid parameter');
      }
   }
});

export type PortSet<PortType extends DefaultPortType> = {
   // the types of ports in the set are declared here
   [name in keyof PortType]: Port<PortType[name]>;
} & {
   // other attributes and methods of the set
   readonly __Owner__: Node<PortType>;
   readonly __PortSet__: {
      [name in keyof PortType]: Port<PortType[name]>;
   };
   $get<name extends keyof PortType>(port_name: name): Port<PortType[name]>;

   $dispatch(
      name_target_pair: {
         [name in keyof PortType]?:
         Node<DefaultPortType<PortType[name]>>
         | PortSet<DefaultPortType<PortType[name]>>
         | Port<PortType[name]>
         | string;
      }
   ): PortSet<PortType>;

   // the shortcut for `[PortSet].I`, which is the default input port
   (): void;
   // the shortcut for `[PortSet].O`, which is the default output port
   $pipe<U extends DefaultPortType<PortType['O']>>(
      node: Node<U>
   ): U extends { O: infer R } ? Port<R> : Port<any>;
   $pipe<U extends DefaultPortType<PortType['O']>>(
      port_set: PortSet<U>
   ): U extends { O: infer R } ? Port<R> : Port<any>;
   $pipe<U extends Port<PortType['O']>>(
      port: U
   ): U;
   $alsoPipe<U extends DefaultPortType<PortType['O']>>(
      node: Node<U>
   ): PortSet<PortType>;
   $alsoPipe<U extends DefaultPortType<PortType['O']>>(
      port_set: PortSet<U>
   ): PortSet<PortType>;
   $alsoPipe<U extends Port<PortType['O']>>(port: U): PortSet<PortType>;

   $pipeNext(port_name?: string): void;
};
export function PortSetCtor<PortType extends DefaultPortType>(
   owner: any
): PortSet<PortType> {
   const port_set = Object.create(PortSetProto);
   port_set.__Owner__ = owner;
   port_set.__PortSet__ = {};
   return canUseProxy ?
      new Proxy(port_set, {
         apply(target, ctx, args) {
            target.$get('O')(args);
         },
         get(target, prop, receiver) {
            switch (prop) {
               case '$get':
               case '$dispatch':
                  return Reflect.get(target, prop, receiver);
               case '$pipe':
               case '$alsoPipe':
               case '$pipeNext':
                  return target.$get('O')[prop];
               default:
                  return target.$get(prop);
            }
         },
      })
      : port_set;
}
