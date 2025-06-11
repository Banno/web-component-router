import { LitElement } from 'lit';
export class TestElement extends LitElement {
  static get properties() {
    return {
      accountId: {
        type: String,
        attribute: 'account-id',
      },
      userId: {
        type: String,
        attribute: 'user-id',
      },
    };
  }
  constructor() {
    super();
    this.userId = undefined;
    this.accountId = undefined;
  }
}