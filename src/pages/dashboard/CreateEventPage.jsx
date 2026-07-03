import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db, trackEvent } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { THEME_COLOR_SCHEMES, getTheme } from '../../theme/themes';
import LocationInput from '../../components/LocationInput';
import ThemeIllustration from '../../theme/ThemeIllustration';
import './CreateEventPage.css';

const THEMES = [
  { key: 'generic', emoji: '🎈', label: 'Classic' },
  { key: 'dino', emoji: '🦕', label: 'Dino' },
  { key: 'unicorn', emoji: '🦄', label: 'Unicorn' },
  { key: 'princess', emoji: '👑', label: 'Princess' },
  { key: 'cars', emoji: '🏎️', label: 'Cars' },
];

function generateSlug(childName) {
  const year = new Date().getFullYear();
  const base = childName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-birthday-${year}-${suffix}`;
}

function Toggle({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} style={toggleStyles.wrap}>
      <div
        style={{
          ...toggleStyles.track,
          background: checked ? 'var(--kb-mint)' : 'var(--kb-border)',
        }}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={toggleStyles.input}
        />
        <div
          style={{
            ...toggleStyles.thumb,
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
      </div>
      <span style={toggleStyles.label}>{label}</span>
    </label>
  );
}

export default function CreateEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [childName, setChildName] = useState('');
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('generic');
  const [themeColor, setThemeColor] = useState('default');
  const [date, setDate] = useState('');
  const [rsvpByDate, setRsvpByDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [hostContact, setHostContact] = useState('');
  const [hostName, setHostName] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [parkingInfo, setParkingInfo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [lockDownRSVP, setLockDownRSVP] = useState(false);
  const [askChildAge, setAskChildAge] = useState(true);
  const [askAdultCount, setAskAdultCount] = useState(true);
  const [askDietary, setAskDietary] = useState(true);
  const [kidsEstimate, setKidsEstimate] = useState(10);
  const [adultsEstimate, setAdultsEstimate] = useState(10);
  const [giftRegistryNote, setGiftRegistryNote] = useState('');
  const [giftRegistryLink, setGiftRegistryLink] = useState('');
  const [requireGuestMatch, setRequireGuestMatch] = useState(false);
  const [authType, setAuthType] = useState('name');
  const [eventPassword, setEventPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!childName.trim() || !name.trim() || !date) {
      const missing = [
        !childName.trim() && 'child_name',
        !name.trim() && 'event_name',
        !date && 'date',
      ].filter(Boolean).join(',');
      trackEvent('create_event_validation_failed', { missing });
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      // Uniqueness comes from the random suffix in generateSlug(). We intentionally
      // do NOT query existing events to check for collisions: Firestore rules forbid
      // enumerating events you don't own, so that query throws "Missing or insufficient
      // permissions" and breaks event creation entirely.
      const slug = generateSlug(childName);

      const docRef = await addDoc(collection(db, 'events'), {
        hostId: user.uid,
        name: name.trim(),
        childName: childName.trim(),
        slug,
        theme,
        themeColor,
        date,
        time,
        endTime,
        rsvpByDate,
        location: location.trim(),
        address: address.trim(),
        hostName: hostName.trim(),
        hostContact: hostContact.trim(),
        description: description.trim(),
        schedule: schedule.trim(),
        parkingInfo: parkingInfo.trim(),
        rsvpEnabled,
        showParentAttendance: true,
        lockDownRSVP,
        siblingsAllowed: true,
        stayOrDropOffAllowed: true,
        askChildAge,
        askAdultCount,
        askDietary,
        kidsEstimate: kidsEstimate !== '' ? Number(kidsEstimate) : 10,
        adultsEstimate: adultsEstimate !== '' ? Number(adultsEstimate) : 10,
        giftRegistryNote: giftRegistryNote.trim(),
        giftRegistryLink: giftRegistryLink.trim(),
        requireGuestMatch,
        authType,
        eventPassword: authType === 'password' ? eventPassword : '',
        published: true,
        createdAt: serverTimestamp(),
      });
      trackEvent('event_created', {
        theme,
        theme_color: themeColor,
        rsvp_enabled: rsvpEnabled,
        lockdown: lockDownRSVP,
      });
      toast.success('Party created! 🎉');
      navigate(`/dashboard/event/${docRef.id}`);
    } catch (err) {
      console.error(err);
      trackEvent('create_event_failed', { reason: 'error' });
      toast.error('Failed to create party. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const activeThemeObj = getTheme(`kids-${theme}`, themeColor);

  return (
    <div className="cep-root" style={{ minHeight: '100vh', background: 'var(--kb-bg)' }}>
      <div style={styles.inner}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate('/dashboard')} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ marginBottom: 12 }}>
            ← Back to Dashboard
          </button>
          <h1 style={styles.heading}>
            <span style={{ fontSize: 28 }}>🎉</span> Create a Party
          </h1>
          <p style={styles.subheading}>Fill in the details to set up your event page.</p>
        </div>

        <div className="cep-main-grid">
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Section: Basic Info */}
            <SectionTitle>Basic Info</SectionTitle>

            <div style={styles.row}>
              <div className="kb-field" style={{ flex: 1 }}>
                <label className="kb-label" htmlFor="ce-childName">Child's Name *</label>
                <input
                  id="ce-childName"
                  type="text"
                  className="kb-input"
                  placeholder="e.g. Ella"
                  value={childName}
                  onChange={e => setChildName(e.target.value)}
                  required
                />
              </div>
              <div className="kb-field" style={{ flex: 2 }}>
                <label className="kb-label" htmlFor="ce-name">Party Name *</label>
                <input
                  id="ce-name"
                  type="text"
                  className="kb-input"
                  placeholder="e.g. Ella's 5th Birthday!"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={styles.row}>
              <div className="kb-field" style={{ flex: 1 }}>
                <label className="kb-label" htmlFor="ce-hostName">Host Name (shown to guests)</label>
                <input
                  id="ce-hostName"
                  type="text"
                  className="kb-input"
                  placeholder="e.g. Sarah"
                  value={hostName}
                  onChange={e => setHostName(e.target.value)}
                />
              </div>
              <div className="kb-field" style={{ flex: 1 }}>
                <label className="kb-label" htmlFor="ce-hostContact">Host Contact Info (shown to guests)</label>
                <input
                  id="ce-hostContact"
                  type="text"
                  className="kb-input"
                  placeholder="e.g. 0400 000 000"
                  value={hostContact}
                  onChange={e => setHostContact(e.target.value)}
                />
              </div>
            </div>

            {/* Theme Picker */}
            <SectionTitle>Theme & Style</SectionTitle>
            <div className="kb-field">
              <span className="kb-label">Choose a Theme</span>
              <div style={styles.themePicker}>
                {THEMES.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    style={{
                      ...styles.themeCard,
                      ...(theme === t.key ? styles.themeCardActive : {}),
                    }}
                    onClick={() => { setTheme(t.key); setThemeColor('default'); }}
                  >
                    <span style={styles.themeEmoji}>{t.emoji}</span>
                    <span style={styles.themeLabel}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="kb-field">
              <span className="kb-label">Accent Color</span>
              <div style={styles.colorPicker}>
                {Object.entries(THEME_COLOR_SCHEMES[`kids-${theme}`] || {}).map(([key, scheme]) => (
                  <button
                    key={key}
                    type="button"
                    title={scheme.label}
                    style={{
                      ...styles.colorBtn,
                      background: scheme.color,
                      border: themeColor === key ? '3px solid #fff' : '2px solid transparent',
                      boxShadow: themeColor === key ? '0 0 0 2px var(--kb-coral)' : 'none',
                    }}
                    onClick={() => setThemeColor(key)}
                  >
                    {themeColor === key && <span style={styles.colorCheck}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <SectionTitle>Date & Time</SectionTitle>
            <div style={styles.row}>
              <div className="kb-field" style={{ flex: 1 }}>
                <label className="kb-label" htmlFor="ce-date">Party Date *</label>
                <input
                  id="ce-date"
                  type="date"
                  className="kb-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="kb-field" style={{ flex: 1 }}>
                <label className="kb-label" htmlFor="ce-time">Start Time</label>
                <input
                  id="ce-time"
                  type="time"
                  className="kb-input"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
              <div className="kb-field" style={{ flex: 1 }}>
                <label className="kb-label" htmlFor="ce-endTime">End Time</label>
                <input
                  id="ce-endTime"
                  type="time"
                  className="kb-input"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <SectionTitle>Location</SectionTitle>
            <div style={styles.row}>
              <div className="kb-field" style={{ flex: 1, marginBottom: 0 }}>
                <label className="kb-label" htmlFor="ce-location">Event/Venue Name</label>
                <input
                  id="ce-location"
                  type="text"
                  className="kb-input"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. SuperZu Playcentre"
                />
              </div>
              <div className="kb-field" style={{ flex: 1, marginBottom: 0 }}>
                <label className="kb-label" htmlFor="ce-address">Address</label>
                <LocationInput
                  id="ce-address"
                  value={address}
                  onChange={setAddress}
                  placeholder="Search or enter address..."
                />
              </div>
            </div>

            {/* Additional Sections */}
            <SectionTitle>Details for Guests</SectionTitle>
            <div className="kb-field">
              <label className="kb-label" htmlFor="ce-description">Message to Guests</label>
              <textarea
                id="ce-description"
                className="kb-input"
                placeholder="e.g. We're so excited to celebrate with you! Please note that there will be a jumper..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                style={styles.textarea}
              />
            </div>

            <button
              type="button"
              style={styles.advancedBtn}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '− Hide' : '+ Show'} Advanced RSVP & Registry Options
            </button>

            {showAdvanced && (
              <div style={styles.advancedContainer}>
                <SectionTitle>Advanced RSVP</SectionTitle>
                <div className="kb-field">
                  <label className="kb-label" htmlFor="ce-rsvpByDate">RSVP By Date</label>
                  <input
                    id="ce-rsvpByDate"
                    type="date"
                    className="kb-input"
                    value={rsvpByDate}
                    onChange={e => setRsvpByDate(e.target.value)}
                  />
                </div>
                
                <div style={{...styles.toggleGroup, marginTop: 12}}>
                  <Toggle
                    id="ce-rsvp-enabled"
                    checked={rsvpEnabled}
                    onChange={setRsvpEnabled}
                    label="Enable RSVP collection"
                  />
                  <Toggle
                    id="ce-lockdown"
                    checked={lockDownRSVP}
                    onChange={setLockDownRSVP}
                    label="Require approval for unknown guests"
                  />
                  <Toggle
                    id="ce-guestmatch"
                    checked={requireGuestMatch}
                    onChange={setRequireGuestMatch}
                    label="Require Guest List Match (only invited guests can RSVP)"
                  />
                </div>

                <SectionTitle>Event Portal Security</SectionTitle>
                <div className="kb-field" style={{marginTop: 8}}>
                  <label className="kb-label">Cross-device Re-authentication Method</label>
                  <select 
                    className="kb-input" 
                    value={authType} 
                    onChange={e => setAuthType(e.target.value)}
                    style={{ marginBottom: 12 }}
                  >
                    <option value="name">Name & Contact Lookup</option>
                    <option value="password">Event Password</option>
                  </select>
                  {authType === 'password' && (
                    <>
                      <label className="kb-label">Event Password</label>
                      <input 
                        className="kb-input" 
                        type="text" 
                        placeholder="e.g. Birthday2026" 
                        value={eventPassword} 
                        onChange={e => setEventPassword(e.target.value)} 
                      />
                    </>
                  )}
                </div>

                <div style={{...styles.row, marginTop: 16}}>
                   <div className="kb-field" style={{flex: 1}}>
                      <label className="kb-label">Est. Kids</label>
                      <input type="number" className="kb-input" value={kidsEstimate} onChange={e => setKidsEstimate(e.target.value)} />
                   </div>
                   <div className="kb-field" style={{flex: 1}}>
                      <label className="kb-label">Est. Adults</label>
                      <input type="number" className="kb-input" value={adultsEstimate} onChange={e => setAdultsEstimate(e.target.value)} />
                   </div>
                </div>

                <SectionTitle>Gift Registry</SectionTitle>
                <div className="kb-field">
                  <label className="kb-label">Note</label>
                  <input className="kb-input" placeholder="e.g. No gifts please, just your presence!" value={giftRegistryNote} onChange={e => setGiftRegistryNote(e.target.value)} />
                </div>
                <div className="kb-field" style={{marginTop: 8}}>
                  <label className="kb-label">Link</label>
                  <input className="kb-input" placeholder="https://..." value={giftRegistryLink} onChange={e => setGiftRegistryLink(e.target.value)} />
                </div>
              </div>
            )}

            <div style={styles.submitRow}>
              <button
                type="button"
                className="kb-btn kb-btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="kb-btn kb-btn-primary"
                disabled={loading}
                style={styles.submitBtn}
              >
                {loading ? <span style={styles.spinner} /> : '🎉'}
                {loading ? 'Creating…' : 'Create Party'}
              </button>
            </div>
          </form>

          {/* Preview Sidebar */}
          <div style={styles.previewSidebar}>
            <div style={styles.previewSticky}>
              <h3 style={styles.previewTitle}>Live Preview</h3>
              <div style={{
                ...styles.previewCard,
                background: `linear-gradient(135deg, ${activeThemeObj.vars['--t-bg-from']} 0%, ${activeThemeObj.vars['--t-bg-to']} 100%)`,
                borderColor: activeThemeObj.vars['--t-border'],
                color: activeThemeObj.vars['--t-text'],
              }}>
                <div style={{ width: 80, height: 80, margin: '0 auto 16px' }}>
                  <ThemeIllustration theme={`kids-${theme}`} themeColor={themeColor} />
                </div>
                <h4 style={{ margin: '0 0 8px', fontSize: 18, fontFamily: 'var(--kb-font-display)', textAlign: 'center' }}>
                  {name || "Your Party Name"}
                </h4>
                <p style={{ margin: 0, fontSize: 13, textAlign: 'center', opacity: 0.8 }}>
                  Celebrating {childName || "the birthday star"}!
                </p>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${activeThemeObj.vars['--t-border']}`, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                     <span>📅</span> {date ? new Date(date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) : "Pick a date"}
                   </div>
                   {time && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <span>🕐</span> {time} {endTime && `– ${endTime}`}
                     </div>
                   )}
                   {location && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <span>📍</span>
                       <div>
                         <div style={{ fontWeight: 'bold' }}>{location}</div>
                         {address && <div style={{ opacity: 0.8, fontSize: '0.9em' }}>{address}</div>}
                       </div>
                     </div>
                   )}
                   {(hostName || hostContact) && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                       <span>📞</span> {[hostName, hostContact].filter(Boolean).join(' - ')}
                     </div>
                   )}
                </div>
                <div style={{
                  marginTop: 20,
                  background: activeThemeObj.vars['--t-btn-bg'],
                  color: activeThemeObj.vars['--t-btn-text'],
                  padding: '10px',
                  borderRadius: 12,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: 14
                }}>
                  RSVP Now
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--kb-text-muted)', marginTop: 12, textAlign: 'center' }}>
                This is a mini preview. Your full invitation will be beautifully themed!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={sectionStyles.wrap}>
      <span style={sectionStyles.text}>{children}</span>
      <div style={sectionStyles.line} />
    </div>
  );
}

const sectionStyles = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  text: {
    fontFamily: 'var(--kb-font-ui)',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--kb-text-muted)',
    whiteSpace: 'nowrap',
  },
  line: {
    flex: 1,
    height: 1,
    background: 'var(--kb-border)',
  },
};

const toggleStyles = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    padding: '10px 0',
  },
  track: {
    position: 'relative',
    width: 44,
    height: 24,
    borderRadius: 100,
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  input: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  thumb: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    transition: 'transform 0.2s',
    pointerEvents: 'none',
  },
  label: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: 15,
    color: 'var(--kb-text)',
  },
};

const styles = {
  root: {
    minHeight: '100vh',
    background: 'var(--kb-bg)',
    padding: '40px 24px',
  },
  inner: {
    maxWidth: 1100,
    margin: '0 auto',
  },
  header: {
    marginBottom: 36,
  },
  heading: {
    fontFamily: 'var(--kb-font-display)',
    fontSize: 32,
    fontWeight: 700,
    color: 'var(--kb-text)',
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  subheading: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: 15,
    color: 'var(--kb-text-muted)',
    margin: 0,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: 40,
    alignItems: 'start',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  row: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  textarea: {
    resize: 'vertical',
    minHeight: 80,
  },
  colorPicker: {
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
    minHeight: 44,
  },
  colorBtn: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    padding: 0,
  },
  colorCheck: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  },
  colorLabel: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: 13,
    color: 'var(--kb-text-muted)',
    marginTop: 6,
  },
  themePicker: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  themeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '14px 18px',
    border: '2px solid var(--kb-border)',
    borderRadius: 14,
    background: 'var(--kb-surface-2)',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s, transform 0.15s',
    outline: 'none',
  },
  themeCardActive: {
    border: '2px solid var(--kb-coral)',
    background: 'rgba(255,107,107,0.15)',
    transform: 'scale(1.05)',
  },
  themeEmoji: {
    fontSize: 28,
  },
  themeLabel: {
    fontFamily: 'var(--kb-font-ui)',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--kb-text-muted)',
  },
  toggleGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '8px 16px',
    background: 'var(--kb-surface-2)',
    borderRadius: 14,
    border: '1px solid var(--kb-border)',
  },
  submitRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 20,
    borderTop: '1px solid var(--kb-border)',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 160,
    justifyContent: 'center',
  },
  spinner: {
    display: 'inline-block',
    width: 16,
    height: 16,
    border: '2px solid var(--kb-border)',
    borderTopColor: 'var(--kb-text)',
    borderRadius: '50%',
    animation: 'kb-spin 0.7s linear infinite',
  },
  advancedBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--kb-text-muted)',
    fontFamily: 'var(--kb-font-ui)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  advancedContainer: {
    background: 'var(--kb-surface-2)',
    padding: 16,
    borderRadius: 14,
    border: '1px solid var(--kb-border)',
    marginTop: 8,
  },
  previewSidebar: {
    display: 'block',
  },
  previewSticky: {
    position: 'sticky',
    top: 40,
  },
  previewTitle: {
    fontFamily: 'var(--kb-font-display)',
    fontSize: 18,
    margin: '0 0 16px 0',
    color: 'var(--kb-text)',
  },
  previewCard: {
    borderRadius: 24,
    padding: 24,
    border: '1px solid',
    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
  },
};
