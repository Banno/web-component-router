import BasicRoutingInterface from "./routing-interface.js";
import type { Context } from "./page.js";
import type RouteTreeNode from "./route-tree-node.js";
import routingMixin from "./routing-mixin.js";
export type Constructor<T = {}> = new (...args: any[]) => T;
export declare class RoutingMixinInterface {
  routeEnter(
    currentNode: RouteTreeNode,
    nextNodeIfExists: RouteTreeNode | undefined,
    routeId: string,
    context: Context,
  ): Promise<boolean | void>;
  routeExit(
    currentNode: RouteTreeNode,
    nextNode: RouteTreeNode | undefined,
    routeId: string,
    context: Context,
  ): Promise<boolean | void>;
}
const RoutingMixin = <T extends Constructor<HTMLElement>>(superclass: T) => {
  return routingMixin(
    superclass,
  ) as unknown as Constructor<RoutingMixinInterface> & T;
};

//exporting BasicRoutingInterface for backward compatibility - don't break consumer imports
export { RoutingMixin, BasicRoutingInterface };
