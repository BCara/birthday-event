import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage } from '../../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { THEME_COLOR_SCHEMES, getTheme } from '../../theme/themes';
import ThemeIllustration from '../../theme/ThemeIllustration';
import LocationInput from '../../components/LocationInput';
import '../guest/EventLandingPage.css';
import './EventManagePage.css';
import { getDevSafeOrigin } from '../../utils/url';

const THEMES = [
  { key: 'generic', emoji: '🎈', label: 'Classic' },
  { key: 'dino', emoji: '🦕', label: 'Dino' },
  { key: 'unicorn', emoji: '🦄', label: 'Unicorn' },
  { key: 'princess', emoji: '👑', label: 'Princess' },
  { key: 'cars', emoji: '🏎️', label: 'Cars' },
];

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
  hostContact,
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
      {/* Notch */}
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
        {/* Scrollable area */}
        <div style={{ ...phoneStyles.scrollContent, transform: 'scale(0.9)', transformOrigin: 'top center' }}>
          
          {/* Card Invitation */}
          <div className="elp-card-invitation" style={{ width: '100%', boxSizing: 'border-box' }}>
            <div className="elp-card-border-inner" style={{ padding: '24px 16px' }}>
              
              {/* Header Badge */}
              <div className="elp-invitation-intro">
                <span className="elp-invitation-badge">You're Invited!</span>
              </div>

              <div className="elp-hero" style={{ padding: '4px 0' }}>
                <h1 className="elp-title" style={{ fontSize: '1.35rem', margin: '0 0 4px' }}>{name || 'Party Name'}</h1>
                {childName && <p className="elp-subtitle" style={{ fontSize: '0.85rem' }}>Celebrating {childName}'s special day!</p>}
              </div>

              {/* Photo OR Illustration */}
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
                {hostContact && (
                  <div className="elp-detail-item">
                    <span className="elp-detail-icon-clean" style={{ fontSize: '1.4rem' }}>📞</span>
                    <div className="elp-detail-content-clean">
                      <div className="elp-detail-label-clean">Contact</div>
                      <div className="elp-detail-value-clean" style={{ fontSize: '0.85rem' }}>{hostContact}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* RSVP By Deadline */}
              {formattedRsvpBy && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--t-accent)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Please RSVP by {formattedRsvpBy}
                  </span>
                </div>
              )}

              {/* Message Description */}
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

              {/* RSVP Now */}
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

export default function EventManagePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [childName, setChildName] = useState('');
  const [theme, setTheme] = useState('generic');
  const [themeColor, setThemeColor] = useState('default');
  const [themeMode, setThemeMode] = useState('light');
  const [date, setDate] = useState('');
  const [rsvpByDate, setRsvpByDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [parkingInfo, setParkingInfo] = useState('');
  const [location, setLocation] = useState('');
  const [hostContact, setHostContact] = useState('');
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [showParentAttendance, setShowParentAttendance] = useState(true);
  const [stayOrDropOffMode, setStayOrDropOffMode] = useState('ask'); // 'ask' | 'stay' | 'dropoff'
  const [askChildAge, setAskChildAge] = useState(true);
  const [askAdultCount, setAskAdultCount] = useState(true);
  const [kidsEstimate, setKidsEstimate] = useState(10);
  const [adultsEstimate, setAdultsEstimate] = useState(10);
  const [giftRegistryNote, setGiftRegistryNote] = useState('');
  const [giftRegistryLink, setGiftRegistryLink] = useState('');
  
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'events', eventId), snap => {
      if (!snap.exists()) {
        navigate('/dashboard');
        return;
      }
      const data = snap.data();
      setEvent({ id: snap.id, ...data });
      setName(data.name ?? '');
      childName === '' && setChildName(data.childName ?? '');
      setTheme(data.theme ?? 'generic');
      setThemeColor(data.themeColor ?? 'default');
      setThemeMode(data.themeMode ?? 'light');
      setDate(data.date ?? '');
      setTime(data.time ?? '');
      setEndTime(data.endTime ?? '');
      setRsvpByDate(data.rsvpByDate ?? '');
      setLocation(data.location ?? '');
      setDescription(data.description ?? '');
      setSchedule(data.schedule ?? '');
      setParkingInfo(data.parkingInfo ?? '');
      setHostContact(data.hostContact ?? '');
      setRsvpEnabled(data.rsvpEnabled ?? true);
      setShowParentAttendance(data.showParentAttendance ?? true);
      setStayOrDropOffMode(data.stayOrDropOffMode ?? 'ask');
      setAskChildAge(data.askChildAge ?? true);
      setAskAdultCount(data.askAdultCount ?? true);
      setKidsEstimate(data.kidsEstimate ?? (data.guestEstimate ? Math.floor(data.guestEstimate / 2) : 10));
      setAdultsEstimate(data.adultsEstimate ?? (data.guestEstimate ? Math.floor(data.guestEstimate / 2) : 10)); // Fixed: adultsEstimate should use ceil or keep consistent
      setGiftRegistryNote(data.giftRegistryNote ?? '');
      setGiftRegistryLink(data.giftRegistryLink ?? '');
      setPhotoUrl(data.photoUrl ?? '');
      setLoading(false);
    }, err => {
      console.error(err);
      toast.error('Failed to load event.');
      setLoading(false);
    });
    return unsub;
  }, [eventId, navigate]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'events', eventId), {
        name: name.trim(),
        childName: childName.trim(),
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
        hostContact: hostContact.trim(),
        rsvpEnabled,
        showParentAttendance,
        stayOrDropOffMode,
        askChildAge,
        askAdultCount,
        kidsEstimate: kidsEstimate !== '' ? Number(kidsEstimate) : 10,
        adultsEstimate: adultsEstimate !== '' ? Number(adultsEstimate) : 10,
        giftRegistryNote: giftRegistryNote.trim(),
        giftRegistryLink: giftRegistryLink.trim(),
        photoUrl,
      });
      toast.success('Changes saved! ✅');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large. Max 5MB.');
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `event-photos/${eventId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      null, 
      (err) => {
        console.error(err);
        toast.error('Failed to upload image.');
        setUploading(false);
      }, 
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setPhotoUrl(url);
        setUploading(false);
        toast.success('Photo uploaded!');
      }
    );
  }

  async function handleRemovePhoto() {
    setPhotoUrl('');
    toast.success('Photo removed. Illustration will be shown.');
  }

  function handleCopyLink() {
    if (!event?.slug) return;
    const url = `${getDevSafeOrigin()}/${event.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  }

  async function handleDownloadQR() {
    if (!event?.slug) return;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.slug}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      window.open(qrCodeUrl, '_blank');
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--kb-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={styles.spinner} />
      </div>
    );
  }

  const inviteUrl = event?.slug ? `${getDevSafeOrigin()}/${event.slug}` : 'kidsbash.com/r/...';
  const qrCodeUrl = event?.slug 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(inviteUrl)}`
    : '/images/qr_code_mockup_1779434680273.png';
  const activeTheme = THEMES.find(t => t.key === theme);

  return (
    <div style={styles.root}>
      <div style={styles.inner}>
        
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <button onClick={() => navigate('/dashboard')} className="kb-btn kb-btn-secondary kb-btn-sm" style={styles.backBtn}>
              ← Back
            </button>
            <div style={styles.headerTitles}>
              <h1 style={styles.heading}>{name || 'New Event'}</h1>
              <div style={styles.themeSubtitle}>
                {activeTheme?.emoji} <span style={{color: 'var(--kb-mint)'}}>{activeTheme?.label} Theme</span>
                {location && <span style={{color: 'var(--kb-text-muted)', marginLeft: 12}}>• 📍 {location}</span>}
                {hostContact && <span style={{color: 'var(--kb-text-muted)', marginLeft: 12}}>• 📞 {hostContact}</span>}
              </div>
            </div>
          </div>
          <div style={styles.navBtns}>
            <a href={`${getDevSafeOrigin()}/${event?.slug}`} target="_blank" rel="noreferrer" className="kb-btn kb-btn-secondary kb-btn-sm" style={{ ...styles.navBtn, borderColor: 'var(--kb-mint)', color: 'var(--kb-mint)' }}>
              <span>👁️</span> View Invite
            </a>
            <Link to={`/dashboard/event/${eventId}/rsvps`} className="kb-btn kb-btn-secondary kb-btn-sm" style={styles.navBtn}>
              <span style={{color: 'var(--kb-purple)'}}>👥</span> RSVPs
            </Link>
          </div>
        </div>

        <div className="em-grid">
          {/* Edit Form Column */}
          <form onSubmit={handleSave} className="em-form-col">
            
            <div className="kb-card" style={styles.card}>
              <h3 style={styles.cardTitle}><span>📝</span> Basic Information</h3>
              
              {/* Photo Upload Row */}
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 28, padding: '20px', background: 'rgba(155, 93, 229, 0.04)', borderRadius: 20, border: '1px solid rgba(155, 93, 229, 0.1)' }}>
                <div style={{ position: 'relative', width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', background: 'var(--kb-surface)', border: '3px solid var(--kb-surface)', boxShadow: 'var(--kb-shadow-md)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ textAlign: 'center', opacity: 0.5 }}>
                      <span style={{ fontSize: 28 }}>👶</span>
                    </div>
                  )}
                  {uploading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="kb-spinner-sm" />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ padding: '8px 16px', borderRadius: 12 }} disabled={uploading}>
                      {photoUrl ? 'Change Photo' : 'Upload Star Photo'}
                    </button>
                    {photoUrl && (
                      <button type="button" onClick={handleRemovePhoto} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ color: 'var(--kb-coral)', padding: '8px 16px', borderRadius: 12 }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--kb-text-muted)', marginTop: 10, lineHeight: 1.5, fontWeight: 500 }}>
                    Add a photo of the birthday star! If left blank, the <strong>{activeTheme?.label}</strong> illustration will be used.
                  </p>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
                </div>
              </div>

              <div style={styles.row}>
                <div className="kb-field" style={{ flex: 1 }}>
                  <label className="kb-label" htmlFor="em-childName">Child's Name</label>
                  <input id="em-childName" type="text" className="kb-input" value={childName} onChange={e => setChildName(e.target.value)} placeholder="Robin" />
                </div>
                <div className="kb-field" style={{ flex: 1 }}>
                  <label className="kb-label" htmlFor="em-name">Party Name</label>
                  <input id="em-name" type="text" className="kb-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Robins 3rd Birthday" />
                </div>
              </div>
              <div className="kb-field" style={{ marginTop: '16px' }}>
                <label className="kb-label" htmlFor="em-hostContact">Host Contact Info (shown to guests)</label>
                <input id="em-hostContact" type="text" className="kb-input" value={hostContact} onChange={e => setHostContact(e.target.value)} placeholder="e.g. Sarah - 0400 000 000" />
              </div>
            </div>

            <div className="kb-card" style={styles.card}>
              <h3 style={styles.cardTitle}><span>🎨</span> Theme & Style</h3>
              <div style={styles.themePicker}>
                {THEMES.map(t => (
                  <button key={t.key} type="button" onClick={() => { setTheme(t.key); setThemeColor('default'); }}
                    style={{ ...styles.themeBtn, ...(theme === t.key ? styles.themeBtnActive : {}) }}>
                    <span style={{ fontSize: 20 }}>{t.emoji}</span>
                    <span style={styles.themeBtnLabel}>{t.label}</span>
                    {theme === t.key && <div style={styles.themeCheck}>✓</div>}
                  </button>
                ))}
              </div>

              {/* Theme Color Picker */}
              <div style={{ marginTop: 24 }}>
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
                        border: themeColor === colorKey ? '3px solid var(--kb-surface)' : '2px solid var(--kb-border)',
                        boxShadow: themeColor === colorKey ? `0 0 0 2px ${scheme.color}` : 'none',
                        transform: themeColor === colorKey ? 'scale(1.15)' : 'scale(1)',
                      }}
                    >
                      {themeColor === colorKey && <span style={styles.colorCheckBtn}>✓</span>}
                    </button>
                  ))}
                </div>
                <div style={styles.colorLabel}>
                  Selected Accent: <strong>{THEME_COLOR_SCHEMES[theme.startsWith('kids-') ? theme : `kids-${theme}`]?.[themeColor]?.label || 'Default'}</strong>
                </div>
              </div>

              {/* Theme Mode Picker */}
              <div style={{ marginTop: 24 }}>
                <span className="kb-label">Appearance</span>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  {['light', 'dark', 'system'].map(mode => (
                    <button
                      key={mode}
                      type="button"
                      title={mode === 'system' ? "Matches guest's device settings" : undefined}
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
            </div>

            <div className="kb-card" style={styles.card}>
              <h3 style={styles.cardTitle}><span>📅</span> Date & Time</h3>
              <div style={styles.row}>
                <div className="kb-field" style={{ flex: 2 }}>
                  <label className="kb-label" htmlFor="em-date">Date</label>
                  <input id="em-date" type="date" className="kb-input" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="kb-field" style={{ flex: 1 }}>
                  <label className="kb-label" htmlFor="em-rsvpByDate">RSVP By (Optional)</label>
                  <input id="em-rsvpByDate" type="date" className="kb-input" value={rsvpByDate} onChange={e => setRsvpByDate(e.target.value)} />
                </div>
              </div>
              <div style={styles.row}>
                <div className="kb-field" style={{ flex: 1 }}>
                  <label className="kb-label" htmlFor="em-time">Start</label>
                  <input id="em-time" type="time" className="kb-input" value={time} onChange={e => setTime(e.target.value)} />
                </div>
                <div className="kb-field" style={{ flex: 1 }}>
                  <label className="kb-label" htmlFor="em-endTime">End</label>
                  <input id="em-endTime" type="time" className="kb-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="kb-card" style={{ ...styles.card, overflow: 'visible' }}>
              <h3 style={styles.cardTitle}><span>📍</span> Event Location</h3>
              <div style={{display: 'flex', gap: 16, alignItems: 'flex-end'}}>
                <div className="kb-field" style={{ flex: 1, marginBottom: 0 }}>
                  <LocationInput id="em-location" value={location} onChange={setLocation} placeholder="Myuna Farm" />
                </div>
                <img src="/images/park_trees_icon_1779434614720.png" alt="Trees" style={{height: 68}} />
              </div>
            </div>

            <div className="kb-card" style={styles.card}>
              <h3 style={styles.cardTitle}><span>💬</span> Message to Guests</h3>
              <div className="kb-field" style={{marginBottom: 0, position: 'relative'}}>
                <textarea id="em-description" className="kb-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Add a special message for your guests..." style={styles.textarea} />
                <span style={{position: 'absolute', bottom: 12, right: 12, fontSize: 20}}>🎉</span>
              </div>
            </div>

            <div className="kb-card" style={styles.card}>
              <h3 style={styles.cardTitle}><span>✅</span> RSVP Settings</h3>
              <div style={styles.toggleGroup}>
                <Toggle id="em-rsvp" checked={rsvpEnabled} onChange={setRsvpEnabled} label="Enable RSVP for this event" />
                {rsvpEnabled && (
                  <>
                    <div style={{ borderTop: '1px solid var(--kb-border)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
                        <Toggle id="em-showParentAttendance" checked={showParentAttendance} onChange={setShowParentAttendance} label="Parent Attendance Options" />

                        {showParentAttendance && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
                            <label className="kb-label" htmlFor="em-stayOrDropOffMode" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Mode:</label>
                            <select 
                              id="em-stayOrDropOffMode" 
                              className="kb-select" 
                              value={stayOrDropOffMode} 
                              onChange={e => setStayOrDropOffMode(e.target.value)}
                              style={{ marginBottom: 0, flex: 1 }}
                            >
                              <option value="ask">Ask guest (Staying vs Drop-off)</option>
                              <option value="stay">Parents must stay</option>
                              <option value="dropoff">Drop-off allowed (No parents)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <label className="kb-label" htmlFor="em-kidsEstimate">Estimated Kids</label>
                          <input
                            id="em-kidsEstimate"
                            type="number"
                            min="0"
                            className="kb-input"
                            placeholder="e.g. 10"
                            value={kidsEstimate}
                            onChange={e => setKidsEstimate(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="kb-label" htmlFor="em-adultsEstimate">Estimated Adults</label>
                          <input
                            id="em-adultsEstimate"
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
                      <Toggle id="em-askChildAge" checked={askChildAge} onChange={setAskChildAge} label="Ask for guest child's age" />
                      <Toggle id="em-askAdultCount" checked={askAdultCount} onChange={setAskAdultCount} label="Ask for number of adults attending" />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="kb-card" style={styles.card}>
              <h3 style={styles.cardTitle}><span>✨</span> Event Info (Optional)</h3>
              <div className="kb-field">
                <label className="kb-label" htmlFor="em-schedule">Schedule / Timeline</label>
                <textarea
                  id="em-schedule"
                  className="kb-input"
                  placeholder="e.g. 2:00 PM - Welcome, 3:00 PM - Cake cutting"
                  value={schedule}
                  onChange={e => setSchedule(e.target.value)}
                  rows={3}
                  style={styles.textarea}
                />
              </div>
              <div className="kb-field">
                <label className="kb-label" htmlFor="em-parkingInfo">Parking & Transport Info</label>
                <textarea
                  id="em-parkingInfo"
                  className="kb-input"
                  placeholder="e.g. Street parking available on Main St. or catch bus 42."
                  value={parkingInfo}
                  onChange={e => setParkingInfo(e.target.value)}
                  rows={3}
                  style={styles.textarea}
                />
              </div>
              
              <div style={{ borderTop: '1px solid var(--kb-border)', marginTop: 24, paddingTop: 24 }}>
                <h4 style={{ ...styles.cardTitle, fontSize: '1rem', marginBottom: 16 }}>🎁 Gift Registry</h4>
                <div className="kb-field">
                  <label className="kb-label" htmlFor="em-giftNote">Gift Registry Note</label>
                  <textarea
                    id="em-giftNote"
                    className="kb-input"
                    placeholder="e.g. No gifts necessary, but if you'd like to contribute, we have a wishlist!"
                    value={giftRegistryNote}
                    onChange={e => setGiftRegistryNote(e.target.value)}
                    rows={2}
                    style={styles.textarea}
                  />
                </div>
                <div className="kb-field" style={{ marginBottom: 0 }}>
                  <label className="kb-label" htmlFor="em-giftLink">Gift Registry Link</label>
                  <input
                    id="em-giftLink"
                    type="url"
                    className="kb-input"
                    placeholder="https://www.myer.com.au/wishlist/..."
                    value={giftRegistryLink}
                    onChange={e => setGiftRegistryLink(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={styles.saveRow}>
              <button type="submit" className="kb-btn kb-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Right Sidebar Column */}
          <div className="em-side-col">
            
            <div className="kb-card" style={styles.sideCard}>
              <div style={styles.sideCardHeader}>
                <span style={{fontSize: 18, color: 'var(--kb-purple)'}}>👁️</span>
                <h3 style={styles.sideCardTitle}>Invite Preview</h3>
              </div>
              <div className="tp-root" style={styles.previewContainer}>
                <MiniPreview 
                  themeKey={theme} 
                  themeColor={themeColor} 
                  themeMode={themeMode}
                  name={name} 
                  childName={childName} 
                  date={date} 
                  time={time} 
                  endTime={endTime} 
                  rsvpByDate={rsvpByDate}
                  location={location}
                  hostContact={hostContact}
                  photoUrl={event?.photoUrl}
                  description={description}
                  giftRegistryNote={giftRegistryNote}
                  giftRegistryLink={giftRegistryLink}
                  rsvpEnabled={rsvpEnabled}
                />
              </div>
            </div>

            <div className="kb-card" style={styles.sideCard}>
              <div style={styles.sideCardHeader}>
                <span style={{fontSize: 18, color: 'var(--kb-mint)'}}>🚀</span>
                <h3 style={styles.sideCardTitle}>Share Invite</h3>
              </div>
              <p style={styles.shareDesc}>Share this link with your guests via WhatsApp, text, or email — or scan the QR code.</p>
              
              <div className="em-share-flex">
                <div style={styles.shareFlexLeft}>
                  <div style={styles.urlBox}>
                    <span style={styles.urlText}>{inviteUrl}</span>
                    <button type="button" onClick={handleCopyLink} className="kb-btn kb-btn-secondary kb-btn-sm" style={styles.copyBtn}>
                      {copied ? '✅' : '📋'} Copy
                    </button>
                  </div>
                  <a href={`https://wa.me/?text=You're invited!%20${encodeURIComponent(inviteUrl)}`} target="_blank" rel="noreferrer" className="kb-btn" style={styles.whatsappBtn}>
                    <span style={{fontSize: 18}}>💬</span> Share on WhatsApp
                  </a>
                </div>
                <div style={styles.qrCodeWrap}>
                  <img src={qrCodeUrl} alt="QR Code" style={styles.qrCode} />
                  <span style={styles.qrDeco}>🎉</span>
                  <span style={styles.qrDeco2}>✨</span>
                </div>
              </div>

              <div style={styles.shareActions}>
                <div style={styles.shareSecondaryRow}>
                  {event?.slug && (
                    <Link to={`/${event.slug}/live`} target="_blank" className="kb-btn kb-btn-secondary kb-btn-sm" style={{flex: 1, color: 'var(--kb-purple)', padding: '10px'}}>
                      💬 Open Live Wall
                    </Link>
                  )}
                  <button onClick={handleDownloadQR} className="kb-btn kb-btn-secondary kb-btn-sm" style={{flex: 1, color: 'var(--kb-blue)', padding: '10px'}}>
                    ⬇️ Download QR
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.bannerCard}>
              <div style={{flex: 1}}>
                <h4 style={styles.bannerTitle}>Let the good times roll!</h4>
                <p style={styles.bannerDesc}>We can't wait to celebrate with you.</p>
              </div>
              <img src="/images/cute_dino_mascot_1779434654723.png" alt="Mascot" style={{height: 60}} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const toggleStyles = {
  wrap: { display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '8px 0', userSelect: 'none' },
  track: { position: 'relative', width: 44, height: 24, borderRadius: 100, transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0, background: 'var(--kb-border)' },
  input: { position: 'absolute', opacity: 0, width: 0, height: 0 },
  thumb: { position: 'absolute', top: 3, left: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', pointerEvents: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.15)' },
  label: { fontFamily: 'var(--kb-font-body)', fontSize: 15, color: 'var(--kb-text)', fontWeight: 600 },
};

const styles = {
  root: { minHeight: '100vh', padding: '40px 24px', background: 'var(--kb-bg)' },
  inner: { maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20, marginBottom: 32 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  headerTitles: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  heading: { fontFamily: 'var(--kb-font-display)', fontSize: 28, fontWeight: 700, color: 'var(--kb-text)', margin: 0 },
  themeSubtitle: { fontFamily: 'var(--kb-font-body)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  backBtn: { borderRadius: '12px', background: 'var(--kb-surface)', padding: '8px 16px', boxShadow: 'none' },
  navBtns: { display: 'flex', gap: 12 },
  navBtn: { background: 'var(--kb-surface)', borderRadius: '12px', padding: '8px 16px', border: '1px solid var(--kb-border)', boxShadow: 'var(--kb-shadow-sm)' },
  
  card: { padding: 32, borderRadius: 24, boxShadow: 'var(--kb-shadow-md)', border: '1px solid var(--kb-border)' },
  cardTitle: { fontFamily: 'var(--kb-font-display)', fontSize: 20, margin: '0 0 24px', color: 'var(--kb-text)', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700 },
  row: { display: 'flex', gap: 20, flexWrap: 'wrap' },
  textarea: { resize: 'vertical', minHeight: 70, borderRadius: 16 },
  
  themePicker: { display: 'flex', gap: 14, flexWrap: 'wrap' },
  themeBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', border: '1px solid var(--kb-border)', borderRadius: 16, background: 'var(--kb-surface)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative' },
  themeBtnActive: { border: '2px solid var(--kb-purple)', background: 'rgba(155, 93, 229, 0.04)', boxShadow: '0 4px 15px rgba(155, 93, 229, 0.1)' },
  themeBtnLabel: { fontFamily: 'var(--kb-font-body)', fontSize: 15, fontWeight: 700, color: 'var(--kb-text)' },
  themeCheck: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, background: 'var(--kb-purple)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', border: '3px solid var(--kb-surface)', boxShadow: '0 2px 8px rgba(155, 93, 229, 0.3)' },
  
  colorPicker: { display: 'flex', gap: 16, alignItems: 'center', marginTop: 16, flexWrap: 'wrap', minHeight: 48 },
  colorBtn: { width: 42, height: 42, borderRadius: '50%', cursor: 'pointer', position: 'relative', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none', padding: 0 },
  colorCheckBtn: { color: '#fff', fontSize: 18, fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' },
  colorLabel: { fontFamily: 'var(--kb-font-body)', fontSize: 14, color: 'var(--kb-text-muted)', marginTop: 12, fontWeight: 600 },
  
  toggleGroup: { display: 'flex', flexDirection: 'column', gap: 12 },
  saveRow: { display: 'flex', justifyContent: 'flex-start', paddingTop: 8 },
  
  sideCard: { padding: 24 },
  sideCardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  sideCardTitle: { fontFamily: 'var(--kb-font-display)', fontSize: 18, margin: 0, color: 'var(--kb-text)' },
  
  previewContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 0' },
  previewImage: { width: '100%', height: 'auto', display: 'block' },
  previewFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--kb-surface)', fontSize: 12, fontFamily: 'var(--kb-font-body)', fontWeight: 600, color: 'var(--kb-text)' },
  previewInfoItem: { display: 'flex', alignItems: 'center', gap: 6 },
  
  shareDesc: { fontFamily: 'var(--kb-font-body)', fontSize: 13, color: 'var(--kb-text-muted)', margin: '0 0 16px', lineHeight: 1.5 },
  shareFlexLeft: { display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 0 },
  urlBox: { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--kb-surface-2)', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--kb-border)', minWidth: 0 },
  urlText: { fontFamily: 'var(--kb-font-ui)', fontSize: 13, color: 'var(--kb-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  copyBtn: { padding: '6px 10px', fontSize: 12, background: 'var(--kb-surface)', flexShrink: 0 },
  qrCodeWrap: { position: 'relative', margin: '0 8px', background: '#fff', padding: '6px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', border: '1px solid var(--kb-border)', flexShrink: 0 },
  qrCode: { width: 110, height: 110, display: 'block' },
  qrDeco: { position: 'absolute', top: -10, right: -10, fontSize: 20 },
  qrDeco2: { position: 'absolute', bottom: -10, left: -10, fontSize: 20 },
  
  shareActions: { display: 'flex', flexDirection: 'column', gap: 12 },
  whatsappBtn: { width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: 12, display: 'flex', justifyContent: 'center', padding: '12px 16px', whiteSpace: 'normal' },
  shareSecondaryRow: { display: 'flex', gap: 12 },
  
  bannerCard: { display: 'flex', alignItems: 'center', padding: '16px 24px', background: 'var(--kb-surface-2)', borderRadius: 16, border: '1px solid var(--kb-border)' },
  bannerTitle: { fontFamily: 'var(--kb-font-display)', fontSize: 16, margin: 0, color: 'var(--kb-text)' },
  bannerDesc: { fontFamily: 'var(--kb-font-body)', fontSize: 13, margin: '4px 0 0', color: 'var(--kb-text-muted)' },
  
  spinner: { width: 40, height: 40, border: '3px solid var(--kb-border)', borderTopColor: 'var(--kb-coral)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
};

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
