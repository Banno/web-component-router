import { PolymerElement, html } from "@polymer/polymer/polymer-element.js";
import { BasicRoutingInterface, routingMixin } from "../../router.js";
/**
 * @constructor
 * @extends {PolymerElement}
 * @implements {BasicRoutingInterface}
 */
const RoutedElement = routingMixin(PolymerElement);

class CustomFixtureElement extends RoutedElement {
  static get is() {
    return "custom-fixture";
  }

  static get template() {
    return html`<div><slot></slot></div>`;
  }
}

customElements.define(CustomFixtureElement.is, CustomFixtureElement);
export default CustomFixtureElement;
