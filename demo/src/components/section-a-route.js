import { LitElement, html, css } from 'lit';
import './section-a1-route.js';

class SectionARoute extends LitElement {
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
    };
  }

  constructor() {
    super();
    this.activeRouteId = undefined;
  }

  /** @type {import('@jack-henry/web-component-router/lib/routing-interface.js').RouteEnterFunction} */
  async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
    this.activeRouteId = routeId;
  }

  render() {
    return html`
      <h2>Section A</h2>

      <p>This section has its own subRoute, which are loaded in <code>slot</code> below.</p>

      <p>Active route ID: <code>${this.activeRouteId}</code></p>

      <ul>
        <li><a href="/section-a/test-param">Section A1 with sectionAId: test-param</a></li>
        <li><a href="/section-a/cheese">Section A1 with sectionAId: cheese</a></li>
      </ul>

      <label>Slot:</label>
      <div>
        <slot>
          <p>This placeholder will be replaced by the active subRoute.</p>
        </slot>
      </div>

    `;
  }
}

// Define the custom element
customElements.define('section-a-route', SectionARoute);
