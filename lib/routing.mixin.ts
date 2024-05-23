
import BasicRoutingInterface from './routing-interface.js';
import type { Context } from './page.js';
import type RouteData from './route-data.js';
import type RouteTreeNode from './route-tree-node.js';
import type { LitElement } from 'lit';

export type Constructor<T = {}> = new (...args: any[]) => T;
export declare class RoutingMixinInterface {
  routeEnter(currentNode: RouteTreeNode, nextNodeIfExists: RouteTreeNode | undefined, routeId: string, context: Context): Promise<boolean | void>;
  routeExit(currentNode: RouteTreeNode, nextNode: RouteTreeNode | undefined, routeId: string, context: Context): Promise<boolean | void>;
}
const RoutingMixin = <T extends Constructor<LitElement>>(superclass: T) => {
  class BasicRouting extends superclass {
    async routeEnter(currentNode: RouteTreeNode, nextNodeIfExists: RouteTreeNode | undefined, routeId: string, context: Context): Promise<boolean | void> {
      context.handled = true;
      const currentElement: Element | undefined = currentNode.getValue().element;

      if (nextNodeIfExists) {
        const nextNode = nextNodeIfExists;

        const nextNodeData: RouteData = nextNode.getValue();

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const thisElem: Element = this;
        /** @type {Element} */
        let nextElement: Element | null = nextNodeData.element ?? thisElem.querySelector(nextNodeData.tagName.toLowerCase());

        // Reuse the element if it already exists in the dom.
        // Add a sanity check to make sure the element parent is what we expect
        if (!nextElement || nextElement.parentNode !== currentElement) {
          if (nextNodeData.tagName.indexOf('-') > 0) {
            let Elem = customElements.get(nextNodeData.tagName.toLowerCase());
            if (!Elem) {
              // When code splitting, it's possible that the element created is not yet in the registry.
              // Wait until it is before creating it
              await customElements.whenDefined(nextNodeData.tagName.toLowerCase());
              Elem = customElements.get(nextNodeData.tagName.toLowerCase());
            } else {
              nextElement = new Elem();
            }

          } else {
            nextElement = document.createElement(nextNodeData.tagName);
          }
        }

        const setElementAttributes = (callCount: number, nextElem: Element) => {
          try {
            // Set appropriate attributes on the element from the route params
            for (const key in nextNodeData.attributes) {
              if (key in context.params) {
                if (context.params[key] !== void 0) {
                  nextElem.setAttribute(nextNodeData.attributes[key], context.params[key]);
                } else {
                  nextElem.removeAttribute(nextNodeData.attributes[key]);
                }
              }
            }

            if (!nextElement?.parentNode) {
              while (currentElement?.firstChild) {
                currentElement.removeChild(currentElement.firstChild);
              }
              currentElement?.appendChild(nextElement as HTMLElement);
            }

            nextNode.getValue().element = nextElement as HTMLElement;
          } catch (e) {
            // Internet Explorer can sometimes throw an exception when setting attributes immediately
            // after creating the element. Add a short delay and try again.
            if (/Trident/.test(navigator.userAgent) && callCount < 4) {
              return new Promise((resolve) => {
                setTimeout(resolve, 0);
              }).then(() => setElementAttributes(callCount + 1, nextElement as HTMLElement));
            }
            throw e;
          }
        };
        await setElementAttributes(1, nextElement as HTMLElement);
      }
    }

    async routeExit(currentNode: RouteTreeNode, nextNode: RouteTreeNode | undefined, routeId: string, context: Context) {
      const currentElement = currentNode.getValue().element;

      if (currentElement?.parentNode) {
        currentElement.parentNode.removeChild( currentElement);
      }
      currentNode.getValue().element = void 0;
    }
  }

  return BasicRouting as Constructor<RoutingMixinInterface> & T;
};

//exporting BasicRoutingInterface for backward compatibility - don't break consumer imports
export { RoutingMixin, BasicRoutingInterface };
