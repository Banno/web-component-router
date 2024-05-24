import {type LitElement} from 'lit';
import type RouteTreeNode from './route-tree-node.js';
import {type Context} from './page.js';
import {RoutingMixin, type Constructor, type RoutingMixinInterface} from './routing.mixin.js';

function animatedRoutingMixin<T extends Constructor<LitElement>>(Superclass:T, className:string) {

  class AnimatedRouting extends RoutingMixin(Superclass) {
    connectedCallback() {
      // @ts-ignore
      super.connectedCallback();
      document.documentElement.scrollTop = document.body.scrollTop = 0;
    }
    /**
     * Default implementation for the callback on entering a route node.
     * This will only be used if an element does not define it's own routeEnter method.
     */
    async routeEnter(currentNode:RouteTreeNode, nextNodeIfExists:RouteTreeNode | undefined, routeId:string, context:Context):Promise<boolean|void> {
      const currentElement = currentNode.getValue().element;
      const animationEnd = (evt) => {
        const thisElem = this;
        thisElem.classList.remove(className);

        thisElem.removeEventListener('animationend', animationEnd, false);
      };
      currentElement?.addEventListener('transitionend', animationEnd, false);
      currentElement?.classList.add(className);
      return super.routeEnter(currentNode, nextNodeIfExists, routeId, context);
    }

    /**
     * Default implementation for the callback on exiting a route node.
     * This will only be used if an element does not define it's own routeExit method.
     */
    async routeExit(currentNode:RouteTreeNode, nextNode:RouteTreeNode|undefined, routeId:string, context:Context):Promise<void> {
      const currentElement = currentNode.getValue().element;
      currentElement?.addEventListener('animationend', AnimatedRouting.animationEnd, false);
      currentElement?.classList.add(className);
      currentNode.getValue().element = undefined;
    }

    static animationEnd(this:HTMLElement, evt:Event) {
      this.removeEventListener('animationend', AnimatedRouting.animationEnd, false);
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    }
  }
  return AnimatedRouting as Constructor<RoutingMixinInterface> & T;
}

export default animatedRoutingMixin;
