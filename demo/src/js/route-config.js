export const ROUTE_IDS = {
  BASE: 'base',
  DASHBOARD: 'dashboard',
  SECTION_A: 'section-a',
  SECTION_A2: 'section-a2',
  SECTION_B: 'section-b',
  SECTION_B2: 'section-b2',
  SECTION_B3: 'section-b3',
}

export const ROUTE_PATHS = {
  BASE: '',
  DASHBOARD: '/',
  SECTION_A: '/section-a',
  SECTION_A2: '/section-a/:id([a-z-]+)',
  SECTION_B: '/section-b',
  SECTION_B2: '/section-b/:id([a-z-]+)',
  SECTION_B3: '/section-b/:id([a-z-]+)/:id2([a-z-]+)',
}

export const ROUTE_CONFIG = {
  id: ROUTE_IDS.BASE,
  path: ROUTE_PATHS.BASE,
  tagName: 'base-route',
  subRoutes: [
    {
      id: ROUTE_IDS.DASHBOARD,
      path: ROUTE_PATHS.DASHBOARD,
      tagName: 'dashboard-route',
    }, {
      id: ROUTE_IDS.SECTION_A,
      path: ROUTE_PATHS.SECTION_A,
      tagName: 'section-a-route',
      subRoutes: [
        {
          id: ROUTE_IDS.SECTION_A2,
          path: ROUTE_PATHS.SECTION_A2,
          tagName: 'section-a2-route',
          params: ['id'],
        }
      ],
    }, {
      id: ROUTE_IDS.SECTION_B,
      path: ROUTE_PATHS.SECTION_B,
      tagName: 'section-b-route',
      subRoutes: [
        {
          id: ROUTE_IDS.SECTION_B2,
          path: ROUTE_PATHS.SECTION_B2,
          tagName: 'section-b2-route',
          params: ['id'],
          subRoutes: [
            {
              id: ROUTE_IDS.SECTION_B3,
              path: ROUTE_PATHS.SECTION_B3,
              tagName: 'section-b3-route',
              params: ['id', 'id2'],
            }
          ],
        }
      ],
    }
  ],
};
