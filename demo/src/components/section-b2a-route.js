import { LitElement, html, css } from 'lit';
import {routingMixin} from '@jack-henry/web-component-router';

class SectionB2ARoute extends routingMixin(LitElement) {
  static styles = css`
    :host {
      display: block;
    }
  `;

  static get properties() {
    return {
      activeRouteId: {
        type: String,
      },
      sectionB2Id: {
        type: String,
        attribute: 'section-b2-id',
      },
      sectionB2AId: {
        type: String,
        attribute: 'section-b2-a-id',
      },
    };
  }

  constructor() {
    super();
    this.activeRouteId = undefined;
    this.sectionB2Id = undefined;
    this.sectionB2AId = undefined;
  }

  render() {
    return html`
        <p>Section b2a ID: <code>${this.sectionB2AId}</code></p>
        <p>As you'll see here, sub routes don't need to replace the main content of the page, but are inserted in the default slot of the parent component.</p>
        <a href=${`/section-b/b2/${this.sectionB2Id}`}>Back</a>
    `;
  }
}

// Define the custom element
customElements.define('section-b2a-route', SectionB2ARoute);
