# @jack-henry/web-component-router

Router for web-components based apps. The router creates a
dom node tree and assigns attributes to the nodes based on path segments.
When switching between routes, the router will re-use any element in
common between the trees and simply update the attributes of existing
elements. Elements should change/reset their state based solely off of
attributes.

By default, the router places child elements as the sole light-dom child
of the parent (all other nodes are removed). Elements can override the
`routeEnter` method functionality to customize this behavior.

## Installation

```
npm install @jack-henry/web-component-router
```

## Defining Routes

The router uses [Page.js](https://visionmedia.github.io/page.js/) internally
for route path definitions and callbacks. You must start by defining your
routes and route tree.

To create a tree you create `RouteTreeNodes` and add children.

```js
import RouteTreeNode from '@jack-henry/web-component-router/lib/route-tree-node.js';
const routeNode = new RouteTreeNode(data);
```

Each node requires a `RouteData` object to describe it.

```js
import RouteData from '@jack-henry/web-component-router/lib/route-data.js';
/**
 * @param {string} name of this route. Must be unique.
 * @param {string} tagName of the element. Case insensitive.
 * @param {string} path of this route (express style).
 *     Empty strings indicate abstract routes - they are not
 *     directly routable. Their callbacks are invoked and elements
 *     created when a child route is activated.
 * @param {!Array<string>=} namedParameters array in camelCase (optional).
 *     These should match to named path segments. Each camel case name
 *     is converted to a hyphenated name to be assigned to the element.
 * @param {boolean=} requiresAuthentication (optional - defaults true)
 * @param {function():(Promise<unknown>|undefined)=} beforeEnter Optionally allows you to dynamically import the component for a given route.  The route-mixin.js will call your beforeEnter on routeEnter if the component does not exist in the dom.
 */
const routeData = new RouteData(
    'Name of this route',
    'tag-name',
    '/path/:namedParameter',
    ['namedParameter'], // becomes attribute named-parameter="value"
    true,
    () => import('../tag-name.js'));
```

It is recommended to use enums and module imports to define the paths
and ids so the strings are maintainable.

**Example Routing Configuration**

```js
/**
 * @fileoverview
 *
 * Route tree definition
 *
 *           ___APP-ELEMENT___
 *          /                 \
 *     LOGIN-PAGE     ___MAIN-LAYOUT_____
 *                   /                   \
 *           MAIN-DASHBOARD         DETAIL-VIEW
 */

import {RouteData, RouteTreeNode} from '@jack-henry/web-component-router';

const dashboard = new RouteTreeNode(
    new RouteData('MainDashboard', 'MAIN-DASHBOARD', '/'));

const detailView = new RouteTreeNode(
    new RouteData('DetailView', 'DETAIL-VIEW', '/detail/:viewId', ['viewId']));

// This is an abstract route - you can't visit it directly.
// However it is part of the dom tree
const mainLayout = new RouteTreeNode(
    new RouteData('MainLayout', 'MAIN-LAYOUT', ''));

mainLayout.addChild(dashboard);
mainLayout.addChild(detailView);

// This is an abstract route - you can't visit it directly.
// However it is part of the dom tree
// It also does not require authentication to view
const app = new RouteTreeNode(
    new RouteData('App', 'APP-ELEMENT', '', [], false));

app.addChild(mainLayout);

const loginPage = new RouteTreeNode(
    new RouteData('Login', 'LOGIN-PAGE', '/login', [], false));

app.addChild(loginPage);

export default app;
```

### Defining a route configuration in the Router's constructor

Alternatively you can pass a `routeConfig` object when instantiating your router.  This will use the `RouteTreeNode` and `RouteData` to create your applications routeTree.

**Example RouteConfig object**
```
const routeConfig = {
    id: 'app',
    tagName: 'APP-MAIN',
    path: '',
    subRoutes: [{
        id: 'app-user',
        tagName: 'APP-USER-PAGE',
        path: '/users/:userId([0-9]{1,6})',
        params: ['userId'],
        beforeEnter: () => import('../app-user-page.js')
    }, {
        id: 'app-user-account',
        tagName: 'APP-ACCOUNT-PAGE',
        path: '/users/:userId([0-9]{1,6})/accounts/:accountId([0-9]{1,6})',
        params: ['userId', 'accountId'],
        beforeEnter: () => import('../app-account-page.js')
    }, {
      id: 'app-about',
      tagName: 'APP-ABOUT',
      path: '/about',
      authenticated: false,
      beforeEnter: () => import('../app-about.js')
    }]
};

const router = New Router(routeConfig);
```

When using this method the default is that a route requires authentication, as shown above in the 'about' route, set `authenticated` to false to create a route which does not require authentication.

## Redirecting

To programmatically redirect to a page, use `router.go()`:

```javascript
// Basic redirect; goes to the root page.
router.go('/');

// Specifies a value for named parameter in the path.
// NOTE: You must quote the properties so that Closure Compiler does not rename them!
router.go('/detail/:viewId', {'viewId': id});

// Adds a query parameter to the URL.
// NOTE: You must quote the properties so that Closure Compiler does not rename them!
router.go('/login', {'redirect': destAfterLogin});
```

**Note:** `router.go` usage can quickly become an anti pattern. Using proper HTML anchors with
hrefs is preferable. `router.go` should only be used when programatic route changes are strictly
required.

## Creating Routing Enabled Components

Components used with the router are expected to define two methods
which take the same arguments:

```js
class MyElement extends HtmlElement {
  /**
   * Implementation for the callback on entering a route node.
   * routeEnter is called for EVERY route change. If the node
   * is shared between the old and new routes, the element
   * will be re-used but have attributes updated here.
   *
   * @param {!RouteTreeNode} currentNode
   * @param {!RouteTreeNode|undefined} nextNodeIfExists - the
   *     child node of this route.
   * @param {string} routeId - unique name of the route
   * @param {!Context} context - page.js Context object
   * @return {!Promise<boolean=>}
   */
  async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
    // make sure to set this to indicate the route was recognized.
    context.handled = true;
    // do something with the node
    const currentElement = currentNode.getValue().element;
  }

  /**
   * Implementation for the callback on exiting a route node.
   * This method is ONLY called if this element is not being
   * used by the next route destination.
   *
   * @param {!RouteTreeNode} currentNode
   * @param {!RouteTreeNode|undefined} nextNode - parent node
   * @param {string} routeId - unique name of the route
   * @param {!Context} context - page.js Context object
   */
  async routeExit(currentNode, nextNode, routeId, context) {
    const currentElement = currentNode.getValue().element;

    // remove the element from the dom
    if (currentElement.parentNode) {
      currentElement.parentNode.removeChild(/** @type {!Element} */ (currentElement));
    }
    currentNode.getValue().element = undefined;
  }
}
```

Most elements will either use (or inherit) the default implementations.
Two mixins are provided to make this easy. When
using the mixin, `routeEnter` and `routeExit` methods are only need defined
when the default behavior needs modified. In most cases any overridden
method should do minimal work and call `super.routeEnter` or `super.routeExit`.

**Standard Routing Mixin**
```js
import routeMixin from '@jack-henry/web-component-router/routing-mixin.js';
class MyElement extends routeMixin(HTMLElement) { }
```

**Animated Routing Mixin**

The animated mixin applies a class to animated a node tree on entrance.
Exit animations are currently not supported.

```js
import animatedRouteMixin from '@jack-henry/web-component-router/animated-routing-mixin.js';
class MyElement extends animatedRouteMixin(HTMLElement, 'className') { }
```

## Root App Element

The routing configuration is typically defined inside the main app element
which should be defined as the root node of the routing tree.

The root element typically has a slightly different configuration.

```js
import myAppRouteTree from './route-tree.js';
import router, {Context, routingMixin} from '@jack-henry/web-component-router';

class AppElement extends routingMixin(Polymer.Element) {
  static get is() { return 'app-element'; }

  connectedCallback() {
    super.connectedCallback();

    router.routeTree = myAppRouteTree;
    // Define this instance as the root element
    router.routeTree.getValue().element = this;

    // Start routing
    router.start();
  }

  async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
    context.handled = true;
    const destinationNode = router.routeTree.getNodeByKey(routeId);
    if (isAuthenticated || !destinationNode.requiresAuthentication()) {
      // carry on. user is authenticated or doesn't need to be.
      return super.routeEnter(currentNode, nextNodeIfExists, routeId, context);
    }

    // Redirect to the login page
    router.go('/login');

    // Don't continue routing - we have redirected to the
    // login page
    return false;
  }

  async routeExit(currentNode, nextNode, routeId, context) {
    // This method should never be called. The main app element
    // should never be on an exit path as it should always be in
    // common no matter what route is activated.
  }
}
```

## Saving Scroll Position

When using the back button for navigation, the previous route scroll
position should be preserved. To accomplish this, we use a global
page.js exit callback. However, care must be taken as saving the scroll
position should only occur on normal navigation. Back/Forward browser
navigation should not save the scroll position as it causes a timing
issue.

```js
import myAppRouteTree from './route-tree.js';
import router, {routingMixin} from '@jack-henry/web-component-router';

class AppElement extends routingMixin(Polymer.Element) {
  static get is() { return 'app-element'; }

  connectedCallback() {
    super.connectedCallback();

    router.routeTree = myAppRouteTree;
    // Define this instance as the root element
    router.routeTree.getValue().element = this;

    // Save the scroll position for every route exit
    router.addGlobalExitHandler(this.saveScrollPosition_.bind(this));

    // Start routing
    router.start();
  }

  /**
   * @param {!Context} context
   * @param {function(boolean=)} next
   * @private
   */
  saveScrollPosition_(context, next) {
    if (!(router.nextStateWasPopped || 'scrollTop' in context.state)) {
      context.state['scrollTop'] = this.scrollTop;
      context.save();
    }
    next();
  }

  async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
    // Restoring the scroll position needs to be async
    setTimeout(() => {
      this.scrollTop = context.state['scrollTop'] || 0;
    }, 0);
    return super.routeEnter(currentNode, nextNodeIfExists, routeId, context);
  }
}
```

## Router Reference

```js
/**
 * Get or define the routing tree
 * @type {!RouteTreeNode}
 */
router.routeTree;

/**
 * Get the current active route node
 * @type {string}
 */
router.currentNodeId;

/**
 * Get the previous active route node
 * @type {string}
 */
router.prevNodeId;

/**
 * Begin routing. Should only be called once. The routing tree
 * must first be defined.
 */
router.start();

/**
 * Navigate to the specified route path.
 * @param {string} path
 * @param {object=} params Values to use for named & query parameters
 */
router.go(path, params);

/**
 * Register an exit callback to be invoked on every route change
 * @param {function(!Context, function(boolean=))} callback
 */
router.addGlobalExitHandler(callback);

/**
 * Register a callback function which will be invoked when a route change
 * is initiated.
 * @param {!Function} callback
 */
router.addRouteChangeStartCallback(callback);

/**
 * Unregister a callback function
 * @param {!Function} callback
 */
router.removeRouteChangeStartCallback(callback);

/**
 * Register a callback function which will be invoked when a route change
 * is completed.
 * @param {!Function} callback
 */
router.addRouteChangeCompleteCallback(callback);

/**
 * Unregister a callback function
 * @param {!Function} callback
 */
router.removeRouteChangeCompleteCallback(callback);

/**
 * Anonymize the route path by replacing param values with their
 * param name. Used for analytics tracking
 *
 * @param {!Context} context route enter context
 * @return {!string}
 */
const urlPath = router.getRouteUrlWithoutParams(context);
```
