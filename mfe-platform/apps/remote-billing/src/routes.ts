export type RemoteRouteMetadata = {
  id: string;
  path: string;
  title: string;
  navLabel: string;
};

export function getRoutes(): RemoteRouteMetadata[] {
  return [
    {
      id: 'billing-home',
      path: '/billing',
      title: 'Billing',
      navLabel: 'Billing'
    }
  ];
}

export default getRoutes;
