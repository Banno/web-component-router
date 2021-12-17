import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {default as routingMixin} from '../../routing-mixin.js';
import { BasicRoutingInterface } from '../../routing-interface.js';
/**
 * @constructor
 * @extends {PolymerElement}
 * @implements {BasicRoutingInterface}
 */
const RoutedElement = routingMixin(PolymerElement);

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
