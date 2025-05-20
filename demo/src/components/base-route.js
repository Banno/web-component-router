import { LitElement, html, css } from 'lit';
import Router from '@jack-henry/web-component-router';
import {routingMixin} from '@jack-henry/web-component-router';
import {ROUTE_CONFIG} from '../js/route-config.js';
import './dashboard-route.js';
import './section-a-route.js';
import './section-b-route.js';

class BaseRoute extends routingMixin(LitElement) {
  static styles = css`
    :host {
      display: block;
      background-color: #fff;
      padding: 16px;
    }

    header {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 16px;
    }

    code {
      background-color: #f0f0f0;
      color: #3451b2;
      padding: 2px 4px;
      border-radius: 4px;
    }
    pre {
      background-color: #f0f0f0;
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      width: 100%;
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

  async routeEnter(currentNode, nextNodeIfExists, routeId, context) {
    // This method is called when entering a route
    console.log('Entering route:', routeId);
    console.log('Current node:', currentNode);
    console.log('Next node:', nextNodeIfExists);
    console.log('Context:', context);
    await super.routeEnter(currentNode, nextNodeIfExists, routeId, context);
  }

  render() {
    return html`
      <header>The base route</header>
      <p>This is the map of routes in this application.</p>
      <pre>

        DEMO APP ROUTE TREE

        _BASE_ROUTE_
      /       |      &#92;
   DASHBOARD  A      B
             /     / &#92;
            A1   B1  B2
                      |
                      B2A
      </pre>
      <p>The <code>BASE_ROUTE</code> component is the first route in the tree (with a path of ' ') and defines our router, all routes that follow are loaded into the <code>slot</code> below.</p>

      <label>Slot:</label>
      <slot></slot>
    `;
  }
}

// Define the custom element
customElements.define('base-route', BaseRoute);
