import { LitElement, html, css } from 'lit';
import {routingMixin} from '@jack-henry/web-component-router';

class DashboardRoute extends routingMixin(LitElement) {
  static styles = css`
    :host {
      display: block;
      background-color: #fff;
      padding: 16px;
    }
  `;

  static get properties() {
    return {
      router: { type: Object },
    };
  }

  constructor() {
    super();
    this.router = new Router(ROUTE_CONFIG);
    this.router.routeTree.getValue().element = this;
    this.router.start();
  }

  render() {
    return html`
      <h1>Dashboard Route</h1>
      <nav>
        <a href="/section-a">Section A</a>
        <a href="/section-b">Section B</a>
      </nav>
    `;
  }
}

// Define the custom element
customElements.define('dashboard-route', DashboardRoute);
