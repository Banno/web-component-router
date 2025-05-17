/** @fileoverview Basic data for a route */
/**
 * @callback BeforeEnterFunction
 * @param {!Object} currentNode - The current route node.
 * @param {(Object|undefined)} nextNodeIfExists - The next route node, if one exists.
 * @param {string} routeId - The ID of the route being entered.
 * @param {!Object} context - A context object, potentially containing shared state or utilities.
 * @returns {Promise<boolean|void>} Should return a Promise.
 * Resolves to `true` or `void` to allow navigation.
 * Resolves to `false` to prevent navigation.
 *
 * Defines the signature for the beforeEnter lifecycle hook.
 */
/**
 * @callback RouteEnterFunction
 * @param {!Object} currentNode - The current route node.
 * @param {(Object|undefined)} nextNodeIfExists - The next route node, if one exists.
 * @param {string} routeId - The ID of the route being entered.
 * @param {!Object} context - A context object, potentially containing shared state or utilities.
 * @returns {Promise<boolean|void>} Should return a Promise.
 * Resolves to `true` or `void` to allow navigation.
 * Resolves to `false` to prevent navigation.
 *
 * Defines the signature for the routeEnter lifecycle hook.
 */
/**
 * @callback RouteExitFunction
 * @param {!Object} currentNode - The current route node.
 * @param {(Object|undefined)} nextNode - The next route node, if one exists.
 * @param {string} routeId - The ID of the route being entered.
 * @param {!Object} context - A context object, potentially containing shared state or utilities.
 * @returns {Promise<boolean|void>} Should return a Promise.
 * Resolves to `true` or `void` to allow navigation.
 * Resolves to `false` to prevent navigation.
 *
 * Defines the signature for the routeEnter lifecycle hook.
 */
class RouteData {
  /**
   * @param {string} id of this route
   * @param {string} tagName of the element
   * @param {string} path of this route
   * @param {!Array<string>=} namedParameters list in camelCase. Will be
   *     converted to a map of camelCase and hyphenated.
   * @param {boolean=} requiresAuthentication
   * @param {BeforeEnterFunction=} beforeEnter Function to execute before the route is entered.
   * @param {RouteEnterFunction=} routeEnter Function to execute when the route is entered.
   * @param {RouteExitFunction=} routeExit Function to execute when the route is exited.
   */

  constructor(id, tagName, path, namedParameters, requiresAuthentication, beforeEnter, routeEnter, routeExit) {
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

    /** @type {!Element|undefined} */
    this.element = undefined;
    this.requiresAuthentication = requiresAuthentication !== false;

    /**
     * The function to execute before entering the route.
     * @type {BeforeEnterFunction}
     */
    this.beforeEnter = beforeEnter || ((currentNode, nextNodeIfExists, routeId, context) => Promise.resolve());

    /**
     * The function to execute before entering the route.
     * @type {RouteExitFunction}
     */
    this.routeEnter = routeEnter || ((currentNode, nextNodeIfExists, routeId, context) => Promise.resolve());

    /**
     * The function to execute before entering the route.
     * @type {RouteExitFunction}
     */
    this.routeExit = routeExit || ((currentNode, nextNode, routeId, context) => Promise.resolve());
  }
}

export default RouteData;
