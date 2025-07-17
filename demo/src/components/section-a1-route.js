import { LitElement, html, css } from "lit";
import { routingMixin } from "@jack-henry/web-component-router";

class SectionA1Route extends routingMixin(LitElement) {
  static styles = css`
    :host {
      display: block;
      background-color: #fff;
      padding: 16px;
    }
  `;

  static get properties() {
    return {
      activeRouteId: {
        type: String,
      },
      sectionAId: {
        type: String,
        attribute: "section-a-id",
      },
    };
  }

  constructor() {
    super();
    this.activeRouteId = undefined;
    this.sectionAId = undefined;
  }

  connectedCallback() {
    super.connectedCallback();
    console.log("SectionA1Route connectedCallback");
  }

  async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
    await super.routeEnter(currentNode, nextNodeIfExists, routeId, context);
    this.activeRouteId = routeId;
  }

  render() {
    return html`
      <h1>Section A1</h1>

      <p>
        This child route utilizes a parameter in the url path
        (<code>sectionAId</code>)
      </p>
      <p>The component defines the property and the camel-case attribute</p>

      <pre>
  static get properties() {
    return {
      activeRouteId: {
        type: String,
      },
      sectionAId: {
        type: String,
        attribute: 'section-a-id',
      },
    };
  }
      </pre
      >

      <p>Section A1 ID: <code>${this.sectionAId}</code></p>
    `;
  }
}

// Define the custom element
customElements.define("section-a1-route", SectionA1Route);
