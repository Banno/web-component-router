/**
 * @fileoverview
 *
 * Setup a routing tree for tests
 *
 * Route tree used for tests
 *
 *      _Root_
 *     /      \
 *    A       D
 *   / \       \
 *  B  C       E
 *
 *  A is an abstract route (zero length path)
 *
 *  B does not directly require authentication, but A does - so B should
 *  effectively require authentication.
 */

import {RouteData, RouteTreeNode, routingMixin}  from '../../router.js';

/** @enum {string} */
const RouteId = {
  ROOT: 'tests-root',
  A: 'tests-a',
  B: 'tests-b',
  C: 'tests-c',
  D: 'tests-d',
  E: 'tests-e'
};

/**
 * @constructor
 * @extends {HTMLElement}
 * @implements {RoutingMixin.Type}
 */
const RoutedElement = routingMixin(HTMLElement);

for (const routeId in RouteId) {
  if (RouteId.hasOwnProperty(routeId)) {
    class routeElem extends RoutedElement {}
    customElements.define(RouteId[routeId], routeElem); // eslint-disable-line @banno/ux/custom-elements-define
  }
}

export const E = new RouteTreeNode(new RouteData(RouteId.E, RouteId.E, '/D/E'));
export const D = new RouteTreeNode(new RouteData(RouteId.D, RouteId.D, '/D'));
D.addChild(E);
export const C = new RouteTreeNode(new RouteData(RouteId.C, RouteId.C, '/C'));
export const B = new RouteTreeNode(new RouteData(RouteId.B, RouteId.B, '/B/:bData', ['bData'], false));
export const A = new RouteTreeNode(new RouteData(RouteId.A, RouteId.A, ''));
A.addChild(B);
A.addChild(C);
export const ROOT = new RouteTreeNode(new RouteData(RouteId.ROOT, RouteId.ROOT, '/', [], false));
ROOT.addChild(A);
ROOT.addChild(D);

export default {
  tree: ROOT,
  Id: RouteId
};
