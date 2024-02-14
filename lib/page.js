/**
 * @license Copyright (c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
 * Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {pathToRegexp} from 'path-to-regexp';

/**
 * Short-cuts for global-object checks
 */
const hasDocument = ('undefined' !== typeof document);
const hasWindow = ('undefined' !== typeof window);
const hasHistory = ('undefined' !== typeof history);
const hasProcess = typeof process !== 'undefined';

/**
 * Detect click event
 */
const clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

/**
 * To work properly with the URL
 * history.location generated polyfill in https://github.com/devote/HTML5-History-API
 */
const isLocation = hasWindow && !!(/** @type {?} */ (window.history).location || window.location);

/**
 * @typedef {{
 *     window: (Window|undefined),
 *     decodeURLComponents: (boolean|undefined),
 *     popstate: (boolean|undefined),
 *     click: (boolean|undefined),
 *     hashbang: (boolean|undefined),
 *     dispatch: (boolean|undefined)
 * }}
 */
let PageOptions;

/** @typedef {function(!Context, function(...?):?):?} */
let PageCallback;

/** The page instance */
export class Page {
  constructor() {
    // public things
    /** @type {!Array<!PageCallback>} */
    this.callbacks = [];
    /** @type {!Array<!PageCallback>} */
    this.exits = [];
    this.current = '';
    this.len = 0;
    /** @type {!Context} */
    this.prevContext;

    // private things
    this._decodeURLComponents = true;
    this._base = '';
    this._strict = false;
    this._running = false;
    this._hashbang = false;

    // bound functions
    this.clickHandler = this.clickHandler.bind(this);
    this._onpopstate = this._onpopstate.bind(this);

    /** @type {!Window|undefined} */
    this._window = (hasWindow ? window : undefined);
    this._decodeURLComponents = true;
    this._popstate = true;
    this._click = true;
    this._hashbang = false;
  }

  /**
   * Configure the instance of page. This can be called multiple times.
   *
   * @param {PageOptions=} options
   */
  configure(options) {
    const opts = options || /** @type {!PageOptions} */ ({});

    this._window = opts.window || (hasWindow ? window : undefined);
    this._decodeURLComponents = opts.decodeURLComponents !== false;
    this._popstate = opts.popstate !== false && hasWindow;
    this._click = opts.click !== false && hasDocument;
    this._hashbang = !!opts.hashbang;

    const _window = this._window;
    if (this._popstate) {
      _window.addEventListener('popstate', this._onpopstate, false);
    } else if (hasWindow) {
      _window.removeEventListener('popstate', this._onpopstate, false);
    }

    if (this._click) {
      _window.document.addEventListener(clickEvent, this.clickHandler, false);
    } else if (hasDocument) {
      _window.document.removeEventListener(clickEvent, this.clickHandler, false);
    }

    if (this._hashbang && hasWindow && !hasHistory) {
      _window.addEventListener('hashchange', this._onpopstate, false);
    } else if (hasWindow) {
      _window.removeEventListener('hashchange', this._onpopstate, false);
    }
  }

  /**
   * Get or set basepath to `path`.
   *
   * @param {string} path
   */
  base(path) {
    if (0 === arguments.length) {
      return this._base;
    }
    this._base = path;
  }

  /**
   * Gets the `base`, which depends on whether we are using History or
   * hashbang routing.
   */
  _getBase() {
    let base = this._base;
    if (!!base) {
      return base;
    }
    const loc = hasWindow && this._window && this._window.location;

    if (hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
      base = loc.pathname;
    }

    return base;
  }

  /**
   * Get or set strict path matching to `enable`
   *
   * @param {boolean} enable
   */
  strict(enable) {
    if (0 === arguments.length) {
      return this._strict;
    }
    this._strict = enable;
  }


  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {PageOptions=} options
   */
  start(options) {
    const opts = options || /** @type {!PageOptions} */ ({});
    this.configure(opts);

    if (false === opts.dispatch) {
      return;
    }
    this._running = true;

    let url;
    if (isLocation) {
      const window = this._window;
      const loc = window.location;

      if (this._hashbang && ~loc.hash.indexOf('#!')) {
        url = loc.hash.substr(2) + loc.search;
      } else if (this._hashbang) {
        url = loc.search + loc.hash;
      } else {
        url = loc.pathname + loc.search + loc.hash;
      }
    }

    this.replace(url, null, true, opts.dispatch);
  }

  /** Unbind click and popstate event handlers. */
  stop() {
    if (!this._running) {
      return;
    }
    this.current = '';
    this.len = 0;
    this._running = false;

    const window = this._window;
    this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
    hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
    hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
  }

  /**
   * Show `path` with optional `state` object.
   *
   * @param {string} path
   * @param {Object=} state
   * @param {boolean=} dispatch
   * @param {boolean=} push
   * @return {!Promise<!Context>}
   */
  async show(path, state, dispatch, push) {
    const ctx = new Context(path, state, this);
    const prev = this.prevContext;
    this.prevContext = ctx;
    this.current = ctx.path;
    if (false !== dispatch) {
      await this.dispatch(ctx, prev);
    }
    if (false !== ctx.handled && false !== push) {
      ctx.pushState();
    }
    return ctx;
  }

  /**
   * Goes back in the history
   * Back should always let the current route push state and then go back.
   *
   * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
   * @param {Object=} state
   */
  back(path, state) {
    const page = this;
    if (this.len > 0) {
      const window = this._window;
      // this may need more testing to see if all browsers
      // wait for the next tick to go back in history
      hasHistory && window.history.back();
      this.len--;
    } else if (path) {
      setTimeout(function () {
        page.show(path, state);
      });
    } else {
      setTimeout(function () {
        page.show(page._getBase(), state);
      });
    }
  }

  /**
   * Register route to redirect from one path to other
   * or just redirect to another route
   *
   * @param {string} from - if param 'to' is undefined redirects to 'from'
   * @param {string=} to
   */
  redirect(from, to) {
    // Define route from a path to another
    if ('string' === typeof from && 'string' === typeof to) {
      this.register(from,  (e) => {
        setTimeout(() => {
          this.replace(/** @type {!string} */ (to));
        }, 0);
      });
    }

    // Wait for the push state and replace it with another
    if ('string' === typeof from && 'undefined' === typeof to) {
      setTimeout(() => {
        this.replace(from);
      }, 0);
    }
  }

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {string|undefined} path
   * @param {*=} state
   * @param {boolean=} init
   * @param {boolean=} dispatch
   * @return {!Context}
   */
  replace(path, state, init, dispatch) {
    const ctx = new Context(path, state, this);
    const prev = this.prevContext;
    this.prevContext = ctx;
    this.current = ctx.path;
    ctx.init = init;
    ctx.save(); // save before dispatching, which may redirect
    if (false !== dispatch) {
      this.dispatch(ctx, prev);
    }
    return ctx;
  }

  /**
   * Dispatch the given `ctx`.
   *
   * @param {!Context} ctx
   * @param {!Context} prev
   */
  async dispatch(ctx, prev) {
    if (prev) {
      // Exit callbacks
      for (const fn of this.exits) {
        await new Promise((resolve) => fn(prev, resolve));
      }
    }
    // Entry callbacks
    for (const fn of this.callbacks) {
      if (ctx.path !== this.current) {
        ctx.handled = false;
      }
      await new Promise((resolve) => fn(ctx, resolve));
    }
    unhandled.call(this, ctx);
  }

  /**
   * Register an exit route on `path` with
   * callback `fn()`, which will be called
   * on the previous context when a new
   * page is visited.
   *
   * @param {!string|!PageCallback} path
   * @param {!PageCallback} fn
   * @param {...!PageCallback} fns
   */
  exit(path, fn, ...fns) {
    if (typeof path === 'function') {
      return this.exit('*', path);
    }

    const callbacks = [fn].concat(fns);
    const route = new Route(path, null, this);
    for (let i = 0; i < callbacks.length; ++i) {
      this.exits.push(route.middleware(callbacks[i]));
    }
  }

  /**
   * Handle "click" events.
   * @param {!Event} evt
   */
  clickHandler(evt) {
    const e = /** @type {!MouseEvent} */ (evt);
    if (1 !== this._which(e)) {
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
    let el = /** @type {!HTMLElement} */ (e.target);
    if ((el.nodeName || '').toUpperCase() !== 'A') {
      const composedPath = e.composedPath();
      for (let i = 0; i < composedPath.length; i++) {
        el = /** @type {!HTMLElement} */ (composedPath[i]);
        // el.nodeName for svg links are 'a' instead of 'A'
        if ((el.nodeName || '').toUpperCase() === 'A') {
          break;
        }
      }
    }

    if (!el || (el.nodeName || '').toUpperCase() !== 'A') {
      return;
    }
    let anchor = /** @type {!HTMLAnchorElement} */ (el);
    const svgAnchor = /** @type {!SVGAElement} */ (/** @type {?} */ (el));

    // check if link is inside an svg
    // in this case, both href and target are always inside an object
    const svg = (typeof svgAnchor.href === 'object') && svgAnchor.href.constructor.name === 'SVGAnimatedString';

    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (anchor.hasAttribute('download') || anchor.getAttribute('rel') === 'external') {
      return;
    }

    // ensure non-hash for the same path
    const link = anchor.getAttribute('href');
    if (!this._hashbang && this._samePath(anchor) && (anchor.hash || '#' === link)) {
      return;
    }

    // Check for mailto: in the href
    if (link && link.indexOf('mailto:') > -1) {
      return;
    }

    // check target
    // svg target is an object and its desired value is in .baseVal property
    if (svg ? svgAnchor.target.baseVal : svgAnchor.target) {
      return;
    }

    // x-origin
    // note: svg links that are not relative don't call click events (and skip page.js)
    // consequently, all svg links tested inside page.js are relative and in the same origin
    if (!svg && !this.sameOrigin(anchor.href)) {
      return;
    }

    // rebuild path
    // There aren't .pathname and .search properties in svg links, so we use href
    // Also, svg href is an object and its desired value is in .baseVal property
    let path = svg ? svgAnchor.href.baseVal : (anchor.pathname + anchor.search + (anchor.hash || ''));

    path = path[0] !== '/' ? '/' + path : path;

    // strip leading "/[drive letter]:" on NW.js on Windows
    if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
      path = path.replace(/^\/[a-zA-Z]:\//, '/');
    }

    // same page
    const orig = path;
    const pageBase = this._getBase();

    if (path.indexOf(pageBase) === 0) {
      path = path.substr(pageBase.length);
    }

    if (this._hashbang) {
      path = path.replace('#!', '');
    }

    if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
      return;
    }

    e.preventDefault();
    this.show(orig);
  }

  /**
   * Event button.
   */
  _which(e) {
    e = e || (hasWindow && this._window.event);
    return null == e.which ? e.button : e.which;
  }

  /**
   * Convert to a URL object
   */
  _toURL(href) {
    const window = this._window;
    if (typeof URL === 'function' && isLocation) {
      return new URL(href, window.location.toString());
    } else if (hasDocument) {
      const anc = window.document.createElement('a');
      anc.href = href;
      return anc;
    }
  }

  /**
   * Check if `href` is the same origin.
   * @param {string} href
   */
  sameOrigin(href) {
    if (!href || !isLocation) {
      return false;
    }

    const url = this._toURL(href);
    const window = this._window;

    const loc = window.location;


    // When the port is the default http port 80 for http, or 443 for
    // https, internet explorer 11 returns an empty string for loc.port,
    // so we need to compare loc.port with an empty string if url.port
    // is the default port 80 or 443.
    // Also the comparition with `port` is changed from `===` to `==` because
    // `port` can be a string sometimes. This only applies to ie11.
    return loc.protocol === url.protocol &&
      loc.hostname === url.hostname &&
      (loc.port === url.port || loc.port === '' && (url.port == '80' || url.port == '443'));
  }

  _samePath(url) {
    if (!isLocation) {
      return false;
    }
    const window = this._window;
    const loc = window.location;
    return url.pathname === loc.pathname &&
      url.search === loc.search;
  }

  /**
   * Remove URL encoding from the given `str`.
   * Accommodates whitespace in both x-www-form-urlencoded
   * and regular percent-encoded form.
   *
   * @param {string} val - URL component to decode
   */
  _decodeURLEncodedURIComponent(val) {
    if (typeof val !== 'string') {
      return val;
    }
    return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
  }

  /**
   * Register `path` with callback `fn()`
   *
   *   page.register('*', fn);
   *   page.register('/user/:id', load, user);
   *
   * @param {string} path
   * @param {!PageCallback} fn
   * @param {...!PageCallback} fns
   */
  register(path, fn, ...fns) {
    const route = new Route(/** @type {string} */ (path), null, this);
    const callbacks = [fn].concat(fns);
    for (let i = 0; i < callbacks.length; ++i) {
      this.callbacks.push(route.middleware(callbacks[i]));
    }
  }
}

/** Handle "popstate" events. */
Page.prototype._onpopstate = (function () {
  let loaded = false;
  if (!hasWindow) {
    return function () {};
  }
  if (hasDocument && document.readyState === 'complete') {
    loaded = true;
  } else {
    const loadFn = function () {
      setTimeout(function () {
        loaded = true;
      }, 0);
      window.removeEventListener('load', loadFn);
    };
    window.addEventListener('load', loadFn);
  }

  /**
   * @this {!Page}
   * @param {!Event} evt
   */
  function onpopstate(evt) {
    const e = /** @type {!PopStateEvent} */ (evt);
    if (!loaded) {
      return;
    }
    const page = this;
    if (e.state) {
      const path = e.state.path;
      page.replace(path, e.state);
    } else if (isLocation) {
      const loc = page._window.location;
      page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
    }
  }
  return onpopstate;
})();

/**
 * Unhandled `ctx`. When it's not the initial
 * popstate then redirect. If you wish to handle
 * 404s on your own use `page.register('*', callback)`.
 *
 * @param {Context} ctx
 * @this {!Page}
 */
function unhandled(ctx) {
  if (ctx.handled) {
    return;
  }
  let current;
  const page = this;
  const window = page._window;

  if (page._hashbang) {
    current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
  } else {
    current = isLocation && window.location.pathname + window.location.search;
  }

  if (current === ctx.canonicalPath) {
    return;
  }
  page.stop();
  ctx.handled = false;
  const url = new URL(ctx.canonicalPath, window.location.origin);
  if (isLocation) {
    if (url.origin === window.location.origin) {
      window.location.href = url.toString();
    } else {
      console.error('Cross domain route change prevented');
    }
  }
}

/**
 * Escapes RegExp characters in the given string.
 *
 * @param {string} s
 */
function escapeRegExp(s) {
  return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
}

export class Context {
  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {string|undefined} path
   * @param {*=} state
   * @param {!Page=} pageInstance
   */
  constructor(path, state, pageInstance) {
    if (!pageInstance) {
      pageInstance = new Page();
      pageInstance.configure();
    }
    const _page = this.page = pageInstance;
    const window = _page._window;
    const hashbang = _page._hashbang;

    const pageBase = _page._getBase();
    if ('/' === path[0] && 0 !== path.indexOf(pageBase)) {
      path = pageBase + (hashbang ? '#!' : '') + path;
    }
    const i = path.indexOf('?');

    this.canonicalPath = path;
    const re = new RegExp('^' + escapeRegExp(pageBase));
    this.path = path.replace(re, '') || '/';
    if (hashbang) {
      this.path = this.path.replace('#!', '') || '/';
    }

    this.title = (hasDocument ? window.document.title : undefined);
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
    this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
    /** @type {!Object<string, string>} */
    this.params = {};
    this.query = new URLSearchParams(this.querystring);

    // fragment
    this.hash = '';
    if (!hashbang) {
      if (!~this.path.indexOf('#')) {
        return;
      }
      const parts = this.path.split('#');
      this.path = this.pathname = parts[0];
      this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
      this.querystring = this.querystring.split('#')[0];
    }
    this.handled = false;
    /** @type {boolean|undefined} */
    this.init;
    /** @type {string|undefined} */
    this.routePath;
  }

  /** Push state. */
  pushState() {
    const page = this.page;
    const window = page._window;
    const hashbang = page._hashbang;

    page.len++;
    if (hasHistory) {
      window.history.pushState(this.state, this.title || '',
        hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
    }
  }

  /** Save the context state. */
  save() {
    const page = this.page;
    if (hasHistory) {
      page._window.history.replaceState(this.state, this.title || '',
        page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
    }
  }
}

export class Route {
  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {string} path
   * @param {Object=} options
   * @param {!Page=} page
   */
  constructor(path, options, page) {
    const _page = this.page = page || new Page();
    const opts = options || {};
    opts.strict = opts.strict || _page._strict;
    this.path = (path === '*') ? '(.*)' : path;
    this.method = 'GET';
    this.regexp = pathToRegexp(this.path, this.keys = [], opts);
  }

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {!PageCallback} fn
   * @return {!PageCallback}
   */
  middleware(fn) {
    /**
     * @param {!Context} ctx
     * @param {function():?} next
     */
    const callback = (ctx, next) => {
      if (this.match(ctx.path, ctx.params)) {
        ctx.routePath = this.path;
        return fn(ctx, next);
      }
      next();
    };
    return callback;
  }

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {string} path
   * @param {Object} params
   * @return {boolean}
   */
  match(path, params) {
    const keys = this.keys;
    const qsIndex = path.indexOf('?');
    const pathname = ~qsIndex ? path.slice(0, qsIndex) : path;
    const m = this.regexp.exec(decodeURIComponent(pathname));

    if (!m) {
      return false;
    }

    delete params[0];

    for (let i = 1, len = m.length; i < len; ++i) {
      let key = keys[i - 1];
      let val = this.page._decodeURLEncodedURIComponent(m[i]);
      if (val !== undefined || !(Object.hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }

    return true;
  }
}
