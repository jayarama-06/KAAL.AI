/**
 * Root Layout Component
 * Wraps all routes to provide route tracking for analytics
 */

import { Outlet } from 'react-router';
import { RouteTracker } from './RouteTracker';

export function RootLayout() {
  return (
    <>
      <RouteTracker />
      <Outlet />
    </>
  );
}
