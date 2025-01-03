/** @fileoverview Basic data for a route */

class RouteData {
  /**
   * @param {string} id of this route
   * @param {string} tagName of the element
   * @param {string} path of this route
   * @param {!Array<string>=} namedParameters list in camelCase. Will be
   *     converted to a map of camelCase and hyphenated.
   * @param {boolean=} requiresAuthentication
   * @param {function():Promise=} beforeEnter
   */
  constructor(id, tagName, path, namedParameters, requiresAuthentication, beforeEnter) {
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

    this.beforeEnter = beforeEnter || (() => Promise.resolve());
  }
}

export default RouteData;
