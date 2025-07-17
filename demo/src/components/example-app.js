import { LitElement, html, css } from "lit";
import "./base-route.js";

class ExampleApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: #f0f0f0;
      padding: 16px;
    }

    header {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 16px;
    }
  `;

  render() {
    return html`
      <header>Example routing app</header>
      <p>All routes will contain this text</p>
      <base-route></base-route>
    `;
  }
}

// Define the custom element
customElements.define("example-app", ExampleApp);
