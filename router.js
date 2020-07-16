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

import pageJs from 'page';
import qsParse from 'qs/lib/parse.js';
import RouteTreeNode from './lib/route-tree-node.js';

/**
 * @param {!URL|!HTMLAnchorElement} url
 * @return {!{
 *   protocol: string,
 *   hostname: string,
 *   port: string
 * }}
 */
function urlParts(url) {
  const parts = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port
  };
  if (url.port.trim().length > 0) {
    parts.port = url.port;
  } else if (/^https:$/i.test(url.protocol)) {
    parts.port = '443';
  } else if (/^http:$/i.test(url.protocol)) {
    parts.port = '80';
  }
  return parts;
}

/**
 * @param {string} href1
 * @param {string} href2
 * @return {boolean}
 */
function compareOrigins(href1, href2) {
  const url1 = urlParts(new URL(href1, location.toString()));
  const url2 = urlParts(new URL(href2, location.toString()));
  return url1.protocol === url2.protocol &&
      url1.hostname === url2.hostname &&
      url1.port === url2.port;
}

class Router {
  constructor() {
    /** @type {string|undefined} */
    this.currentNodeId_;

    /** @type {string|undefined} */
    this.prevNodeId_;

    /** @type {!RouteTreeNode|undefined} */
    this.routeTree_;

    this.nextStateWasPopped = false;

    // Uses the capture phase so that this executes before the page.js handler
    window.addEventListener('popstate', (evt) => {
      this.nextStateWasPopped = true;
    }, true);

    /** @type {!Set<!function()>} */
    this.routeChangeStartCallbacks_ = new Set();
    /** @type {!Set<!function(!Error=)>} */
    this.routeChangeCompleteCallbacks_ = new Set();
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

  /**
   * Build the routing tree and begin routing
   * @return {undefined}
   */
  start() {
    this.registerRoutes_();

    document.addEventListener('tap', Router.navigationEvent_, false);
    document.addEventListener('click', Router.navigationEvent_, false);

    pageJs.start({
      click: false,
      popstate: true,
      hashbang: false,
      decodeURLComponents: true
    });
  }

  /**
   * Navigate to the specified route
   * @param {string} path
   * @param {Object=} params Values to use for named & query parameters
   */
  go(path, params) {
    path = this.url(path, params);
    pageJs.show(path);
  }

  /**
   * Navigate to the specified route, but replace the current history event with the new one
   * @param {string} path
   * @param {Object=} params Values to use for named & query parameters
   *   NOTE: You must quote the properties so that Closure Compiler does not rename them!
   */
  redirect(path, params) {
    path = this.url(path, params);
    pageJs.replace(path);
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
   * @param {function(!pageJs.Context, function(boolean=))} callback
   */
  addGlobalExitHandler(callback) {
    pageJs.exit('*', callback);
  }

  /**
   * Register an exit callback for a particular route
   * @param {!string} route
   * @param {function(!pageJs.Context, function(boolean=))} callback
   */
  addExitHandler(route, callback) {
    pageJs.exit(route, callback);
  }

  /**
   * Register an entry callback for a particular route
   * @param {!string} route
   * @param {function(!pageJs.Context, function(boolean=))} callback
   */
  addRouteHandler(route, callback) {
    pageJs(route, callback);
  }

  /** @param {!function()} callback */
  addRouteChangeStartCallback(callback) {
    this.routeChangeStartCallbacks_.add(callback);
  }

  /** @param {!function()} callback */
  removeRouteChangeStartCallback(callback) {
    this.routeChangeStartCallbacks_.delete(callback);
  }

  /** @param {!function(!Error=)} callback */
  addRouteChangeCompleteCallback(callback) {
    this.routeChangeCompleteCallbacks_.add(callback);
  }

  /** @param {!function(!Error=)} callback */
  removeRouteChangeCompleteCallback(callback) {
    this.routeChangeCompleteCallbacks_.delete(callback);
  }

  /**
   * A modified copy of the pagejs onclick function.
   * Properly handles Polymer "tap" events.
   *
   * @param {!Event} e
   */
  static navigationEvent_(e) {
    if (e.type !== 'tap' && (e.which === null ? e.button : e.which) !== 1) {
      return;
    }

    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      return;
    }
    if (e.defaultPrevented) {
      return;
    }

    // ensure link
    // use shadow dom when available
    let el = e.target;
    if (el.nodeName !== 'A') {
      const composedPath = e.composedPath();
      for (let i = 0; i < composedPath.length; i++) {
        el = composedPath[i];
        if (el.nodeName === 'A') {
          break;
        }
      }
    }

    if (!el || el.nodeName !== 'A') {
      return;
    }

    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') {
      return;
    }

    // ensure a href exists and non-hash for the same path
    const link = el.getAttribute('href');
    if (!link || ((el.pathname === location.pathname || el.pathname === '') && (el.hash || link === '#'))) {
      return;
    }

    // Check for mailto: in the href
    if (el.protocol && el.protocol.length > 0 && !/^https?:$/.test(el.protocol)) {
      return;
    }

    // check target
    if (el.target) {
      return;
    }

    // x-origin
    // IE anchor tags have default ports ":80", ":443", ete,
    // but the location url does not.
    // Normalize the location href and compare.
    if (!compareOrigins(location.href, el.href)) {
      return;
    }

    // rebuild path
    const path = el.pathname + el.search + (el.hash || '');

    /* If we ever support running the app in a subfolder, we'll need this block
    // same page
    var orig = path;

    let base = '';
    if (path.indexOf(base) === 0) {
      path = path.substr(base.length);
    }

    if (base && orig === path) {
      return;
    }
    */

    e.preventDefault();
    // pageJs.show(orig);
    pageJs.show(path);
  }

  /**
   * Adds the query parameters to the Page.js context.
   *
   * @param {!pageJs.Context} context
   * @param {function()} next
   * @private
   */
  parseQueryString_(context, next) {
    context.query = qsParse(context.querystring, {});
    next();
  }

  /**
   * Walk the route tree and register route nodes with
   * the Page.js router.
   *
   * @private
   */
  registerRoutes_() {
    pageJs('*', this.parseQueryString_);

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

      pageJs(routeData.path, this.routeChangeCallback_.bind(this, node));
    });
  }

  /**
   * @param {!RouteTreeNode} routeTreeNode
   * @param {!pageJs.Context} context
   * @param {function()} next
   * @private
   */
  async routeChangeCallback_(routeTreeNode, context, next) {
    this.routeChangeStartCallbacks_.forEach((cb) => cb());
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
    this.routeChangeCompleteCallbacks_.forEach((cb) => cb(routeError));
  }

  /**
   * Replace route path param values with their param name
   * for analytics tracking
   *
   * @param {!pageJs.Context} context route enter context
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
