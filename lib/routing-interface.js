import RouteTreeNode from './route-tree-node.js';
import {Context} from './page.js';

/**
 * @callback RouteEnterFunction
 * @param {!RouteTreeNode} currentNode
 * @param {!RouteTreeNode|undefined} nextNodeIfExists
 * @param {string} routeId
 * @param {!Context} context
 * @return {!Promise<boolean|void>}
 */

/**
 * @callback RouteExitFunction
 * @param {!RouteTreeNode} currentNode
 * @param {!RouteTreeNode|undefined} nextNode
 * @param {string} routeId
 * @param {!Context} context
 * @return {!Promise<void>}
 * /

/** @interface */
class BasicRoutingInterface {
  /** @type {RouteEnterFunction} */
  async routeEnter(currentNode, nextNodeIfExists, routeId, context) { }

  /** @type {RouteExitFunction} */
  async routeExit(currentNode, nextNode, routeId, context) { }
};

export {BasicRoutingInterface as default};
