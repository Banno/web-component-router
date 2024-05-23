import BasicRoutingInterface from './routing-interface.js';
const RoutingMixin = (superclass) => {
    class BasicRouting extends superclass {
        async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
            context.handled = true;
            const currentElement = currentNode.getValue().element;
            if (nextNodeIfExists) {
                const nextNode = nextNodeIfExists;
                const nextNodeData = nextNode.getValue();
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const thisElem = this;
                /** @type {Element} */
                let nextElement = nextNodeData.element ?? thisElem.querySelector(nextNodeData.tagName.toLowerCase());
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
                        }
                        else {
                            nextElement = new Elem();
                        }
                    }
                    else {
                        nextElement = document.createElement(nextNodeData.tagName);
                    }
                }
                const setElementAttributes = (callCount, nextElem) => {
                    try {
                        // Set appropriate attributes on the element from the route params
                        for (const key in nextNodeData.attributes) {
                            if (key in context.params) {
                                if (context.params[key] !== void 0) {
                                    nextElem.setAttribute(nextNodeData.attributes[key], context.params[key]);
                                }
                                else {
                                    nextElem.removeAttribute(nextNodeData.attributes[key]);
                                }
                            }
                        }
                        if (!nextElement?.parentNode) {
                            while (currentElement?.firstChild) {
                                currentElement.removeChild(currentElement.firstChild);
                            }
                            currentElement?.appendChild(nextElement);
                        }
                        nextNode.getValue().element = nextElement;
                    }
                    catch (e) {
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
        async routeExit(currentNode, nextNode, routeId, context) {
            const currentElement = currentNode.getValue().element;
            if (currentElement?.parentNode) {
                currentElement.parentNode.removeChild(currentElement);
            }
            currentNode.getValue().element = void 0;
        }
    }
    return BasicRouting;
};
//exporting BasicRoutingInterface for backward compatibility - don't break consumer imports
export { RoutingMixin, BasicRoutingInterface };
