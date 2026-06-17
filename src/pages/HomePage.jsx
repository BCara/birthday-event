// src/pages/HomePage.jsx
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import './HomePage.css';

const THEMES = [
  { key: 'generic',  emoji: '🎈', label: 'Birthday Party', colors: ['#FF6B6B','#FFD166','#06D6A0'], bg: 'linear-gradient(135deg,#FF6B6B,#FFD166)' },
  { key: 'dino',     emoji: '🦕', label: 'Dino Adventure', colors: ['#2D6A4F','#74C69D','#B7E4C7'], bg: 'linear-gradient(135deg,#1B4332,#52B788)' },
  { key: 'unicorn',  emoji: '🦄', label: 'Unicorn Magic',  colors: ['#C77DFF','#F8BBD9','#A8DAFF'], bg: 'linear-gradient(135deg,#9B5DE5,#F15BB5)' },
  { key: 'princess', emoji: '👑', label: 'Royal Princess', colors: ['#E63946','#FFD700','#C9A1FF'], bg: 'linear-gradient(135deg,#C9184A,#FF6B35)' },
  { key: 'cars',     emoji: '🏎️', label: 'Racing Cars',    colors: ['#E63946','#FFD166','#4CC9F0'], bg: 'linear-gradient(135deg,#D90429,#EF233C)' },
];

const STEPS = [
  { emoji: '✨', step: '01', title: 'Create your party', desc: 'Pick a theme, fill in the details — date, time, location, and a personal message.' },
  { emoji: '📲', step: '02', title: 'Share the invite', desc: 'Get a unique QR code and link to share via WhatsApp, email, or print.' },
  { emoji: '🎉', step: '03', title: 'Guests RSVP instantly', desc: 'Friends and family confirm in seconds — no app download needed.' },
];

const FEATURES = [
  { emoji: '🎨', title: '5 Stunning Themes', desc: 'Dinosaurs, Unicorns, Princesses, Racing Cars, or a classic Birthday bash — each fully designed.' },
  { emoji: '✉️', title: 'One-tap RSVP', desc: "Guests respond in seconds with their name, dietary needs, and whether they're staying or dropping off." },
  { emoji: '📅', title: 'Add to Calendar', desc: 'Guests can save to Apple, Google, or Outlook calendar with the event link baked in.' },
  { emoji: '🎁', title: 'Gift Registry', desc: "Optionally add a wish list note or link so guests know what the birthday star would love." },
  { emoji: '📊', title: 'Host Dashboard', desc: 'See every RSVP at a glance, track dietary alerts, and export the list as CSV.' },
];

const FAQS = [
  {
    q: 'Is Tiny Party Portal free to use?',
    a: 'Yes — you can create a party page, send themed invitations and collect RSVPs for free. Paid upgrades add extra features when you need them.',
  },
  {
    q: 'Do my guests need to download an app to RSVP?',
    a: 'No. Guests just tap your link or scan the QR code and RSVP in their browser in seconds — no app download and no account required.',
  },
  {
    q: 'What party themes can I choose from?',
    a: 'Five fully-designed themes: Dinosaur Adventure, Unicorn Magic, Royal Princess, Racing Cars and a classic Birthday bash. Each comes with its own fonts, colours and backgrounds.',
  },
  {
    q: 'How do I share my invitation?',
    a: 'You get a unique link and QR code you can send via WhatsApp, text or email — or print onto physical invitations.',
  },
  {
    q: 'Can I see who is coming and any dietary needs?',
    a: 'Yes. Your host dashboard shows every RSVP at a glance, flags dietary alerts, and lets you export the full guest list as a CSV.',
  },
  {
    q: 'What is the Memory Capsule?',
    a: 'A private collection where guests can add photos and messages from the day. Everything stays private to you as the host, so you can keep the memories for your child.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function HomePage() {
  const howRef = useRef(null);

  return (
    <div className="hp-page">
      <SEO
        title="Tiny Party Portal — Birthday Party Invites & RSVP"
        description="The fun way to plan your child's birthday party. Beautiful themed invitations, instant RSVPs, and guest list management all in one place."
        url="https://tinypartyportal.com"
        keywords="kids birthday party invitations, online RSVP, birthday party planner, children's party invites, themed party invitations, free RSVP management"
        jsonLd={faqJsonLd}
      />

      {/* ── HERO ── */}
      <section className="hp-hero">
        <div className="hp-hero-bg" aria-hidden />
        <div className="hp-floating-emojis" aria-hidden>
          <span className="hp-fe hp-fe-1">🎈</span>
          <span className="hp-fe hp-fe-2">🦄</span>
          <span className="hp-fe hp-fe-3">🎂</span>
          <span className="hp-fe hp-fe-4">🦕</span>
          <span className="hp-fe hp-fe-5">🎉</span>
          <span className="hp-fe hp-fe-6">🏎️</span>
          <span className="hp-fe hp-fe-7">👑</span>
          <span className="hp-fe hp-fe-8">⭐</span>
        </div>

        <div className="kb-container hp-hero-content">
          <div className="hp-hero-badge">
            <span>🚀</span> The birthday invite that does everything
          </div>
          <h1 className="hp-hero-title kb-display">
            The easiest way to<br />
            <span className="hp-hero-gradient">plan your kid's</span><br />
            birthday party
          </h1>
          <p className="hp-hero-subtitle kb-body">
            Beautiful themed invitations and instant RSVPs —
            all in one link your guests scan with their phone.
          </p>
          <div className="hp-hero-actions">
            <Link to="/signup" className="kb-btn kb-btn-primary kb-btn-lg hp-cta-btn" id="hero-signup">
              🎂 Create your free party
            </Link>
            <button className="kb-btn kb-btn-secondary kb-btn-lg" onClick={() => howRef.current?.scrollIntoView({ behavior: 'smooth' })}>
              See how it works
            </button>
          </div>
          <p className="hp-hero-note">Free to start · No credit card required</p>
        </div>

        {/* Invite card preview */}
        <div className="kb-container">
          <div className="hp-preview-card">
            <div className="hp-preview-inner">
              <div className="hp-preview-phone">
                <div className="hp-preview-screen">
                  <div className="hp-mock-hero">
                    <span className="hp-mock-emoji">🦄</span>
                    <div className="hp-mock-title">Ella's 5th Birthday!</div>
                    <div className="hp-mock-sub">You're invited to a Unicorn Party</div>
                  </div>
                  <div className="hp-mock-details">
                    <div className="hp-mock-detail">📅 Saturday 14th June, 2025</div>
                    <div className="hp-mock-detail">🕑 2:00 PM – 5:00 PM</div>
                    <div className="hp-mock-detail">📍 123 Rainbow Lane, Sunnyville</div>
                  </div>
                  <div className="hp-mock-btns">
                    <div className="hp-mock-btn-primary" style={{ width: '100%' }}>✉️ RSVP Now</div>
                  </div>
                </div>
              </div>
              <div className="hp-preview-info">
                <div className="hp-preview-stat">
                  <span className="hp-preview-stat-num">24</span>
                  <span className="hp-preview-stat-label">RSVPs received</span>
                </div>
                <div className="hp-preview-divider" />
                <div className="hp-preview-stat">
                  <span className="hp-preview-stat-num">3</span>
                  <span className="hp-preview-stat-label">Dietary alerts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THEMES ── */}
      <section className="kb-section hp-themes-section">
        <div className="kb-container">
          <div className="hp-section-header">
            <h2 className="hp-section-title kb-heading">Pick the perfect theme</h2>
            <p className="hp-section-sub kb-body">Every theme is fully designed — fonts, colors, backgrounds and all.</p>
          </div>
          <div className="hp-themes-grid">
            {THEMES.map((t) => (
              <div key={t.key} className="hp-theme-card" style={{ '--theme-bg': t.bg }}>
                <div className="hp-theme-preview" style={{ background: t.bg }}>
                  <span className="hp-theme-emoji">{t.emoji}</span>
                  <div className="hp-theme-dots">
                    {t.colors.map((c, i) => (
                      <span key={i} className="hp-theme-dot" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div className="hp-theme-label">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="kb-section hp-how-section" ref={howRef} id="how-it-works">
        <div className="kb-container">
          <div className="hp-section-header">
            <h2 className="hp-section-title kb-heading">How it works</h2>
            <p className="hp-section-sub kb-body">Set up in under 5 minutes. Your guests do the rest.</p>
          </div>
          <div className="hp-steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="hp-step-card">
                <div className="hp-step-number">{s.step}</div>
                <div className="hp-step-emoji">{s.emoji}</div>
                <h3 className="hp-step-title">{s.title}</h3>
                <p className="hp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="kb-section hp-features-section">
        <div className="kb-container">
          <div className="hp-section-header">
            <h2 className="hp-section-title kb-heading">Everything you need</h2>
            <p className="hp-section-sub kb-body">No juggling separate apps or group chats.</p>
          </div>
          <div className="hp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="hp-feature-card">
                <div className="hp-feature-emoji">{f.emoji}</div>
                <h3 className="hp-feature-title">{f.title}</h3>
                <p className="hp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── FAQ ── */}
      <section className="kb-section hp-faq-section" id="faq">
        <div className="kb-container">
          <div className="hp-section-header">
            <h2 className="hp-section-title kb-heading">Questions, answered</h2>
            <p className="hp-section-sub kb-body">Everything you need to know before your first party.</p>
          </div>
          <div className="hp-faq-list">
            {FAQS.map((f, i) => (
              <details key={i} className="hp-faq-item">
                <summary className="hp-faq-q">{f.q}</summary>
                <p className="hp-faq-a">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="hp-cta-section">
        <div className="hp-cta-bg" aria-hidden />
        <div className="kb-container hp-cta-content">
          <div className="hp-cta-emoji">🎂</div>
          <h2 className="hp-cta-title kb-display">Ready to plan the<br />perfect party?</h2>
          <p className="hp-cta-sub kb-body">Create your party page in minutes. Free to start.</p>
          <Link to="/signup" className="kb-btn kb-btn-lg hp-cta-btn-final" id="footer-signup">
            🎉 Get started free
          </Link>
        </div>
      </section>

    </div>
  );
}
