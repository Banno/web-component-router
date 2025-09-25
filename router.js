/**
 * @fileoverview Router for banno web.
 *
 * Page.js is used to parse route paths and invoke callbacks
 * when routes are entered or exited. This class provides
 * support for storing the routing tree and registering the
 * route callbacks with Page.js.
 *
 * Routes should form a tree. Example:
 *
 *      _Root_
 *     /      \
 *    A       D
 *   / \       \
 *  B  C       E
 */

/**
 * @typedef {{
 *  id: string,
 *  tagName: string,
 *  path: string,
 *  params: (Array<string>|undefined),
 *  authenticated: (boolean|undefined),
 *  subRoutes: (Array<RouteConfig>|undefined),
 *  beforeEnter: (function():Promise),
 *  metaData: (Object<string, *>|undefined)
 * }} RouteConfig
 */
let RouteConfig;

import {Context, Page} from './lib/page.js';
import RouteTreeNode from './lib/route-tree-node.js';
import routingMixin from './lib/routing-mixin.js';
import animatedRoutingMixin from './lib/animated-routing-mixin.js';
import BasicRoutingInterface from './lib/routing-interface.js';
import RouteData from './lib/route-data.js';

class Router {
  static instance_ /** @type {Router}*/ = null;

  /** @param {RouteConfig=} routeConfig */
  constructor(routeConfig) {
    if (Router.instance_ !== null) {
      return Router.instance_;
    }
    Router.instance_ = this;
    /** @type {string|undefined} */
    this.currentNodeId_;

    /** @type {string|undefined} */
    this.prevNodeId_;

    /** @type {!RouteTreeNode|undefined} */
    this.routeTree_ = routeConfig ? this.buildRouteTree(routeConfig) : undefined;

    this.nextStateWasPopped = false;

    // Uses the capture phase so that this executes before the page.js handler
    window.addEventListener('popstate', (evt) => {
      this.nextStateWasPopped = true;
    }, true);

    /** @type {!Set<!function():?>} */
    this.routeChangeStartCallbacks_ = new Set();
    /** @type {!Set<!function(!Error=):?>} */
    this.routeChangeCompleteCallbacks_ = new Set();

    this.page = new Page();
  }

  /** @return {Router} */
  static get instance() {
    if (!Router.instance_) {
      throw new Error('Router has not been initialized.');
    }
    return Router.instance_;
  }

  /** @return {!RouteTreeNode|undefined} */
  get routeTree() {
    return this.routeTree_;
  }

  /** @param {!RouteTreeNode|undefined} root */
  set routeTree(root) {
    this.routeTree_ = root;
  }

  /** @return {string|undefined} */
  get currentNodeId() {
    return this.currentNodeId_;
  }

  /** @return {string|undefined} */
  get prevNodeId() {
    return this.prevNodeId_;
  }

  /** @param {!RouteConfig} routeConfig */
  buildRouteTree(routeConfig) {
    const authenticated = [true, false].includes(routeConfig.authenticated) ?  routeConfig.authenticated : true;
    const node = new RouteTreeNode(new RouteData(routeConfig.id, routeConfig.tagName, routeConfig.path, routeConfig.params || [], authenticated, routeConfig.beforeEnter, routeConfig.metaData || {}));
    if (routeConfig.subRoutes) {
      routeConfig.subRoutes.forEach(route => {
        node.addChild(this.buildRouteTree(route));
      });
    }
    return node;
  }

  /**
   * Build the routing tree and begin routing
   * @return {!Promise<undefined>}
   */
  async start() {
    this.registerRoutes_();

    document.addEventListener('tap', this.page.clickHandler.bind(this.page), false);
    document.addEventListener('click', this.page.clickHandler.bind(this.page), false);

    return this.page.start({
      click: false,
      popstate: true,
      hashbang: false,
      decodeURLComponents: true,
      window: undefined,
      dispatch: undefined
    });
  }

  /**
   * Navigate to the specified route
   * @param {string} path
   * @param {Object=} params Values to use for named & query parameters
   * @returns {!Promise<!Context>}
   */
  async go(path, params) {
    path = this.url(path, params);
    return this.page.show(path);
  }

  /**
   * Navigate to the specified route, but replace the current history event with the new one
   * @param {string} path
   * @param {Object=} params Values to use for named & query parameters
   *   NOTE: You must quote the properties so that Closure Compiler does not rename them!
   * @return {!Promise<!Context>}
   */
  async redirect(path, params) {
    path = this.url(path, params);
    return this.page.replace(path);
  }

  /**
   * Return the path for the specified route
   * @param {string} path
   * @param {Object=} params Values to use for named & query parameters
   *   NOTE: You must quote the properties so that Closure Compiler does not rename them!
   * @return {string}
   */
  url(path, params) {
    const paramPattern = [
      ':[a-zA-Z]+', // param name
      '(\\([^)]*\\))?', // optional parens with stuff inside
      '\\??', // optional question mark
      '(/|$)', // slash separator or end of string
    ];

    // Replace params with their values.
    if (params) {
      path = Object.entries(params).reduce((currentPath, [key, val]) => {
        const pattern = paramPattern.slice(0); // clone the original pattern
        pattern[0] = `:${key}`;
        const pathMatcher = new RegExp(pattern.join(''));
        if (pathMatcher.test(currentPath)) {
          // Found the param in the path. Replace it with the given value.
          currentPath = currentPath.replace(pathMatcher, `${val}$2`);
        } else {
          // Append the param as a query parameter.
          const delimiter = currentPath.includes('?') ? '&' : '?';
          currentPath += `${delimiter}${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
        }
        return currentPath;
      }, path);
    }

    // Remove any optional params that don't have values.
    paramPattern[2] = '\\?'; // not optional for this test
    path = path.replace(new RegExp(paramPattern.join(''), 'g'), '');

    return path;
  }

  /**
   * Register an exit callback to be invoked on every route change
   * @param {function(!Context, function(boolean=):?):?} callback
   */
  addGlobalExitHandler(callback) {
    this.page.exit('*', callback);
  }

  /**
   * Register an exit callback for a particular route
   * @param {!string} route
   * @param {function(!Context, function(boolean=):?):?} callback
   */
  addExitHandler(route, callback) {
    this.page.exit(route, callback);
  }

  /**
   * Register an entry callback for a particular route
   * @param {!string} route
   * @param {function(!Context, function(boolean=):?):?} callback
   */
  addRouteHandler(route, callback) {
    this.page.register(route, callback);
  }

  /** @param {!function():?} callback */
  addRouteChangeStartCallback(callback) {
    this.routeChangeStartCallbacks_.add(callback);
  }

  /** @param {!function():?} callback */
  removeRouteChangeStartCallback(callback) {
    this.routeChangeStartCallbacks_.delete(callback);
  }

  /** @param {!function(!Error=):?} callback */
  addRouteChangeCompleteCallback(callback) {
    this.routeChangeCompleteCallbacks_.add(callback);
  }

  /** @param {!function(!Error=):?} callback */
  removeRouteChangeCompleteCallback(callback) {
    this.routeChangeCompleteCallbacks_.delete(callback);
  }

  /**
   * Walk the route tree and register route nodes with
   * the Page.js router.
   *
   * @private
   */
  registerRoutes_() {
    this.routeTree_.traverse((node) => {
      if (node === null) {
        return;
      }

      const routeData = node.getValue();

      // Routes with zero-length paths have no direct routes.
      // They only exist to wrap sub-routes.
      if (routeData.path.length === 0) {
        return;
      }

      this.page.register(routeData.path, this.routeChangeCallback_.bind(this, node));
    });
  }

  /**
   * @param {!RouteTreeNode} routeTreeNode
   * @param {!Context} context
   * @param {function():?} next
   * @private
   */
  async routeChangeCallback_(routeTreeNode, context, next) {
    for (const cb of this.routeChangeStartCallbacks_) {
      cb();
    }
    this.prevNodeId_ = this.currentNodeId_;
    this.currentNodeId_ = routeTreeNode.getKey();
    /** @type {!Error|undefined} */
    let routeError;
    try {
      await routeTreeNode.activate(this.prevNodeId, context);
    } catch (err) {
      routeError = err;
    }
    next();
    this.nextStateWasPopped = false;
    for (const cb of this.routeChangeCompleteCallbacks_) {
      cb(routeError);
    }
  }

  /**
   * Replace route path param values with their param name
   * for analytics tracking
   *
   * @param {!Context} context route enter context
   * @return {!string}
   */
  getRouteUrlWithoutParams(context) {
    const segments = context.path.split('/');
    const params = {};

    // flip the keys and values of the params
    for (const param in context.params) {
      if (context.params.hasOwnProperty(param)) {
        params[context.params[param]] = param;
      }
    }

    for (let i = 0; i < segments.length; i++) {
      if (segments[i] in params) {
        segments[i] = params[segments[i]];
      }
    }

    return segments.join('/');
  }
}

export default Router;
export {animatedRoutingMixin, BasicRoutingInterface, Context, RouteData, RouteTreeNode, routingMixin};