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

function JSCompiler_renameProperty(propName, instance) {
  return propName;
}

describe('Router', () => {
  let router = new Router();

  const A = testRouteTree.tree.getNodeByKey(testRouteTree.Id.A);
  const B = testRouteTree.tree.getNodeByKey(testRouteTree.Id.B);

  const originalRouteChangeCallback = router.routeChangeCallback_;
  /** @type {!Function} */
  let newRouteChangeCallback;

  const startPropertyName = JSCompiler_renameProperty('start', router.page);

  beforeAll(() => {
    // reset router
    router.routeTree = testRouteTree.tree;

    router.routeChangeCallback_ = (function(...args) {
      originalRouteChangeCallback.apply(this, args);
      if (newRouteChangeCallback) {
        newRouteChangeCallback.apply(this, args);
      }
    }).bind(router);

    router.page.register('*', (context, next) => {
      context.handled = true; // prevents actually leaving the page
      next();
    });
  });

  afterAll(() => {
    // reset router
    router.currentNodeId_ = undefined;
  });

  beforeEach(() => {
    spyOn(router.page, startPropertyName).and.callThrough();
  });

  it('.start should register routes and start routing', () => {
    const initialCallbackLength = router.page.callbacks.length;
    const builtinCallbackLength = 0;

    router.start();
    // router.page should be called to register routes ROOT, B, C, D, E.
    // A should NOT be registered as it is abstract (has a zero length path).
    expect(router.page.callbacks.length).toBe(5 + initialCallbackLength + builtinCallbackLength);
    expect(router.page.start).toHaveBeenCalled();
  });

  it('should not have a previous route id initially', () => {
    expect(router.currentNodeId_).toBe(undefined);
  });

  it('callbacks should call router.routeChangeCallback_ with the correct this binding and arguments', (done) => {
    newRouteChangeCallback = (function(node, ...args) {
      expect(args.length).toBe(2);
      expect(this instanceof router.constructor).toBe(true);
      expect(node instanceof RouteTreeNode).toBe(true);
      done();
    }).bind(router);

    router.go('/B/somedata');
  });

  it('should store the previous route id', () => {
    expect(router.currentNodeId_).toBe(testRouteTree.Id.B);
  });

  describe('Router constructor', () => {
    afterAll(() => {
      // reset routeTree
      router = new Router();
    });

    it('should leave the routeTree undefined if instantiated without a route configuration', () => {
      router = new Router();
      expect(router.routeTree).toBe(undefined);
    });

    it('should create the routeTree when instantiated with the route configuration', () => {
      router = new Router(testRouteConfig);
      expect(router.routeTree).not.toBe(undefined);
    });
  });

  describe('buildRouteTree', () => {
    const testSubRouteData = [{
        id: 'app-user',
        tagName: 'APP-USER-PAGE',
        path: '/users/:userId([0-9]{1,6})',
        requiresAuthentication: true,
        params: ['userId'],
        beforeEnter: () => Promise.resolve(),
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
      spyOn(router.page, JSCompiler_renameProperty('show', router.page)).
        and.callFake(async (path) => new Context(path));
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

    it('should be an empty object if there are no query parameters', (done) => {
      router.page.register('/test', (context, next) => {
        expect(context.query).toBeInstanceOf(URLSearchParams);
        expect(Array.from(context.query.keys())).toEqual([]);
        done();
      });
      router.go('/test');
    });

    it('should have properties that match the query parameters', (done) => {
      router.page.register('/test', (context, next) => {
        expect(context.query.get('foo')).toBe('bar');
        expect(context.query.get('noValue')).toBe('');
        done();
      });
      router.go('/test?foo=bar&noValue');
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
