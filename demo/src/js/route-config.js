export const ROUTE_IDS = {
  BASE: 'base',
  DASHBOARD: 'dashboard',
  SECTION_A: 'section-a',
  SECTION_A1: 'section-a1',
  SECTION_B: 'section-b',
  SECTION_B1: 'section-b1',
  SECTION_B2: 'section-b2',
  SECTION_B2A: 'section-b2a',
}

export const ROUTE_PATHS = {
  BASE: '',
  DASHBOARD: '/',
  SECTION_A: '/section-a',
  SECTION_A1: '/section-a/:sectionAId([a-z-]+)',
  SECTION_B: '/section-b',
  SECTION_B1: '/section-b/b1/:sectionB1Id([a-z-]+)',
  SECTION_B2: '/section-b/b2/:sectionB2Id([a-z-]+)',
  SECTION_B2A: '/section-b/b2/:sectionB2Id([a-z-]+)/b2a/:sectionB2AId([a-z-]+)',
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
      metaData: {title: 'Dashboard'}
    }, {
      id: ROUTE_IDS.SECTION_A,
      path: ROUTE_PATHS.SECTION_A,
      tagName: 'section-a-route',
      metaData: {title: 'Section A'},
      subRoutes: [
        {
          id: ROUTE_IDS.SECTION_A1,
          path: ROUTE_PATHS.SECTION_A1,
          tagName: 'section-a1-route',
          params: ['sectionAId'],
          metaData: {title: 'Section A1'}
        }
      ],
    }, {
      id: ROUTE_IDS.SECTION_B,
      path: ROUTE_PATHS.SECTION_B,
      tagName: 'section-b-route',
      metaData: {title: 'Section B'},
      subRoutes: [
        {
          id: ROUTE_IDS.SECTION_B1,
          path: ROUTE_PATHS.SECTION_B1,
          tagName: 'section-b1-route',
          params: ['sectionB1Id'],
          metaData: {title: 'Section B1'}
        },
        {
          id: ROUTE_IDS.SECTION_B2,
          path: ROUTE_PATHS.SECTION_B2,
          tagName: 'section-b2-route',
          params: ['sectionB2Id'],
          metaData: {title: 'Section B2'},
          subRoutes: [
            {
              id: ROUTE_IDS.SECTION_B2A,
              path: ROUTE_PATHS.SECTION_B2A,
              tagName: 'section-b2a-route',
              params: ['sectionB2Id', 'sectionB2AId'],
              metaData: {title: 'Section B2A'}
            }
          ],
        }
      ],
    }
  ],
};
