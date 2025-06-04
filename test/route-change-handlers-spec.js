import { describe, it, expect, vi } from 'vitest';
import { loadRouteNode, removeRouteNode } from '../lib/route-change-handlers.js';
import Router from '../router.js';
import testRouteConfig from './utils/test-route-config.js';
import { TestElement } from './utils/test-element.js';

const MockedRouter = new Router(testRouteConfig);

// Mock customElements.whenDefined
vi.spyOn(customElements, 'whenDefined').mockResolvedValue();

//define the custom element before calling loadRouteNode
customElements.define('app-account-page', TestElement);

describe('loadRouteNode with testRouteConfig', () => {
  it('should return when nextNodeIfExists is undefined', async () => {
    const mockContext = { handled: false };
    const mockCurrentNode = MockedRouter.routeTree.getNodeByKey('app');

    const result = await loadRouteNode(mockCurrentNode, undefined, 'app', mockContext);

    expect(mockContext.handled).toBe(true);
    expect(result).toBeUndefined();
  });

  it('should reuse an existing element if it exists and has the correct parent', async () => {
    const mockContext = { handled: false, params: {} };
    const mockCurrentElement = document.createElement('app-main');
    const mockNextElement = document.createElement('app-user-page');
    mockCurrentElement.appendChild(mockNextElement);

    const mockCurrentNode = MockedRouter.routeTree.getNodeByKey('app');
    mockCurrentNode.getValue().element = mockCurrentElement;

    const mockNextNode = MockedRouter.routeTree.getNodeByKey('app-user');
    mockNextNode.getValue().element = mockNextElement;

    await loadRouteNode(mockCurrentNode, mockNextNode, 'app-user', mockContext);

    expect(mockContext.handled).toBe(true);
    expect(mockNextNode.getValue().element).toBe(mockNextElement);
  });

  it('should create a new element if it does not exist', async () => {
    const mockContext = { handled: false, params: {} };
    const mockCurrentElement = document.createElement('app-main');

    const mockCurrentNode = MockedRouter.routeTree.getNodeByKey('app');
    mockCurrentNode.getValue().element = mockCurrentElement;

    const mockNextNode = MockedRouter.routeTree.getNodeByKey('app-user-account');
    mockNextNode.getValue().element = null;

    await loadRouteNode(mockCurrentNode, mockNextNode, 'app-user-account', mockContext);

    const createdElement = mockCurrentElement.querySelector('app-account-page');
    expect(mockContext.handled).toBe(true);
    expect(createdElement).not.toBeNull();
    expect(mockNextNode.getValue().element).toBe(createdElement);
  });

  it('should set attributes on the new element based on route params', async () => {
    const mockContext = { handled: false, params: { userId: '123', accountId: '456' } };
    const mockCurrentElement = document.createElement('app-main');

    const mockCurrentNode = MockedRouter.routeTree.getNodeByKey('app');
    mockCurrentNode.getValue().element = mockCurrentElement;

    const mockNextNode = MockedRouter.routeTree.getNodeByKey('app-user-account');
    mockNextNode.getValue().element = null;
    await loadRouteNode(mockCurrentNode, mockNextNode, 'app-user-account', mockContext);

    const createdElement = mockCurrentElement.querySelector('app-account-page');
    expect(createdElement.getAttribute('user-Id')).toBe('123');
    expect(createdElement.getAttribute('account-id')).toBe('456');
  });
});

describe('removeRouteNode', () => {
  it('should remove the element from the DOM', async () => {
    const mockParentElement = document.createElement('div');
    const mockChildElement = document.createElement('app-user-page');
    mockParentElement.appendChild(mockChildElement);

    const mockCurrentNode = MockedRouter.routeTree.getNodeByKey('app-user');
    mockCurrentNode.getValue().element = mockChildElement;

    await removeRouteNode(mockCurrentNode);

    expect(mockParentElement.contains(mockChildElement)).toBe(false);
    expect(mockCurrentNode.getValue().element).toBeUndefined();
  });
});