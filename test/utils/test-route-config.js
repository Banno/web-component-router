const testRouteConfig = {
    id: 'app',
    tagName: 'APP-MAIN',
    path: '',
    subRoutes: [{
        id: 'app-user',
        tagName: 'APP-USER-PAGE',
        path: '/users/:userId([0-9]{1,6})',
        params: ['userId'],
        beforeEnter: () => Promise.resolve(),
    }, {
        id: 'app-user-account',
        tagName: 'APP-ACCOUNT-PAGE',
        path: '/users/:userId([0-9]{1,6})/accounts/:accountId([0-9]{1,6})',
        params: ['userId', 'accountId'],
    }, {
      id: 'app-about',
      tagName: 'APP-ABOUT',
      path: '/about',
      authenticated: false,
    }]
};

export default testRouteConfig;