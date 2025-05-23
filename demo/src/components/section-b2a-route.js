import { LitElement, html, css } from 'lit';

class SectionB2ARoute extends LitElement {
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
    console.log('SectionB2ARoute constructor');
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('SectionB2ARoute connectedCallback');
  }

  render() {
    return html`
        <p>Section b2a ID: <code>${this.sectionB2AId}</code></p>
        <p>As you'll see here, sub routes don't need to replace the main content of the page, but are inserted in the default slot of the parent component.</p>
        <p>You can change the url params of the route and the property will update, without switching out this route component.</p>
        <p><a href="/section-b/b2/another/b2a/test">Section B2A with a different sectionB2AId</a></p>
        <p><a href=${`/section-b/b2/${this.sectionB2Id}`}>Back</a></p>
    `;
  }
}

// Define the custom element
customElements.define('section-b2a-route', SectionB2ARoute);
