export {};

declare global {
  interface HTMLElement {
    connectedCallback(): void;
    disconnectedCallback(): void;
    adoptedCallback(): void;
    attributeChangedCallback(name: string, oldValue: any, newValue: any);
  }
  interface CustomElementConstructor {
    connectedCallback(): void;
    disconnectedCallback(): void;
    adoptedCallback(): void;
    attributeChangedCallback(name: string, oldValue: any, newValue: any);
  }
}
