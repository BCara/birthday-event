import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { THEME_COLOR_SCHEMES } from '../../theme/themes';
import LocationInput from '../../components/LocationInput';

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
  const [themeMode, setThemeMode] = useState('light');
  const [date, setDate] = useState('');
  const [rsvpByDate, setRsvpByDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [parkingInfo, setParkingInfo] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [lockDownRSVP, setLockDownRSVP] = useState(false);
  const [askChildAge, setAskChildAge] = useState(true);
  const [askAdultCount, setAskAdultCount] = useState(true);
  const [kidsEstimate, setKidsEstimate] = useState(10);
  const [adultsEstimate, setAdultsEstimate] = useState(10);
  const [giftRegistryNote, setGiftRegistryNote] = useState('');
  const [giftRegistryLink, setGiftRegistryLink] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!childName.trim() || !name.trim() || !date) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const slug = generateSlug(childName);
      const docRef = await addDoc(collection(db, 'events'), {
        hostId: user.uid,
        name: name.trim(),
        childName: childName.trim(),
        slug,
        theme,
        themeColor,
        themeMode,
        date,
        time,
        endTime,
        rsvpByDate,
        location: location.trim(),
        description: description.trim(),
        schedule: schedule.trim(),
        parkingInfo: parkingInfo.trim(),
        rsvpEnabled,
        lockDownRSVP,
        siblingsAllowed: true,
        stayOrDropOffAllowed: true,
        askChildAge,
        askAdultCount,
        kidsEstimate: kidsEstimate !== '' ? Number(kidsEstimate) : 10,
        adultsEstimate: adultsEstimate !== '' ? Number(adultsEstimate) : 10,
        giftRegistryNote: giftRegistryNote.trim(),
        giftRegistryLink: giftRegistryLink.trim(),
        published: true,
        createdAt: serverTimestamp(),
      });
      toast.success('Party created! 🎉');
      navigate(`/dashboard/event/${docRef.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create party. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      <div style={styles.inner}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.heading}>
            <span style={{ fontSize: 28 }}>🎉</span> Create a Party
          </h1>
          <p style={styles.subheading}>Fill in the details to set up your event page.</p>
        </div>

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

          {/* Theme Picker */}
          <div className="kb-field">
            <span className="kb-label">Theme</span>
            <div style={styles.themePicker}>
              {THEMES.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTheme(t.key);
                    setThemeColor('default');
                  }}
                  style={{
                    ...styles.themeCard,
                    ...(theme === t.key ? styles.themeCardActive : {}),
                  }}
                >
                  <span style={styles.themeEmoji}>{t.emoji}</span>
                  <span style={styles.themeLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color Picker */}
          <div className="kb-field" style={{ marginTop: 8 }}>
            <span className="kb-label">Theme Accent Color</span>
            <div style={styles.colorPicker}>
              {Object.entries(THEME_COLOR_SCHEMES[theme.startsWith('kids-') ? theme : `kids-${theme}`] || {}).map(([colorKey, scheme]) => (
                <button
                  key={colorKey}
                  type="button"
                  onClick={() => setThemeColor(colorKey)}
                  title={scheme.label}
                  style={{
                    ...styles.colorBtn,
                    background: scheme.color,
                    border: themeColor === colorKey ? '3px solid var(--kb-text)' : '2px solid var(--kb-border)',
                    boxShadow: themeColor === colorKey ? `0 0 12px ${scheme.color}` : 'none',
                    transform: themeColor === colorKey ? 'scale(1.15)' : 'scale(1)',
                  }}
                >
                  {themeColor === colorKey && <span style={styles.colorCheck}>✓</span>}
                </button>
              ))}
            </div>
            <span style={styles.colorLabel}>
              Selected Accent: <strong>{THEME_COLOR_SCHEMES[theme.startsWith('kids-') ? theme : `kids-${theme}`]?.[themeColor]?.label || 'Default'}</strong>
            </span>
          </div>

          {/* Theme Mode Picker */}
          <div className="kb-field" style={{ marginTop: 16 }}>
            <span className="kb-label">Appearance</span>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {['light', 'dark', 'system'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setThemeMode(mode)}
                  style={{
                    ...styles.themeBtn,
                    flex: 1,
                    justifyContent: 'center',
                    ...(themeMode === mode ? styles.themeBtnActive : {})
                  }}
                >
                  <span style={{ textTransform: 'capitalize' }}>{mode === 'system' ? '💻 System' : (mode === 'light' ? '☀️ Light' : '🌙 Dark')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Date & Time */}
          <SectionTitle>Date &amp; Time</SectionTitle>

          <div style={styles.row}>
            <div className="kb-field" style={{ flex: 2 }}>
              <label className="kb-label" htmlFor="ce-date">Date *</label>
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
              <label className="kb-label" htmlFor="ce-rsvpByDate">RSVP By (Optional)</label>
              <input
                id="ce-rsvpByDate"
                type="date"
                className="kb-input"
                value={rsvpByDate}
                onChange={e => setRsvpByDate(e.target.value)}
              />
            </div>
          </div>
          <div style={styles.row}>
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

          {/* Section: Location & Details */}
          <SectionTitle>Location &amp; Details</SectionTitle>

          <div className="kb-field">
            <label className="kb-label" htmlFor="ce-location">Location</label>
            <div style={{display: 'flex', gap: 16, alignItems: 'flex-end'}}>
              <div style={{ flex: 1 }}>
                <LocationInput
                  id="ce-location"
                  placeholder="e.g. Riverside Park, Pavilion 3"
                  value={location}
                  onChange={setLocation}
                />
              </div>
              <img src="/images/park_trees_icon_1779434614720.png" alt="Trees" style={{height: 68, mixBlendMode: 'multiply'}} />
            </div>
          </div>

          <div className="kb-field">
            <label className="kb-label" htmlFor="ce-description">Message to Guests</label>
            <textarea
              id="ce-description"
              className="kb-input"
              placeholder="e.g. We're so excited to celebrate with you! Please let us know if you have any dietary requirements."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              style={styles.textarea}
            />
          </div>

          {/* Section: Advanced Details (Collapsible) */}
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={styles.advancedBtn}
            >
              {showAdvanced ? '▲ Hide Advanced Info' : '▼ Add Schedule & Parking (Optional)'}
            </button>
            {showAdvanced && (
              <div style={styles.advancedContainer}>
                <div className="kb-field" style={{ marginBottom: 16 }}>
                  <label className="kb-label" htmlFor="ce-schedule">Schedule / Timeline</label>
                  <textarea
                    id="ce-schedule"
                    className="kb-input"
                    placeholder="e.g. 2:00 PM - Welcome, 3:00 PM - Cake cutting"
                    value={schedule}
                    onChange={e => setSchedule(e.target.value)}
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
                <div className="kb-field">
                  <label className="kb-label" htmlFor="ce-parkingInfo">Parking & Transport Info</label>
                  <textarea
                    id="ce-parkingInfo"
                    className="kb-input"
                    placeholder="e.g. Street parking available on Main St. or catch bus 42."
                    value={parkingInfo}
                    onChange={e => setParkingInfo(e.target.value)}
                    rows={3}
                    style={styles.textarea}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section: RSVP Settings */}
          <SectionTitle>RSVP Settings</SectionTitle>

          <div style={styles.toggleGroup}>
            <Toggle
              id="ce-rsvpEnabled"
              checked={rsvpEnabled}
              onChange={setRsvpEnabled}
              label="Enable RSVP"
            />

            {rsvpEnabled && (
              <>
                <div style={{ borderTop: '1px solid var(--kb-border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label className="kb-label" htmlFor="ce-kidsEstimate">Estimated Kids</label>
                      <input
                        id="ce-kidsEstimate"
                        type="number"
                        min="0"
                        className="kb-input"
                        placeholder="e.g. 10"
                        value={kidsEstimate}
                        onChange={e => setKidsEstimate(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="kb-label" htmlFor="ce-adultsEstimate">Estimated Adults</label>
                      <input
                        id="ce-adultsEstimate"
                        type="number"
                        min="0"
                        className="kb-input"
                        placeholder="e.g. 10"
                        value={adultsEstimate}
                        onChange={e => setAdultsEstimate(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--kb-border)', marginTop: 8, paddingTop: 12 }}>
                  <Toggle
                    id="ce-lockDownRSVP"
                    checked={lockDownRSVP}
                    onChange={setLockDownRSVP}
                    label="Lock RSVP list (Require approval for guests not on your list)"
                  />
                  <Toggle
                    id="ce-askChildAge"
                    checked={askChildAge}
                    onChange={setAskChildAge}
                    label="Ask for guest child's age"
                  />
                  <Toggle
                    id="ce-askAdultCount"
                    checked={askAdultCount}
                    onChange={setAskAdultCount}
                    label="Ask for number of adults attending"
                  />
                </div>
              </>
            )}
          </div>

          {/* Section: Gift Registry */}
          <SectionTitle>Gift Registry (Optional)</SectionTitle>

          <div className="kb-field">
            <label className="kb-label" htmlFor="ce-giftNote">Gift Registry Note</label>
            <textarea
              id="ce-giftNote"
              className="kb-input"
              placeholder="e.g. No gifts necessary, but if you'd like to contribute, we have a wishlist!"
              value={giftRegistryNote}
              onChange={e => setGiftRegistryNote(e.target.value)}
              rows={3}
              style={styles.textarea}
            />
          </div>

          <div className="kb-field">
            <label className="kb-label" htmlFor="ce-giftLink">Gift Registry Link</label>
            <input
              id="ce-giftLink"
              type="url"
              className="kb-input"
              placeholder="https://www.myer.com.au/wishlist/..."
              value={giftRegistryLink}
              onChange={e => setGiftRegistryLink(e.target.value)}
            />
          </div>

          {/* Submit */}
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
    maxWidth: 760,
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
  cancelBtn: {
    color: 'var(--kb-text-muted)',
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
    animation: 'spin 0.7s linear infinite',
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
};
