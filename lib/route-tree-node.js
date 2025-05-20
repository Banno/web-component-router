/**
 * @fileoverview A tree structure to hold routing states
 *
 * When changing from one route to another, callbacks
 * should be invoked in the proper order. In particular,
 * exitCallbacks from the old route should be called for
 * nodes which are not a member of the path of the new route.
 * It is expected the exitCallbacks will remove nodes from the
 * DOM and this should be avoided if the nodes would be immediately
 * re-added.
 *
 * Entry callbacks should always be called for the complete DOM. Entry
 * callbacks should only add DOM nodes if they are not already present.
 * However state parameters may have changed and so DOM attributes might
 * need updated.
 *
 * Implementation based on Closure-Library goog.struct.TreeNode
 * @see https://google.github.io/closure-library/api/goog.structs.TreeNode.html
 */

import {Context} from './page.js';
import RouteData from './route-data.js';
import BasicRoutingInterface from './routing-interface.js';

class RouteTreeNode {
  /** @param {!RouteData} data */
  constructor(data) {
    /**
     * The key.
     * @private {string}
     */
    this.key_ = data.id;

    /**
     * The value.
     * @private {!RouteData}
     */
    this.value_ = data;

    /**
     * Reference to the parent node or null if it has no parent.
     * @private {?RouteTreeNode}
     */
    this.parent_ = null;

    /**
     * Child nodes or null in case of leaf node.
     * @private {?Array<!RouteTreeNode>}
     */
    this.children_ = null;
  }

  /**
   * Gets the key.
   * @return {string} The key.
   */
  getKey() {
    return this.key_;
  }

  /**
   * Gets the value.
   * @return {!RouteData} The value.
   */
  getValue() {
    return this.value_;
  }

  /** @return {?RouteTreeNode} */
  getParent() {
    return this.parent_;
  }

  /** @return {!Array<!RouteTreeNode>} Immutable child nodes. */
  getChildren() {
    return this.children_ || [];
  }

  /**
   * @return {!Array<!RouteTreeNode>} All ancestor nodes in
   *     bottom-up order.
   */
  getAncestors() {
    const ancestors = [];
    let node = this.getParent();
    while (node) {
      ancestors.push(node);
      node = node.getParent();
    }
    return ancestors;
  }

  /**
   * @return {!RouteTreeNode} The root of the tree structure,
   *     i.e. the farthest ancestor of the node or the node itself if it has no
   *     parents.
   */
  getRoot() {
    /** @type {!RouteTreeNode} */
    let root = this;
    while (root.getParent()) {
      root = /** @type {!RouteTreeNode} */ (root.getParent());
    }
    return root;
  }

  /**
   * Returns a node whose key matches the given one in the hierarchy rooted at
   * this node. The hierarchy is searched using an in-order traversal.
   * @param {string} key The key to search for.
   * @return {?RouteTreeNode} The node with the given key, or
   *     null if no node with the given key exists in the hierarchy.
   */
  getNodeByKey(key) {
    if (this.getKey() === key) {
      return this;
    }
    const children = this.getChildren();
    for (let i = 0; i < children.length; i++) {
      const descendant = children[i].getNodeByKey(key);
      if (descendant) {
        return descendant;
      }
    }
    return null;
  }

  /**
   * Traverses the subtree with the possibility to skip branches. Starts with
   * this node, and visits the descendant nodes depth-first, in preorder.
   * @param {function(this:RouteTreeNode, !RouteTreeNode):
   *     (boolean|undefined|void)} f Callback function. It takes the node as argument.
   *     The children of this node will be visited if the callback returns true or
   *     undefined, and will be skipped if the callback returns false.
   */
  traverse(f) {
    if (f.call(this, this) !== false) {
      const children = this.getChildren();
      for (let i = 0; i < children.length; i++) {
        children[i].traverse(f);
      }
    }
  }

  /**
   * Sets the parent node of this node. The callers must ensure that the parent
   * node and only that has this node among its children.
   * @param {RouteTreeNode} parent The parent to set. If
   *     null, the node will be detached from the tree.
   * @protected
   */
  setParent(parent) {
    this.parent_ = parent;
  }

  /**
   * Appends a child node to this node.
   * @param {!RouteTreeNode} child Orphan child node.
   */
  addChild(child) {
    this.addChildAt(child, this.children_ ? this.children_.length : 0);
  }

  /**
   * Inserts a child node at the given index.
   * @param {!RouteTreeNode} child Orphan child node.
   * @param {number} index The position to insert at.
   */
  addChildAt(child, index) {
    if (child.getParent()) {
      throw new Error('RouteTreeNode has an existing parent.');
    }
    child.setParent(this);
    this.children_ = this.children_ || [];
    if (index < 0 || index > this.children_.length) {
      throw new Error('Index out of bounds.');
    }
    this.children_.splice(index, 0, child);
  }

  /**
   * Removes the child node at the given index.
   * @param {number} index The position to remove from.
   * @return {RouteTreeNode} The removed node if any.
   */
  removeChildAt(index) {
    const child = this.children_ && this.children_[index];
    if (child) {
      child.setParent(null);
      this.children_.splice(index, 1);
      if (this.children_.length === 0) {
        this.children_ = null;
      }
      return child;
    }
    return null;
  }

  /**
   * Removes the given child node of this node.
   * @param {RouteTreeNode} child The node to remove.
   * @return {RouteTreeNode} The removed node if any.
   */
  removeChild(child) {
    return child &&
      this.removeChildAt(this.getChildren().indexOf(child));
  }

  /** @return {boolean} */
  requiresAuthentication() {
    if (this.getValue().requiresAuthentication) {
      return true;
    }

    if (this.getParent() !== null) {
      return this.getParent().requiresAuthentication();
    }

    return false;
  }

  /**
   * Cause this route to become the active route. When a route is activated,
   * exitCallback functions from the routeData should be called up the tree in order
   * beginning with the previousNodeId until a common node is found with the
   * path from the root to this node.
   *
   * After exitCallback methods have all completed, entryCallbacks should
   * be called in order beginning with the root node down the tree through
   * this node.
   *
   *      _Root_
   *     /      \
   *    A       D
   *   / \       \
   *  B  C       E
   *
   * If the current route is "B" and the route for "E" is activated,
   * then the following callbacks should be invoked:
   *
   *     B.exitCallback, A.exitCallback, Root.entryCallback,
   *     D.entryCallback, E.entryCallback
   *
   * If the current route is "B" and the route for "C" is activated,
   * then the following callbacks should be invoked:
   *
   *     B.exitCallback, Root.entryCallback, A.entryCallback, C.entryCallback
   *
   * @param {!string|undefined} previousRouteId
   * @param {!Context} context
   */
  async activate(previousRouteId, context) {
    const routeId = this.getKey();

    // Ancestors are a path from the parent up the tree to the root
    const entryNodes = [/** @type {!RouteTreeNode} */ (this)].concat(this.getAncestors());
    entryNodes.reverse();
    let exitNodes = [];

    // If a previousRouteId is provided, we need to calculate paths
    if (previousRouteId !== undefined) {
      const rootNode = this.getRoot();
      const previousRouteNode = rootNode.getNodeByKey(previousRouteId);

      // Find common ancestors of the previous route node to this one.
      // Common ancestors should NOT have their exitCallbacks invoked.
      const previousRoutePath = [previousRouteNode].concat(previousRouteNode.getAncestors());
      for (let i = 0; i < previousRoutePath.length; i++) {
        let foundCommonAncestor = false;
        for (let j = entryNodes.length - 1; j >= 0; j--) {
          // Once we find a common ancestor, trim the route and exit the loop.
          // Ancestors in common should not have their exitCallbacks invoked.
          if (previousRoutePath[i] === entryNodes[j]) {
            exitNodes = previousRoutePath.slice(0, i);
            foundCommonAncestor = true;
            break;
          }
        }
        if (foundCommonAncestor) {
          break;
        }
      }
    }

    // Exit nodes
    for (let exitIndex = 0; exitIndex < exitNodes.length; exitIndex++) {
      const currentExitNode = exitNodes[exitIndex];
      const nextExitNode = exitNodes[exitIndex + 1];
      const value = currentExitNode.getValue();
      if (value) {
        const routingElem = /** @type {!BasicRoutingInterface} */ (
            /** @type {?} */ (currentExitNode.getValue().element)
        );
        if (!routingElem.routeExit) {
          throw new Error(`Element '${currentExitNode.getValue().tagName}' does not implement routeExit`);
        }
        await routingElem.routeExit(currentExitNode, nextExitNode, routeId, context);
        value.element = undefined;
      }
    }

    // entry nodes
    for (let entryIndex = 0; entryIndex < entryNodes.length; entryIndex++) {
      const currentEntryNode = entryNodes[entryIndex];
      const nextEntryNode = entryNodes[entryIndex + 1];

      if (currentEntryNode.getValue().element) {
        const routingElem = /** @type {!BasicRoutingInterface} */ (
            /** @type {?} */ (currentEntryNode.getValue().element)
        );
        if (!routingElem.routeEnter) {
          throw new Error(`Element '${currentEntryNode.getValue().tagName}' does not implement routeEnter`);
        }
        const shouldContinue = await routingElem.routeEnter(currentEntryNode, nextEntryNode, routeId, context);
        if (shouldContinue === false) {
          break;
        }
      }
    }
  }
}

export default RouteTreeNode;
