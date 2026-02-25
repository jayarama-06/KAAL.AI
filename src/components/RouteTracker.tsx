/**
 * Route Tracker Component
 * Tracks page navigation events in Clarity, Sentry, Google Analytics, and Mixpanel
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { setCustomTag, trackEvent } from '../services/clarity-service';
import * as Sentry from '@sentry/react';
import { GoogleAnalytics } from '../services/google-analytics-service';
import { mixpanel } from '../services/mixpanel-service';

export function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view in Clarity
    const pageName = location.pathname.replace('/', '') || 'home';
    trackEvent(`page_view_${pageName}`);
    setCustomTag('current_page', pageName);

    // Track page view in Sentry
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${location.pathname}`,
      level: 'info',
    });

    // Track page view in Google Analytics
    GoogleAnalytics.trackPageView(location.pathname);

    // Track page view in Mixpanel
    mixpanel.trackPageView(pageName, location.pathname);

    console.log('[Analytics] Page view:', pageName);
  }, [location.pathname]);

  return null; // This component doesn't render anything
}