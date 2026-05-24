import React from 'react';
import ThemedPage from '../theme/ThemedPage';
import ThemeIllustration from '../theme/ThemeIllustration';
import { THEME_COLOR_SCHEMES } from '../theme/themes';
import './guest/EventLandingPage.css';

export default function ThemeDebugPage() {
  const themes = [
    { key: 'kids-generic', label: 'Classic Balloons' },
    { key: 'kids-dino', label: 'Dino Adventure' },
    { key: 'kids-unicorn', label: 'Unicorn Magic' },
    { key: 'kids-princess', label: 'Royal Princess' },
    { key: 'kids-cars', label: 'Racing Cars' },
  ];

  return (
    <div style={{ padding: '40px 20px', background: '#121214', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Theme Debug Page</h1>
        <p style={{ color: '#aaa', fontSize: '1.1rem' }}>Displaying all 20 theme and color combinations (5 themes × 4 color schemes)</p>
      </header>

      {themes.map(t => {
        const schemes = THEME_COLOR_SCHEMES[t.key] || {};
        return (
          <div key={t.key} style={{ marginBottom: '60px' }}>
            <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '24px', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{t.label}</span>
              <span style={{ fontSize: '1.2rem', color: '#888' }}>({t.key})</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
              {Object.keys(schemes).map(colorKey => {
                const schemeName = schemes[colorKey].label;
                const mockEvent = {
                  name: "Robin's 3rd Birthday",
                  childName: "Robin",
                  date: "2026-06-21",
                  time: "11:00",
                  endTime: "14:00",
                  location: "Myuna Farm",
                  description: "We're so excited to celebrate Robin's special day! Join us for a fun adventure. Lunch will be provided.",
                  rsvpEnabled: true,
                };
                
                return (
                  <div key={colorKey} style={{ border: '1px solid #333', borderRadius: '16px', overflow: 'hidden', background: '#1e1e24', padding: '16px' }}>
                    <div style={{ marginBottom: '12px', fontSize: '0.9rem', color: '#aaa', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                      <span>Color: {colorKey}</span>
                      <span style={{ color: schemes[colorKey].color }}>● {schemeName}</span>
                    </div>
                    {/* Scale invitation card down for debug viewing */}
                    <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', height: '480px', overflow: 'hidden', borderRadius: '28px', border: '1px solid #444' }}>
                      <ThemedPage themeKey={t.key} themeColor={colorKey}>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div className="elp-card-invitation" style={{ animation: 'none', background: 'rgba(255, 255, 255, 0.96)' }}>
                            <div className="elp-card-border-inner" style={{ padding: '24px 16px' }}>
                              
                              <div className="elp-invitation-intro" style={{ marginBottom: '6px' }}>
                                <span className="elp-invitation-badge">You're Invited!</span>
                              </div>

                              <div className="elp-hero" style={{ padding: '4px 0' }}>
                                <h1 className="elp-title" style={{ fontSize: '1.35rem', margin: '0 0 4px' }}>{mockEvent.name}</h1>
                                <p className="elp-subtitle" style={{ fontSize: '0.8rem' }}>Celebrating {mockEvent.childName}'s special day!</p>
                              </div>

                              <div className="elp-illustration-container" style={{ margin: '8px 0' }}>
                                <div className="elp-illustration-wrap" style={{ maxWidth: '130px', animation: 'none' }}>
                                  <ThemeIllustration theme={t.key} themeColor={colorKey} />
                                </div>
                              </div>

                              <div className="elp-divider" style={{ margin: '8px 0' }}>
                                <span className="elp-divider-dot"></span>
                                <span className="elp-divider-line" style={{ width: '40px' }}></span>
                                <span className="elp-divider-dot"></span>
                              </div>

                              <div className="elp-details-clean" style={{ gap: '10px', margin: '6px 0' }}>
                                <div className="elp-detail-item" style={{ gap: '2px' }}>
                                  <span className="elp-detail-icon-clean" style={{ fontSize: '1.2rem' }}>📅</span>
                                  <div className="elp-detail-content-clean">
                                    <div className="elp-detail-label-clean" style={{ fontSize: '0.6rem' }}>Date</div>
                                    <div className="elp-detail-value-clean" style={{ fontSize: '0.85rem' }}>Sunday, June 21, 2026</div>
                                  </div>
                                </div>
                                <div className="elp-detail-item" style={{ gap: '2px' }}>
                                  <span className="elp-detail-icon-clean" style={{ fontSize: '1.2rem' }}>🕐</span>
                                  <div className="elp-detail-content-clean">
                                    <div className="elp-detail-label-clean" style={{ fontSize: '0.6rem' }}>Time</div>
                                    <div className="elp-detail-value-clean" style={{ fontSize: '0.85rem' }}>11:00 AM – 2:00 PM</div>
                                  </div>
                                </div>
                                <div className="elp-detail-item" style={{ gap: '2px' }}>
                                  <span className="elp-detail-icon-clean" style={{ fontSize: '1.2rem' }}>📍</span>
                                  <div className="elp-detail-content-clean">
                                    <div className="elp-detail-label-clean" style={{ fontSize: '0.6rem' }}>Location</div>
                                    <div className="elp-detail-value-clean" style={{ fontSize: '0.85rem' }}>{mockEvent.location}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="elp-card-rsvp-wrap" style={{ marginTop: '6px' }}>
                                <button className="elp-btn elp-btn-accent elp-btn-sm elp-card-rsvp-btn" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={(e) => e.preventDefault()}>
                                  ✉️ RSVP Now
                                </button>
                              </div>

                            </div>
                          </div>
                        </div>
                      </ThemedPage>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
