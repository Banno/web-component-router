import {LitElement, html} from 'lit';
import {BasicRoutingInterface, routingMixin} from '../../router.js';
/**
 * @constructor
 * @extends {LitElement}
 * @implements {BasicRoutingInterface}
 */
const RoutedElement = routingMixin(LitElement);

class CustomFixtureElement extends RoutedElement {
  static get is() {
    return 'custom-fixture';
  }

  static get template() {
    return html`<div><slot></slot></div>`;
  }
}

customElements.define(CustomFixtureElement.is, CustomFixtureElement);
export default CustomFixtureElement;
