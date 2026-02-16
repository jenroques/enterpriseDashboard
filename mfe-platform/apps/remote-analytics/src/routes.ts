export type RemoteRouteMetadata = {
  id: string;
  path: string;
  title: string;
  navLabel: string;
};

export function getRoutes(): RemoteRouteMetadata[] {
  return [
    {
      id: 'analytics-home',
      path: '/analytics',
      title: 'Analytics',
      navLabel: 'Analytics'
    }
  ];
}

export default getRoutes;
