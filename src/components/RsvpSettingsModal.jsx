import React, { useState } from 'react';
import { THEME_COLOR_SCHEMES, getTheme } from '../theme/themes';
import ThemeIllustration from '../theme/ThemeIllustration';

const toggleStyles = {
  wrap: { display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px', userSelect: 'none' },
  track: { width: '44px', height: '24px', borderRadius: '12px', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  input: { opacity: 0, width: 0, height: 0, position: 'absolute' },
  thumb: { width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '2px', left: '2px', transition: 'transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  label: { fontSize: '0.95rem', color: 'var(--kb-text)', fontWeight: 500 }
};

function Toggle({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} style={toggleStyles.wrap}>
      <div style={{ ...toggleStyles.track, background: checked ? 'var(--kb-mint)' : 'var(--kb-input-border)' }}>
        <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={toggleStyles.input} />
        <div style={{ ...toggleStyles.thumb, transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
      </div>
      <span style={toggleStyles.label}>{label}</span>
    </label>
  );
}

const phoneStyles = {
  phoneFrame: {
    width: '100%',
    maxWidth: '300px',
    height: '520px',
    background: '#18181b',
    borderRadius: '40px',
    border: '10px solid #2d2d30',
    boxShadow: '0 16px 36px rgba(0,0,0,0.25), inset 0 0 3px rgba(255,255,255,0.15)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    margin: '0 auto',
    boxSizing: 'border-box',
  },
  notch: {
    position: 'absolute',
    top: '8px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100px',
    height: '20px',
    background: '#2d2d30',
    borderRadius: '12px',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  notchCamera: {
    width: '8px',
    height: '8px',
    background: '#111',
    borderRadius: '50%',
    marginLeft: 'auto',
    marginRight: '12px',
    border: '1.5px solid #222',
  },
  screen: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    padding: '28px 8px 12px 8px',
    scrollbarWidth: 'none',
  },
  scrollContent: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }
};

function MiniPreview({ 
  themeKey, 
  themeColor, 
  themeMode,
  name, 
  childName, 
  date, 
  time, 
  endTime, 
  rsvpByDate,
  location, 
  photoUrl,
  description,
  giftRegistryNote,
  giftRegistryLink,
  rsvpEnabled
}) {
  const theme = getTheme(themeKey, themeColor);
  const cssVars = Object.fromEntries(
    Object.entries(theme.vars).map(([k, v]) => [k, v])
  );
  const patternUrl = theme.patternSvg(theme.vars['--t-accent']);

  const formattedDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
  }) : 'Jun 21, 2026';

  const formattedRsvpBy = rsvpByDate ? new Date(rsvpByDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  }) : null;

  const formatTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`;
  };
  const tStart = formatTime(time) || '11:00 AM';
  const tEnd = formatTime(endTime) || '2:00 PM';

  const normalizedThemeKey = themeKey && !themeKey.startsWith('kids-') ? `kids-${themeKey}` : themeKey;

  return (
    <div style={phoneStyles.phoneFrame}>
      <div style={phoneStyles.notch}>
        <div style={phoneStyles.notchCamera} />
      </div>

      <div 
        style={{ 
          ...phoneStyles.screen, 
          ...cssVars,
          background: `${patternUrl}, linear-gradient(160deg, var(--t-bg-from) 0%, var(--t-bg-to) 100%)`,
          backgroundAttachment: 'local',
          overflowY: 'hidden'
        }} 
        className="elp-container-preview tp-root"
        data-theme={themeMode === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : themeMode}
      >
        <div style={{ ...phoneStyles.scrollContent, transform: 'scale(0.9)', transformOrigin: 'top center' }}>
          
          <div className="elp-card-invitation" style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="elp-card-border-inner" style={{ padding: '24px 16px' }}>
              
              <div className="elp-invitation-intro">
                <span className="elp-invitation-badge">You're Invited!</span>
              </div>

              <div className="elp-hero" style={{ padding: '4px 0' }}>
                <h1 className="elp-title" style={{ fontSize: '1.35rem', margin: '0 0 4px' }}>{name || 'Party Name'}</h1>
                {childName && <p className="elp-subtitle" style={{ fontSize: '0.85rem' }}>Celebrating {childName}'s special day!</p>}
              </div>

              <div className="elp-illustration-container" style={{ margin: '8px 0', display: 'flex', justifyContent: 'center' }}>
                {photoUrl ? (
                  <div className="elp-photo-wrap" style={{ width: '100px', height: '100px' }}>
                    <img src={photoUrl} alt="Event" className="elp-photo" />
                  </div>
                ) : (
                  <div className="elp-illustration-wrap" style={{ maxWidth: '120px', animation: 'none' }}>
                    <ThemeIllustration theme={normalizedThemeKey} themeColor={themeColor} />
                  </div>
                )}
              </div>

              <div className="elp-divider" style={{ margin: '10px 0' }}>
                <span className="elp-divider-dot"></span>
                <span className="elp-divider-line" style={{ width: '40px' }}></span>
                <span className="elp-divider-dot"></span>
              </div>

              <div className="elp-details-clean" style={{ gap: '12px' }}>
                <div className="elp-detail-item">
                  <span className="elp-detail-icon-clean" style={{ fontSize: '1.4rem' }}>📅</span>
                  <div className="elp-detail-content-clean">
                    <div className="elp-detail-label-clean">Date</div>
                    <div className="elp-detail-value-clean" style={{ fontSize: '0.85rem' }}>{formattedDate}</div>
                  </div>
                </div>
                <div className="elp-detail-item">
                  <span className="elp-detail-icon-clean" style={{ fontSize: '1.4rem' }}>🕐</span>
                  <div className="elp-detail-content-clean">
                    <div className="elp-detail-label-clean">Time</div>
                    <div className="elp-detail-value-clean" style={{ fontSize: '0.85rem' }}>{tStart} – {tEnd}</div>
                  </div>
                </div>
                <div className="elp-detail-item">
                  <span className="elp-detail-icon-clean" style={{ fontSize: '1.4rem' }}>📍</span>
                  <div className="elp-detail-content-clean">
                    <div className="elp-detail-label-clean">Location</div>
                    <div className="elp-detail-value-clean" style={{ fontSize: '0.85rem' }}>{location || 'Party Location'}</div>
                  </div>
                </div>
              </div>

              {formattedRsvpBy && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--t-accent)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Please RSVP by {formattedRsvpBy}
                  </span>
                </div>
              )}

              {description && (
                <>
                  <div className="elp-divider" style={{ margin: '10px 0' }}>
                    <span className="elp-divider-dot"></span>
                    <span className="elp-divider-line" style={{ width: '40px' }}></span>
                    <span className="elp-divider-dot"></span>
                  </div>
                  <div className="elp-desc-clean">
                    <p style={{ fontSize: '0.82rem', margin: 0, color: 'var(--t-text)' }}>{description}</p>
                  </div>
                </>
              )}

              {rsvpEnabled && (
                <div className="elp-card-rsvp-wrap" style={{ marginTop: '12px' }}>
                  <button className="elp-btn elp-btn-accent elp-btn-sm elp-card-rsvp-btn" style={{ padding: '8px 12px', fontSize: '0.8rem', width: '100%' }} onClick={(e) => e.preventDefault()}>
                    ✉️ RSVP Now
                  </button>
                </div>
              )}
              
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function RsvpSettingsModal({ event, onClose, onSave }) {
  const [rsvpEnabled, setRsvpEnabled] = useState(event?.rsvpEnabled !== false);
  const [lockDownRSVP, setLockDownRSVP] = useState(event?.lockDownRSVP === true);
  const [askChildAge, setAskChildAge] = useState(event?.askChildAge !== false);
  const [askAdultCount, setAskAdultCount] = useState(event?.askAdultCount !== false);
  const [kidsEstimate, setKidsEstimate] = useState(event?.kidsEstimate ?? (event?.guestEstimate ? Math.floor(event?.guestEstimate / 2) : 10));
  const [adultsEstimate, setAdultsEstimate] = useState(event?.adultsEstimate ?? (event?.guestEstimate ? Math.ceil(event?.guestEstimate / 2) : 10));
  const [rsvpByDate, setRsvpByDate] = useState(event?.rsvpByDate || '');

  const handleSave = () => {
    onSave({
      rsvpEnabled,
      lockDownRSVP,
      askChildAge,
      askAdultCount,
      kidsEstimate: kidsEstimate ? parseInt(kidsEstimate, 10) : 0,
      adultsEstimate: adultsEstimate ? parseInt(adultsEstimate, 10) : 0,
      rsvpByDate
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      zIndex: 2000, padding: '24px', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--kb-surface)', borderRadius: 24, padding: 32,
        width: '100%', maxWidth: 900, display: 'flex', gap: 32, flexWrap: 'wrap',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        
        {/* Left Side: Settings */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--kb-font-display)', color: 'var(--kb-text)' }}>⚙️ RSVP Settings</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--kb-text-muted)' }}>✕</button>
          </div>

          <div style={{ background: 'var(--kb-surface-2)', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
            <Toggle id="toggle-rsvp-modal" checked={rsvpEnabled} onChange={setRsvpEnabled} label="Enable RSVP Tracking" />
            <p style={{ fontSize: '0.85rem', color: 'var(--kb-text-muted)', margin: '8px 0 0 56px' }}>
              Allow guests to submit their RSVP through the invite link.
            </p>
          </div>

          <div style={{ opacity: rsvpEnabled ? 1 : 0.5, pointerEvents: rsvpEnabled ? 'auto' : 'none' }}>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--kb-text)', marginBottom: 8 }}>
                Estimated Guests
              </label>
              <div style={{ display: 'flex', gap: 12, maxWidth: 300 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--kb-text-muted)', marginBottom: 4, display: 'block' }}>Kids</label>
                  <input
                    type="number"
                    className="kb-input"
                    min="0"
                    value={kidsEstimate}
                    onChange={e => setKidsEstimate(e.target.value)}
                    placeholder="10"
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--kb-text-muted)', marginBottom: 4, display: 'block' }}>Adults</label>
                  <input
                    type="number"
                    className="kb-input"
                    min="0"
                    value={adultsEstimate}
                    onChange={e => setAdultsEstimate(e.target.value)}
                    placeholder="10"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--kb-text)', marginBottom: 8 }}>
                RSVP Deadline
              </label>
              <input
                type="date"
                className="kb-input"
                value={rsvpByDate}
                onChange={e => setRsvpByDate(e.target.value)}
                style={{ width: '100%', maxWidth: 300 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 -8px 0' }}>Form Questions</h3>
              <Toggle id="ask-age-modal" checked={askChildAge} onChange={setAskChildAge} label="Ask for guest child's age" />
              <Toggle id="ask-adults-modal" checked={askAdultCount} onChange={setAskAdultCount} label="Ask for number of adults attending" />

              <h3 style={{ fontSize: '1.1rem', margin: '16px 0 -8px 0' }}>Security</h3>
              <Toggle id="lock-rsvp-modal" checked={lockDownRSVP} onChange={setLockDownRSVP} label="Lock RSVP list (Require approval for guests not on your list)" />
            </div>

          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={onClose} className="kb-btn kb-btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button onClick={handleSave} className="kb-btn kb-btn-primary" style={{ flex: 1 }}>Save Settings</button>
          </div>

        </div>

        {/* Right Side: Preview */}
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--kb-surface-2)', padding: 24, borderRadius: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--kb-text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invitation Preview</h3>
          <MiniPreview 
            themeKey={event?.theme}
            themeColor={event?.themeColor}
            themeMode={event?.themeMode}
            name={event?.name}
            childName={event?.childName}
            date={event?.date}
            time={event?.time}
            endTime={event?.endTime}
            rsvpByDate={rsvpByDate}
            location={event?.location}
            photoUrl={event?.photoUrl}
            description={event?.description}
            rsvpEnabled={rsvpEnabled}
          />
        </div>

      </div>
    </div>
  );
}
