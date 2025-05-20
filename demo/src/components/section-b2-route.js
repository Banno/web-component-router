import { LitElement, html, css } from 'lit';
import {routingMixin} from '@jack-henry/web-component-router';
import './section-b2a-route.js';

class SectionB2Route extends routingMixin(LitElement) {
  static styles = css`
    :host {
      display: block;
      background-color: #fff;
      padding: 16px;
    }
    article {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }
    article > * {
      flex: 1;
      width: calc(50% - 8px);
    }
    article > div {
      border-left: 1px solid #ccc;
      padding-left: 16px;
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
    };
  }

  constructor() {
    super();
    this.activeRouteId = undefined;
    this.sectionB2Id = undefined;
  }

  render() {
    return html`
      <h3>Section B2</h3>

      <p>This subRoute route also has a subRoute</p>
      <p>Both routes share the <code>sectionB2Id</code> property/param from the route.</p>
      <p>And the subroute also has the <code>sectionB2AId</code> property set by the url.</p>
      <pre>
  static get properties() {
    return {
      activeRouteId: {
        type: String,
      },
      sectionAId: {
        type: String,
        attribute: 'section-b-2-id',
      },
    };
  }
      </pre>
    <article>
        <p>Section b2 ID: <code>${this.sectionB2Id}</code></p>
        <div>
          <slot>
            <p>Click the link to load the subRoute</p>
            <a href="/section-b/b2/another/b2a/subroute">Section B2A</a>
          </slot>
        </div>
      </article>
    `;
  }
}

// Define the custom element
customElements.define('section-b2-route', SectionB2Route);
