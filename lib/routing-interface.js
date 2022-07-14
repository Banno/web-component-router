import RouteTreeNode from './route-tree-node.js';
import {Context} from './page.js';

/** @interface */
class BasicRoutingInterface {
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
  async routeEnter(currentNode, nextNodeIfExists, routeId, context) { }

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
  async routeExit(currentNode, nextNode, routeId, context) { }
};

export {BasicRoutingInterface as default};
