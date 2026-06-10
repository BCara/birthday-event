// src/layouts/GuestLayout.jsx
// Full-screen layout for guest-facing themed pages — no nav, no footer
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';

export default function GuestLayout() {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('kb-theme', 'light');
  }, []);

  return (
    <>
      <Outlet />
    </>
  );
}
