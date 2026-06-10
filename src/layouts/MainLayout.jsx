// src/layouts/MainLayout.jsx
// Marketing site + host dashboard layout with navbar and footer
import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('kb-theme', 'light');
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="ml-wrap">
      <header className={`ml-header ${scrolled ? 'ml-header-scrolled' : ''}`}>
        <div className="ml-header-inner">
          <Link to="/" className="ml-logo">
            <span className="ml-logo-emoji">🎂</span>
            <span className="ml-logo-text">Tiny Party <span style={{ fontSize: '0.8em' }}>Portal</span></span>
          </Link>

          <nav className={`ml-nav ${menuOpen ? 'ml-nav-open' : ''}`} aria-label="Main navigation">
            {user ? (
              <>
                <NavLink to="/dashboard" className={({ isActive }) => `ml-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>My Events</NavLink>
                <NavLink to="/dashboard/billing" className={({ isActive }) => `ml-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Upgrade</NavLink>
                <button className="ml-nav-link ml-nav-btn-ghost" onClick={handleLogout}>Sign out</button>
                <Link to="/dashboard/create" className="kb-btn kb-btn-primary kb-btn-sm" onClick={() => setMenuOpen(false)}>+ New Party</Link>
              </>
            ) : (
              <>
                <NavLink to="/login" className={({ isActive }) => `ml-nav-link ${isActive ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Sign in</NavLink>
                <Link to="/signup" className="kb-btn kb-btn-primary kb-btn-sm" onClick={() => setMenuOpen(false)}>Get started free</Link>
              </>
            )}
          </nav>

          <button
            className="ml-hamburger"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(v => !v)}
          >
            <span className={`ml-hamburger-icon ${menuOpen ? 'open' : ''}`} />
          </button>
        </div>
      </header>

      {menuOpen && <div className="ml-scrim" onClick={() => setMenuOpen(false)} />}

      <main className="ml-main">
        <Outlet />
      </main>

      <footer className="ml-footer">
        <div className="ml-footer-decorations">
          <span className="ml-footer-deco deco-1">🎈</span>
          <span className="ml-footer-deco deco-2">🎁</span>
          <span className="ml-footer-deco deco-3">🎉</span>
          <span className="ml-footer-deco deco-4">✨</span>
        </div>
        <div className="kb-container">
          <div className="ml-footer-inner">
            <div className="ml-footer-col ml-footer-brand-col">
              <Link to="/" className="ml-logo" style={{ marginBottom: '16px', display: 'inline-flex' }}>
                <span className="ml-logo-emoji">🎂</span>
                <span className="ml-logo-text">Tiny Party <span style={{ fontSize: '0.8em' }}>Portal</span></span>
              </Link>
              <p className="ml-footer-tagline">Making every birthday unforgettable.</p>
            </div>
            
            <div className="ml-footer-col">
              <h4 className="ml-footer-heading">Product</h4>
              <div className="ml-footer-links-col">
                <Link to="/" className="ml-footer-link">Home</Link>
                <Link to="/dashboard" className="ml-footer-link">My Events</Link>
                <Link to="/dashboard/create" className="ml-footer-link">Create Party</Link>
              </div>
            </div>

            <div className="ml-footer-col">
              <h4 className="ml-footer-heading">Support</h4>
              <div className="ml-footer-links-col">
                <Link to="/contact" className="ml-footer-link">Contact Us</Link>
              </div>
            </div>

            <div className="ml-footer-col">
              <h4 className="ml-footer-heading">Legal</h4>
              <div className="ml-footer-links-col">
                <Link to="/privacy" className="ml-footer-link">Privacy Policy</Link>
                <Link to="/terms" className="ml-footer-link">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="ml-footer-bottom">
            <p className="ml-footer-copy">© {new Date().getFullYear()} Tiny Party Portal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
