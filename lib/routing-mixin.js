import RouteTreeNode from './route-tree-node.js';
import RouteData from './route-data.js';
import {Context} from './page.js';
import {loadRouteNode, removeRouteNode} from './route-change-handlers.js';
import BasicRoutingInterface from './routing-interface.js';

/**
 * @param {function(new:HTMLElement)} Superclass
 * @polymer
 * @mixinFunction
 */
function routingMixin(Superclass) {
  /**
   * @polymer
   * @mixinClass
   * @implements {BasicRoutingInterface}
   */
  class BasicRouting extends Superclass {
    /**
     * Default implementation for the callback on entering a route node.
     * This will only be used if an element does not define it's own routeEnter method.
     *
     * @param {!RouteTreeNode} currentNode
     * @param {!RouteTreeNode|undefined} nextNodeIfExists
     * @param {string} routeId
     * @param {!Context} context
     * @return {!Promise<boolean|void>}
     */
    async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
      await loadRouteNode(currentNode, nextNodeIfExists, routeId, context);
    }

    /**
     * Default implementation for the callback on exiting a route node.
     * This will only be used if an element does not define it's own routeExit method.
     *
     * @param {!RouteTreeNode} currentNode
     * @param {!RouteTreeNode|undefined} nextNode
     * @param {string} routeId
     * @param {!Context} context
     * @return {!Promise<void>}
     */
    async routeExit(currentNode, nextNode, routeId, context) {
      await removeRouteNode(currentNode)
    }
  }

  return BasicRouting;
}

//exporting BasicRoutingInterface for backward compatibility - don't break consumer imports
export { routingMixin as default, BasicRoutingInterface };
