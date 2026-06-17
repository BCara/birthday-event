// src/layouts/GuestLayout.jsx
// Full-screen layout for guest-facing themed pages — no nav, no footer
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { trackEvent } from '../firebase';
import AnalyticsTracker from '../components/AnalyticsTracker';

export default function GuestLayout() {
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('kb-theme', 'light');
  }, []);

  // GA4 SPA page-view tracking (no-op until a measurementId is configured)
  useEffect(() => {
    trackEvent('page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
    });
  }, [location.pathname, location.search]);

  return (
    <>
      <AnalyticsTracker />
      <Outlet />
    </>
  );
}
