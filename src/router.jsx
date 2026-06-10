// src/router.jsx
import React, { Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import GuestLayout from './layouts/GuestLayout';
import RequireAuth from './components/RequireAuth';

// Loader fallback
function PageLoader() {
  return (
    <div className="kb-loader-wrap">
      <div className="kb-spinner" />
      <p className="kb-loader-text">Loading…</p>
    </div>
  );
}

function Lazy({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// ── Public marketing pages (with nav/footer) ──
const HomePage        = React.lazy(() => import('./pages/HomePage'));
const LoginPage       = React.lazy(() => import('./pages/LoginPage'));
const SignupPage      = React.lazy(() => import('./pages/SignupPage'));
const ContactPage     = React.lazy(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = React.lazy(() => import('./pages/TermsOfServicePage'));
const NotFound        = React.lazy(() => import('./pages/NotFound'));

// ── Host dashboard pages (auth required, with nav) ──
const DashboardPage   = React.lazy(() => import('./pages/dashboard/DashboardPage'));
const CreateEventPage = React.lazy(() => import('./pages/dashboard/CreateEventPage'));
const EventManagePage = React.lazy(() => import('./pages/dashboard/EventManagePage'));
const GuestListPage   = React.lazy(() => import('./pages/dashboard/GuestListPage'));
const MemoriesPage    = React.lazy(() => import('./pages/dashboard/MemoriesPage'));
const BillingPage     = React.lazy(() => import('./pages/dashboard/BillingPage'));
const PrintableInvitePage = React.lazy(() => import('./pages/dashboard/PrintableInvitePage'));

// ── Guest-facing pages (no nav — full-screen themed) ──
const EventLandingPage = React.lazy(() => import('./pages/guest/EventLandingPage'));
const RSVPPage         = React.lazy(() => import('./pages/guest/RSVPPage'));
const MemoryWallPage   = React.lazy(() => import('./pages/guest/MemoryWallPage'));
const LeaveMemoryPage  = React.lazy(() => import('./pages/guest/LeaveMemoryPage'));
const LiveDisplayPage  = React.lazy(() => import('./pages/guest/LiveDisplayPage'));

// ── Developer routes ──
const ThemeDebugPage   = React.lazy(() => import('./pages/ThemeDebugPage'));


const router = createBrowserRouter([
  // ── Public marketing + auth ──
  {
    element: <MainLayout />,
    children: [
      { path: '/',       element: <Lazy><HomePage /></Lazy> },
      { path: '/login',  element: <Lazy><LoginPage /></Lazy> },
      { path: '/signup', element: <Lazy><SignupPage /></Lazy> },
      { path: '/contact',element: <Lazy><ContactPage /></Lazy> },
      { path: '/privacy',element: <Lazy><PrivacyPolicyPage /></Lazy> },
      { path: '/terms',  element: <Lazy><TermsOfServicePage /></Lazy> },

      // ── Host dashboard (auth-gated) ──
      {
        element: <RequireAuth />,
        children: [
          { path: '/dashboard',                          element: <Lazy><DashboardPage /></Lazy> },
          { path: '/dashboard/billing',                  element: <Lazy><BillingPage /></Lazy> },
          { path: '/dashboard/create',                   element: <Lazy><CreateEventPage /></Lazy> },
          { path: '/dashboard/event/:eventId',           element: <Lazy><EventManagePage /></Lazy> },
          { path: '/dashboard/event/:eventId/print',     element: <Lazy><PrintableInvitePage /></Lazy> },
          { path: '/dashboard/event/:eventId/rsvps',     element: <Lazy><GuestListPage /></Lazy> },
        ],
      },

      { path: '*', element: <Lazy><NotFound /></Lazy> },
    ],
  },

  // ── Guest-facing: themed, no nav ──
  {
    element: <GuestLayout />,
    children: [
      { path: '/:slug',         element: <Lazy><EventLandingPage /></Lazy> },
      { path: '/:slug/invite',  element: <Lazy><RSVPPage /></Lazy> },
      { path: '/:slug/portal',  element: <Lazy><EventLandingPage /></Lazy> },
      { path: '/:slug/rsvp',    element: <Lazy><RSVPPage /></Lazy> },
      { path: '/:slug/memories',element: <Lazy><MemoryWallPage /></Lazy> },
      { path: '/:slug/memories/new', element: <Lazy><LeaveMemoryPage /></Lazy> },
      { path: '/:slug/live',    element: <Lazy><LiveDisplayPage /></Lazy> },
    ],
  },

  // ── Developer / QA routes ──
  {
    path: '/dev/themes',
    element: <Lazy><ThemeDebugPage /></Lazy>
  }
]);

export default router;
