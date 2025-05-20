import { LitElement, html, css } from 'lit';
import {routingMixin} from '@jack-henry/web-component-router';
import './section-b1-route.js';
import './section-b2-route.js';

class SectionBRoute extends routingMixin(LitElement) {
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

  async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
    await super.routeEnter(currentNode, nextNodeIfExists, routeId, context);
    this.activeRouteId = routeId;
  }

  render() {
    return html`
      <h2>Section B</h2>

      <p>This route has two child routes (B1 and B2).  Each has a unique param which the router gets from the path and sets on the component.</p>
      <p>This parent component is loaded for each sub route, but not reloaded when routing between children, so shared actions can be taken here for performance.</p>
      <ul>
        <li><a href="/section-b/b1/legos">Section B1</a></li>
        <li><a href="/section-b/b2/another">Section B2</a></li>
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
customElements.define('section-b-route', SectionBRoute);
