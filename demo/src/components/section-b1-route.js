import { LitElement, html, css } from 'lit';

class SectionB1Route extends LitElement {
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
      sectionB1Id: {
        type: String,
        attribute: 'section-b1-id',
      },
    };
  }

  constructor() {
    super();
    this.activeRouteId = undefined;
    this.sectionB1Id = undefined;
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('SectionA1Route connectedCallback');
  }

  async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
    await super.routeEnter(currentNode, nextNodeIfExists, routeId, context);
    this.activeRouteId = routeId;
  }

  render() {
    return html`
      <h3>Section B1</h3>

      <p>This child route utilizes a parameter in the url path (<code>sectionB1Id</code>)</p>
      <p>The component defines the property and the camel-case attribute</p>

      <pre>
  static get properties() {
    return {
      activeRouteId: {
        type: String,
      },
      sectionAId: {
        type: String,
        attribute: 'section-b-1-id',
      },
    };
  }
      </pre>

      <p>Section b1 ID: <code>${this.sectionB1Id}</code></p>
    `;
  }
}

// Define the custom element
customElements.define('section-b1-route', SectionB1Route);
