/**
 * @fileoverview
 *
 * Route tree used for tests
 *
 *      _Root_
 *     /      \
 *    A       D
 *   / \       \
 *  B  C       E
 */

import testRouteTree from './utils/testing-route-setup.js';
import testRouteConfig from './utils/test-route-config.js';
import Router, {Context, RouteTreeNode} from '../router.js';
import RoutedElement from './fixtures/custom-fixture.js';
import {afterEach, beforeEach, describe, expect, vi} from 'vitest';
import { ROOT, A, B, C, D, E } from './utils/testing-route-setup.js';

function JSCompiler_renameProperty(propName, instance) {
  return propName;
}

describe('Router', () => {
  let router;

  /** @type {!Function} */
  let newRouteChangeCallback;

  const startPropertyName = JSCompiler_renameProperty('start', Router.prototype.page);

  const initRouter = async () => {
    history.pushState({}, '', '/'); // reset URL to prevent page.js from invoking route callbacks on page load
    Router.instance_ = null; // reset singleton instance to force creating new instance
    newRouteChangeCallback = undefined; // reset newRouteChangeCallback to prevent tests from affecting each other
    router = new Router();
    router.routeTree = testRouteTree.tree;
    router.routeChangeCallback_ = (function(...args) {
      Router.prototype.routeChangeCallback_.apply(this, args);
      if (newRouteChangeCallback) {
        newRouteChangeCallback.apply(this, args);
      }
    }).bind(router);

    // should start with no current or previous route
    expect(router.prevNodeId_).toBe(undefined); // sanity check
    expect(router.currentNodeId_).toBe(undefined); // sanity check

    await router.start();
    router.page.register('*', (context, next) => {
      context.handled = true; // prevents actually leaving the page
      next();
    });

    expect(router.prevNodeId_).toBe(undefined); // sanity check
    expect(router.currentNodeId_).toBe(testRouteTree.Id.ROOT); // sanity check
  };

  beforeEach(async () => {
    await initRouter();
  });

  describe('start()', () => {
    beforeEach(() => {
      // re-initialize without registering route callbacks
      Router.instance_ = null; // reset singleton instance to force creating new instance
      router = new Router();
      router.routeTree = testRouteTree.tree;
    });

    it('registers routes and start routing', () => {
      const initialCallbackLength = router.page.callbacks.length;
      const builtinCallbackLength = 0;

      vi.spyOn(router.page, startPropertyName);
      router.start();
      // router.page should be called to register routes ROOT, B, C, D, E.
      // A should NOT be registered as it is abstract (has a zero length path).
      expect(router.page.callbacks.length).toBe(5 + initialCallbackLength + builtinCallbackLength);
      expect(router.page.start).toHaveBeenCalled();
    });
  });

  it('callbacks should call router.routeChangeCallback_ with the correct this binding and arguments', async () => {
    let routeChangeCallbackCalled = false;
    newRouteChangeCallback = (function(node, ...args) {
      expect(args.length).toBe(2);
      expect(this instanceof router.constructor).toBe(true);
      expect(node instanceof RouteTreeNode).toBe(true);
      routeChangeCallbackCalled = true;
    }).bind(router);

    await router.go('/B/somedata');
    expect(routeChangeCallbackCalled).toBe(true);
  });

  it('should store the previous route id', async () => {
    await router.go('/B/somedata');
    await router.go('/C');
    expect(router.currentNodeId_).toBe(testRouteTree.Id.C);
    expect(router.prevNodeId_).toBe(testRouteTree.Id.B);
  });

  describe('Router constructor', () => {
    beforeEach(() => {
      // reset singleton instance before each test to prevent tests from affecting each other
      Router.instance_ = null;
    });

    it('should leave the routeTree undefined if instantiated without a route configuration', () => {
      router = new Router();
      expect(router.routeTree).toBe(undefined);
    });

    it('should create the routeTree when instantiated with the route configuration', () => {
      router = new Router(testRouteConfig);
      expect(router.routeTree).not.toBe(undefined);
    });

    it('sets singleton instance', () => {
      router = new Router();
      expect(Router.instance_).toBe(router);
    });

    it('returns the singleton instance if the constructor is called multiple times', () => {
      const router1 = new Router();
      const router2 = new Router();
      expect(router1).toBe(router2);
    });
  });

  describe('buildRouteTree', () => {
    const testSubRouteData = [{
        id: 'app-user',
        tagName: 'APP-USER-PAGE',
        path: '/users/:userId([0-9]{1,6})',
        requiresAuthentication: true,
        params: ['userId'],
        beforeEnter: (currentNode, nextNodeIfExists, routeId, context) => Promise.resolve(),
    }, {
        id: 'app-user-account',
        tagName: 'APP-ACCOUNT-PAGE',
        path: '/users/:userId([0-9]{1,6})/accounts/:accountId([0-9]{1,6})',
        requiresAuthentication: true,
        params: ['userId', 'accountId'],
    }, {
      id: 'app-about',
      tagName: 'APP-ABOUT',
      path: '/about',
      requiresAuthentication: false,
    }];

    it('should create a routeTree with the correct properties', () => {
      const routeTree = router.buildRouteTree(testRouteConfig);
      const subRoutes = routeTree.getChildren();
      expect(routeTree.requiresAuthentication()).toBe(true);
      expect(routeTree.getKey()).toBe('app');
      expect(subRoutes.length).toBe(3);
      subRoutes.forEach((route, index) => {
        const data = route.getValue();
        if (testSubRouteData[index].params) {
          expect(Object.keys(data.attributes)).toEqual(testSubRouteData[index].params);
        }
        expect(data.beforeEnter).not.toBe(undefined);
        ['id', 'tagName', 'path', 'requiresAuthentication'].forEach((prop) => {
          expect(data[prop]).toBe(testSubRouteData[index][prop]);
        });

      });
    });

    it('should set authentication to true by default', () => {
      const routeTree = router.buildRouteTree(testRouteConfig);
      const subRoutes = routeTree.getChildren();
      expect(subRoutes[0].getValue().requiresAuthentication).toBe(true);
      expect(subRoutes[2].getValue().requiresAuthentication).toBe(false);
    });

    it('should set metaData to to the correct values', () => {
      const routeTree = router.buildRouteTree(testRouteConfig);
      const subRoutes = routeTree.getChildren();
      expect(subRoutes[0].getValue().metaData).toEqual({title:'User Page'});
      expect(subRoutes[1].getValue().metaData).toEqual({});
      expect(subRoutes[2].getValue().metaData).toEqual({});
    });
  });

  describe('url()', () => {
    it('should return the path if there are no other parameters', () => {
      expect(router.url('/A')).toBe('/A');
    });

    it('should replace path parameters with given values', () => {
      expect(router.url('/account/:accountId([-a-fA-F0-9]{36})/documents/:docId', {
        'accountId': '1234',
        'docId': '6789',
      })).toBe('/account/1234/documents/6789');

      expect(router.url('/account/:accountId([-a-fA-F0-9]{36})/documents/:docId', {
        'docId': '6789',
        'accountId': '1234',
      })).toBe('/account/1234/documents/6789');

      expect(router.url('/account/:accountId([-a-fA-F0-9]{36})?/documents/:docId?', {
        'accountId': '2345',
        'docId': '7890',
      })).toBe('/account/2345/documents/7890');
    });

    it('should allow a trailing slash', () => {
      expect(router.url('/account/:accountId/', {
        'accountId': '1234'
      })).toBe('/account/1234/');
      expect(router.url('/account/:accountId([-a-fA-F0-9]{36})/', {
        'accountId': '1234'
      })).toBe('/account/1234/');
    });

    it('should append non-path parameters as query parameters', () => {
      const url = router.url('/B/:bData', {
        'bData': 'bdata',
        'foo': 1,
        'bar[]': 'ABC & abc & 123',
      });
      expect(url).toBe('/B/bdata?foo=1&bar%5B%5D=ABC%20%26%20abc%20%26%20123');
    });

    it('should exclude optional parameters', () => {
      expect(router.url('/account/:accountId([0-9]+)?')).toBe('/account/');
      expect(router.url(
          '/pay/:mode(bill|person|edit)?/:billOrPaymentId([-a-fA-F0-9]{36})?',
          {'mode': 'bill'}
      )).toBe('/pay/bill/');
    });

    it('should combine multiple slashes', () => {
      const url = router.url('/account/:fromAccountId([0-9]+)?/:toAccountId([0-9]+)?/');
      expect(url).toBe('/account/');
    });
  });

  describe('go()', () => {
    beforeEach(() => {
      vi.spyOn(router.page, JSCompiler_renameProperty('show', router.page)).
        mockImplementation(async (path) => new Context(path));
    });

    it('should navigate to the given path', () => {
      router.go('/A');
      expect(router.page.show).toHaveBeenCalledWith('/A');
    });

    it('should replace path parameters with given values', () => {
      router.go('/account/:accountId([-a-fA-F0-9]{36})/documents/:docId', {
        'accountId': '1234',
        'docId': '6789',
      });
      expect(router.page.show).toHaveBeenCalledWith('/account/1234/documents/6789');
    });
    it('should resolve to a Context', async () => {
      const rp = await router.go('/A');
      expect(rp instanceof Context);
    });
  });

  describe('query context', () => {
    afterEach(() => {
      // Remove the callback added in the test.
      router.page.callbacks.pop();
    });

    it('should be an empty object if there are no query parameters', async () => {
      const context = await router.go('/test');
      expect(context.query).toBeInstanceOf(URLSearchParams);
      expect(Array.from(context.query.keys())).toEqual([]);
    });

    it('should have properties that match the query parameters', async () => {
      const context = await router.go('/test?foo=bar&noValue');
      expect(context.query.get('foo')).toBe('bar');
      expect(context.query.get('noValue')).toBe('');
    });
  });

  describe('routeEnter', () => {
    it('should create the next element when it does not exist', async () => {
      const context = new Context('/B/somedata');
      context.params['bData'] = 'somedata';
      A.getValue().element = document.createElement(testRouteTree.Id.A);
      B.getValue().element = undefined;
      await A.getValue().element.routeEnter(A, B, testRouteTree.Id.B, context);
      expect(B.getValue().element.tagName.toLowerCase()).toBe(testRouteTree.Id.B);
    });

    it('registered attributes should be assigned as hyphenated properties', async () => {
      const context = new Context('/B/somedata');
      context.params['bData'] = 'somedata';
      A.getValue().element = document.createElement(testRouteTree.Id.A);
      B.getValue().element = undefined;
      await A.getValue().element.routeEnter(A, B, testRouteTree.Id.B, context);
      expect(B.getValue().element.getAttribute('b-data')).toBe('somedata');
    });

    it('undefined routing properties should clear associated attribute', async () => {
      const context = new Context('/B/somedata');
      context.params['bData'] = undefined;
      A.getValue().element = document.createElement(testRouteTree.Id.A);
      B.getValue().element = undefined;
      await A.getValue().element.routeEnter(A, B, testRouteTree.Id.B, context);
      expect(B.getValue().element.getAttribute('b-data')).toBe(null);
    });

    it('should reuse an element when it already exists on the next node', async () => {
      const context = new Context('/B/somedata');
      context.params['bData'] = 'somedata';
      const aElement = document.createElement(testRouteTree.Id.A);
      A.getValue().element = aElement;
      const bElement = document.createElement(testRouteTree.Id.B);
      B.getValue().element = bElement;
      aElement.appendChild(bElement);
      await A.getValue().element.routeEnter(A, B, testRouteTree.Id.B, context);
      expect(B.getValue().element).toBe(bElement);
    });

    it('when reusing an element, it should still update the attributes', async () => {
      const context = new Context('/B/bar');
      context.params['bData'] = 'bar';
      const aElement = document.createElement(testRouteTree.Id.A);
      A.getValue().element = aElement;
      const bElement = document.createElement(testRouteTree.Id.B);
      bElement.setAttribute('b-data', 'foo');
      B.getValue().element = bElement;
      aElement.appendChild(bElement);
      await RoutedElement.prototype.routeEnter(A, B, testRouteTree.Id.B, context);
      expect(B.getValue().element.getAttribute('b-data')).toBe('bar');
    });
  });

  describe('routeExit', () => {
    it('should remove the element from the routing tree', async () => {
      const context = new Context('/D/E');
      A.getValue().element = document.createElement(testRouteTree.Id.A);
      B.getValue().element = document.createElement(testRouteTree.Id.B);
      await B.getValue().element.routeExit(B, A, testRouteTree.Id.E, context);
      expect(B.getValue().element).toBe(undefined);
    });

    it('should remove the element from the parent node', async () => {
      const context = new Context('/D/E');
      A.getValue().element = document.createElement(testRouteTree.Id.A);
      const bElement = document.createElement(testRouteTree.Id.B);
      B.getValue().element = bElement;
      A.getValue().element.appendChild(bElement);
      await A.getValue().element.routeExit(B, A, testRouteTree.Id.E, context);
      expect(A.getValue().element.getElementsByTagName(testRouteTree.Id.B).length).toBe(0);
    });
  });
});
