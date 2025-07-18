/**
 * @fileoverview
 *
 * @suppress {visibility} Tests are allowed to access private methods
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
import { describe, it, expect, vi } from 'vitest';
import RouteTreeNode from '../lib/route-tree-node.js';
import { loadRouteNode } from '../lib/route-change-handlers.js';
import {Context} from '../router.js';

describe('RouteTreeNode', () => {
  const ROOT = testRouteTree.tree.getNodeByKey(testRouteTree.Id.ROOT);
  const A = testRouteTree.tree.getNodeByKey(testRouteTree.Id.A);
  const B = testRouteTree.tree.getNodeByKey(testRouteTree.Id.B);
  const C = testRouteTree.tree.getNodeByKey(testRouteTree.Id.C);
  const D = testRouteTree.tree.getNodeByKey(testRouteTree.Id.D);
  const E = testRouteTree.tree.getNodeByKey(testRouteTree.Id.E);
  let routePath = [];

  class RoutedElement extends HTMLElement { // eslint-disable-line @banno/ux/custom-element-name
    static get is() {
      return 'routed-element';
    }
    constructor(keyName = undefined) {
      super();
      this.keyName = keyName;
    }
    async routeEnter(node, nextNode, routeId, context) {
      routePath.push(`${this.keyName}-enter`);
    }
    async routeExit(node, nextNode, routeId, context) {
      routePath.push(`${this.keyName}-exit`);
    }
  }
  customElements.define(RoutedElement.is, RoutedElement);

  it('node requires authentication', () => {
    expect(E.requiresAuthentication()).toBe(true);
  });

  it('node does not require authentication', () => {
    expect(ROOT.requiresAuthentication()).toBe(false);
  });

  it('node does not require authentication, but a parent does', () => {
    expect(B.requiresAuthentication()).toBe(true);
  });

  describe('activate function', () => {
    beforeEach(() => {
      ROOT.getValue().element = new RoutedElement('ROOT');
      A.getValue().element = new RoutedElement('A');
      B.getValue().element = new RoutedElement('B');
      C.getValue().element = new RoutedElement('C');
      D.getValue().element = new RoutedElement('D');
      E.getValue().element = new RoutedElement('E');
      routePath = [];
    });

    it('activating a route without a previous route id only invokes entry methods', async () => {
      await C.activate(undefined, new Context('/C'));
      expect(routePath.join('_')).toBe('ROOT-enter_A-enter_C-enter');
    });

    it('activating a route should call the correct methods', async () => {
      await E.activate(B.getKey(), new Context('/D/E'));
      expect(routePath.join('_')).toBe('B-exit_A-exit_ROOT-enter_D-enter_E-enter');
    });

    it('activating a route should call the correct methods 2', async () => {
      await C.activate(B.getKey(), new Context('/C'));
      expect(routePath.join('_')).toBe('B-exit_ROOT-enter_A-enter_C-enter');
    });

    it('returning "false" from the routeEnter method should prevent future methods from being invoked', async () => {
      vi.spyOn(A.getValue().element, 'routeEnter').mockImplementation(function() {
        routePath.push('A-enter');
        return Promise.resolve(false);
      });
      await C.activate(E.getKey(), new Context('/D/E'));
      expect(routePath.join('_')).toBe('E-exit_D-exit_ROOT-enter_A-enter');
    });
  });

  describe('activate calls loadRouteNode when routeEnter undefined', () => {
    beforeEach(() => {
      vi.mock('../lib/route-change-handlers.js', () => ({
        loadRouteNode: vi.fn().mockResolvedValue(true),
        removeRouteNode: vi.fn().mockResolvedValue(true),
      }));
    });

    it('should call routeEnter if it exists', async () => {
      await A.activate(undefined, new Context('/A'));
      expect(loadRouteNode).not.toHaveBeenCalled();
    });

    it('should call loadRouteNode if routeEnter does not exist', async () => {
      A.getValue().element.routeEnter = undefined;

      await A.activate(undefined, new Context('/A'));
      expect(loadRouteNode).toHaveBeenCalled();
    });
  });
});
