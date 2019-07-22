import { Node } from 'eventnet';

export function runTest({
   getter,
   checker,
   input,
}: {
   getter: () => Node;
   checker: (node: Node) => Promise<void>;
   input: any;
}) {
   const node = getter();
   node.input(input);
   return checker(node);
}
