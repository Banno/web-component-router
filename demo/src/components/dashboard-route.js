import { LitElement, html, css } from 'lit';

class DashboardRoute extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: #fff;
      padding: 16px;
    }
  `;

  render() {
    return html`
      <h1>Dashboard Route</h1>
    `;
  }
}

// Define the custom element
customElements.define('dashboard-route', DashboardRoute);
