import { Events, Node } from 'eventnet';

// The node to be tested will have 5 ports:
//    input:
//       $I: number;
//       $foo: string;
//    output:
//       $O: number;
//       $bar: string;
//       $baz: string;
//
// its behavior:
//    $I → ++data → $O
//    $foo → data → $bar
//         ↘ data + data → $baz
const onRun: (
   reject: (reason: any) => void,
   args: Events.OnRunArgs
) => void = (reject, { data, $$, entry }) => {
   // check the correctness of entry
   const inputPortName = entry.name;
   Object.keys(entry)
      .filter(key => key !== 'name' && key !== inputPortName)
      .map(key => entry[key])
      .forEach(val => {
         if (val !== false) {
            reject('invalid args `entry` of NodeOnRunArgs');
         }
      });
   if (entry[entry.name] !== true) {
      reject('invalid args `entry` of NodeOnRunArgs');
   }

   // send data to the relevant port(s)
   if (entry.$I) {
      $$(++data);
   } else if (entry.$foo) {
      $$.$bar(data);
      $$.$baz(data + data);
   } else {
      reject('node was invocated through an invalid port');
   }
};

export function connectAndArgsTest(
   fn: (onRun: Events.OnRun) => {
      getter: () => Node;
   }
): Promise<void> {
   return new Promise((resolve, reject) => {
      const _onRun: Events.OnRun = args => {
         onRun(reject, args);
      };
      const { getter } = fn(_onRun);

   });
}
