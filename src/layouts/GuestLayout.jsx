// src/layouts/GuestLayout.jsx
// Full-screen layout for guest-facing themed pages — no nav, no footer
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

export default function GuestLayout() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('kb-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kb-theme', theme);
  }, [theme]);

  return (
    <>
      <Outlet />
      <button 
        onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
        className="kb-theme-toggle"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </>
  );
}
