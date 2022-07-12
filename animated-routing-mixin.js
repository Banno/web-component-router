import RouteTreeNode from './lib/route-tree-node.js';
import {Context} from './lib/page.js';
import basicRoutingMixin from './routing-mixin.js';
import BasicRoutingInterface from './routing-interface.js';

/**
 * @param {function(new:HTMLElement)} Superclass
 * @param {string} className
 * @mixinFunction
 * @polymer
 */
function animatedRoutingMixin(Superclass, className) {
  /**
   * @constructor
   * @extends {Superclass}
   * @implements {BasicRoutingInterface}
   */
  const BasicRoutingElement = basicRoutingMixin(Superclass);

  /**
   * @mixinClass
   * @polymer
   * @extends {BasicRoutingElement}
   * @implements {BasicRoutingInterface}
   */
  class AnimatedRouting extends BasicRoutingElement {
    connectedCallback() {
      super.connectedCallback();
      document.documentElement.scrollTop = document.body.scrollTop = 0;
    }
    /**
     * Default implementation for the callback on entering a route node.
     * This will only be used if an element does not define it's own routeEnter method.
     *
     * @param {!RouteTreeNode} currentNode
     * @param {!RouteTreeNode|undefined} nextNodeIfExists
     * @param {string} routeId
     * @param {!Context} context
     */
    async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
      const currentElement = currentNode.getValue().element;
      const animationEnd = (evt) => {
        const thisElem = /** @type {!Element} */ (/** @type {?} */ (this));
        thisElem.classList.remove(className);
        thisElem.removeEventListener('animationend', animationEnd, false);
      };
      currentElement.addEventListener('transitionend', animationEnd, false);
      currentElement.classList.add(className);
      return super.routeEnter(currentNode, nextNodeIfExists, routeId, context);
    }

    /**
     * Default implementation for the callback on exiting a route node.
     * This will only be used if an element does not define it's own routeExit method.
     *
     * @override
     * @param {!RouteTreeNode} currentNode
     * @param {!RouteTreeNode|undefined} nextNode
     * @param {string} routeId
     * @param {!Context} context
     */
    async routeExit(currentNode, nextNode, routeId, context) {
      const currentElement = currentNode.getValue().element;
      currentElement.addEventListener('animationend', AnimatedRouting.animationEnd, false);
      currentElement.classList.add(className);
      currentNode.getValue().element = undefined;
    }

    /**
     * @this {Element}
     * @param {Event} evt
     */
    static animationEnd(evt) {
      this.removeEventListener('animationend', AnimatedRouting.animationEnd, false);
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    }
  }
  return AnimatedRouting;
}

export default animatedRoutingMixin;
