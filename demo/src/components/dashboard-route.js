import { LitElement, html, css } from "lit";
import { routingMixin } from "@jack-henry/web-component-router";

class DashboardRoute extends routingMixin(LitElement) {
  static styles = css`
    :host {
      display: block;
      background-color: #fff;
      padding: 16px;
    }
  `;

  render() {
    return html` <h1>Dashboard Route</h1> `;
  }
}

// Define the custom element
customElements.define("dashboard-route", DashboardRoute);
