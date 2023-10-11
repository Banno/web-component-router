const testRouteConfig = {
    id: 'app',
    tagName: 'APP-MAIN',
    path: '',
    subRoutes: [{
        id: 'app-user',
        tagName: 'APP-USER-PAGE',
        path: '/users/:userId([0-9]{1,6})',
        params: ['userId'],
    }, {
        id: 'APP-USER-ACCOUNT',
        tagName: 'APP-ACCOUNT-PAGE',
        path: '/users/:userId([0-9]{1,6})/accounts/:accountId([0-9]{1,6})',
        params: ['userId', 'accountId'],
    }, {
      id: 'app-about',
      tagName: 'APP-ABOUT',
      path: '/about',
      unAuth: true,
    }]
};

export default testRouteConfig;