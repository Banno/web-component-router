import RouteTreeNode from './lib/route-tree-node.js';
import RouteData from './lib/route-data.js';
import page from 'page';
import { BasicRoutingInterface } from './routing-interface.js';
const Context = page.Context;

/**
 * @param {function(new:HTMLElement)} Superclass
 * @polymer
 * @mixinFunction
 */
function routingMixin(Superclass) {
  /**
   * @polymer
   * @mixinClass
   * @implements {BasicRoutingInterface}
   */
  class BasicRouting extends Superclass {
    /**
     * Default implementation for the callback on entering a route node.
     * This will only be used if an element does not define it's own routeEnter method.
     *
     * @param {!RouteTreeNode} currentNode
     * @param {!RouteTreeNode|undefined} nextNodeIfExists
     * @param {string} routeId
     * @param {!Context} context
     * @return {!Promise<boolean|undefined>}
     */
    async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
      context.handled = true;
      const currentElement = /** @type {!Element} */ (currentNode.getValue().element);

      if (nextNodeIfExists) {
        const nextNode = /** @type {!RouteTreeNode} */ (nextNodeIfExists);

        const nextNodeData = /** @type {!RouteData} */(nextNode.getValue());

        const thisElem = /** @type {!Element} */ (/** @type {?} */ (this));
        /** @type {!Element>} */
        let nextElement = nextNodeData.element || thisElem.querySelector(nextNodeData.tagName.toLowerCase());

        // Reuse the element if it already exists in the dom.
        // Add a sanity check to make sure the element parent is what we expect
        if (!nextElement || nextElement.parentNode !== currentElement) {
          if (nextNodeData.tagName.indexOf('-') > 0) {
            let Elem = customElements && customElements.get(nextNodeData.tagName.toLowerCase());
            if (!Elem) {
              // When code splitting, it's possible that the element created is not yet in the registry.
              // Wait until it is before creating it
              await customElements.whenDefined(nextNodeData.tagName.toLowerCase());
              Elem = customElements.get(nextNodeData.tagName.toLowerCase());
            }
            nextElement = new Elem();
          } else {
            nextElement = document.createElement(nextNodeData.tagName);
          }
        }

        const setElementAttributes = (callCount, nextElement) => {
          try {
            // Set appropriate attributes on the element from the route params
            for (const key in nextNodeData.attributes) {
              if (key in context.params) {
                if (context.params[key] !== undefined) {
                  nextElement.setAttribute(nextNodeData.attributes[key], context.params[key]);
                } else {
                  nextElement.removeAttribute(nextNodeData.attributes[key]);
                }
              }
            }

            if (!nextElement.parentNode) {
              while (currentElement.firstChild) {
                currentElement.removeChild(currentElement.firstChild);
              }
              currentElement.appendChild(nextElement);
            }

            nextNode.getValue().element = /** @type {!Element} */ (nextElement);
          } catch (e) {
            // Internet Explorer can sometimes throw an exception when setting attributes immediately
            // after creating the element. Add a short delay and try again.
            if (/Trident/.test(navigator.userAgent) && callCount < 4) {
              return new Promise((resolve) => {
                setTimeout(resolve, 0);
              }).then(() => setElementAttributes(callCount + 1, nextElement));
            }
            throw e;
          }
        };
        await setElementAttributes(1, nextElement);
      }
    }

    /**
     * Default implementation for the callback on exiting a route node.
     * This will only be used if an element does not define it's own routeExit method.
     *
     * @param {!RouteTreeNode} currentNode
     * @param {!RouteTreeNode|undefined} nextNode
     * @param {string} routeId
     * @param {!Context} context
     */
    async routeExit(currentNode, nextNode, routeId, context) {
      const currentElement = currentNode.getValue().element;

      if (currentElement.parentNode) {
        currentElement.parentNode.removeChild(/** @type {!Element} */ (currentElement));
      }
      currentNode.getValue().element = undefined;
    }
  }

  return BasicRouting;
}

export { routingMixin as default };
