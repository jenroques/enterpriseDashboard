export type RemoteRouteMetadata = {
  id: string;
  path: string;
  title: string;
  navLabel: string;
};

export function getRoutes(): RemoteRouteMetadata[] {
  return [
    {
      id: 'accounts-home',
      path: '/accounts',
      title: 'Accounts',
      navLabel: 'Accounts'
    }
  ];
}

export default getRoutes;
