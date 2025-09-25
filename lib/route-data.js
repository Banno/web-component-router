import RouteTreeNode from './route-tree-node.js';
import {Context} from './page.js';

 /**
  * @callback BeforeEnter
  * @param {!RouteTreeNode} currentNode
  * @param {!RouteTreeNode|undefined} nextNodeIfExists
  * @param {string} routeId
  * @param {!Context} context
  * @return {!Promise<boolean|void>}
  */

/** @fileoverview Basic data for a route */
class RouteData {
  /**
   * @param {string} id of this route
   * @param {string} tagName of the element
   * @param {string} path of this route
   * @param {!Array<string>=} namedParameters list in camelCase. Will be
   *     converted to a map of camelCase and hyphenated.
   * @param {boolean=} requiresAuthentication
   * @param {BeforeEnter=} beforeEnter
   * @param {!Object<string, *>=} metaData optional metadata associated with this route
   */
  constructor(id, tagName, path, namedParameters, requiresAuthentication, beforeEnter, metaData = {}) {
    namedParameters = namedParameters || [];
    /** @type {!Object<string, string>} */
    const params = {};
    const camelMatch = /[A-Z]/g;
    const camelMatchReplacer = (match) => `-${match.toLowerCase()}`;

    for (let i = 0; i < namedParameters.length; i++) {
      params[namedParameters[i]] = namedParameters[i].replace(camelMatch, camelMatchReplacer);
    }

    this.id = id;
    this.tagName = tagName;
    this.path = path;
    this.attributes = params;
    this.metaData = metaData;
    /** @type {!Element|undefined} */
    this.element = undefined;
    this.requiresAuthentication = requiresAuthentication !== false;

    /** @type {!BeforeEnter} */
    this.beforeEnter = beforeEnter || ((currentNode, nextNodeIfExists, routeId, context) => Promise.resolve());
  }
}

export default RouteData;
