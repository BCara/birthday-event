import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, storage, trackEvent } from '../../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import html2canvas from 'html2canvas';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { THEME_COLOR_SCHEMES, getTheme } from '../../theme/themes';
import ThemeIllustration from '../../theme/ThemeIllustration';
import OgImageTemplate from '../../components/OgImageTemplate';
import LocationInput from '../../components/LocationInput';
import '../guest/EventLandingPage.css';
import './EventManagePage.css';
import { getDevSafeOrigin } from '../../utils/url';
import { Cake, Wand2, Gamepad2, Car, Utensils, Gift, Hand, Music, Star, Trash2, Plus, Tent, X, ChevronDown, ChevronUp } from 'lucide-react';

export const SCHEDULE_ICONS = [
  { id: 'cake', icon: Cake, label: 'Cake' },
  { id: 'magician', icon: Wand2, label: 'Magician / Show' },
  { id: 'play', icon: Gamepad2, label: 'Play / Games' },
  { id: 'ride', icon: Car, label: 'Cars / Ride' },
  { id: 'tent', icon: Tent, label: 'Outdoors' },
  { id: 'food', icon: Utensils, label: 'Eating / Food' },
  { id: 'gift', icon: Gift, label: 'Gifts' },
  { id: 'welcome', icon: Hand, label: 'Welcome / Bye' },
  { id: 'music', icon: Music, label: 'Music / Dance' },
  { id: 'star', icon: Star, label: 'Special Activity' },
];

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
  name, 
  childName, 
  date, 
  time, 
  endTime, 
  rsvpByDate,
  location, 
  address,
  hostContact,
  hostName,
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
        data-theme="light"
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

              {/* Photo OR Illustration */}
              <div className="elp-illustration-container" style={{ margin: '-8px auto -12px', zIndex: 1, position: 'relative' }}>
                {photoUrl ? (
                  <div className="elp-photo-wrap" style={{ width: '100px', height: '100px', margin: '0 auto' }}>
                    <img src={photoUrl} alt="Event" className="elp-photo" />
                  </div>
                ) : (
                  <div className="elp-illustration-wrap" style={{ maxWidth: '140px', margin: '0 auto', transform: 'scale(1.15)', animation: 'none' }}>
                    <ThemeIllustration theme={normalizedThemeKey} themeColor={themeColor} />
                  </div>
                )}
              </div>

              <div className="elp-hero" style={{ zIndex: 2, position: 'relative', marginTop: 0, paddingTop: 0 }}>
                <h1 className="elp-title" style={{ fontSize: '1.25rem', margin: '0 0 4px' }}>
                  {childName ? (
                    <>
                      <span style={{ color: 'var(--t-accent)' }}>{childName}{childName.toLowerCase().endsWith('s') || childName.includes("'") ? '' : "'s"}</span><br />
                      <span style={{ color: 'var(--t-text)', fontSize: '0.8em', display: 'block', marginTop: '4px' }}>{name || 'Party Name'}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--t-accent)' }}>{name || 'Party Name'}</span>
                  )}
                </h1>
                <p className="elp-subtitle" style={{ marginTop: '12px', fontSize: '0.85rem' }}>✨ Join us for a magical {themeKey?.replace('kids-', '') || 'unicorn'} celebration! ✨</p>
              </div>

              <div className="elp-divider" style={{ margin: '10px 0' }}>
                <span className="elp-divider-dot"></span>
                <span className="elp-divider-line" style={{ width: '40px' }}></span>
                <span className="elp-divider-dot"></span>
              </div>

              {/* Centered Details */}
              <div className="elp-details-clean" style={{ gap: '12px' }}>
                {(formattedDate || tStart) && (
                  <div className="elp-detail-item elp-detail-datetime" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="elp-detail-content-clean" style={{ textAlign: 'center' }}>
                      <div className="elp-detail-value-clean">
                        {formattedDate && <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--t-text)' }}>📅 {formattedDate}</div>}
                        {tStart && <div style={{ fontWeight: 700, fontSize: '0.8rem', opacity: 0.9, marginTop: '2px', color: 'var(--t-text)' }}>🕛 {tStart}{tEnd && ` – ${tEnd}`}</div>}
                      </div>
                    </div>
                  </div>
                )}
                {location && (
                  <div className="elp-detail-item elp-detail-location" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="elp-detail-content-clean" style={{ textAlign: 'center' }}>
                      <div className="elp-detail-value-clean">
                        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--t-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📍 {location}</div>
                        {address && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '2px', color: 'var(--t-text)', lineHeight: 1.2 }}>
                            {(() => {
                              const loc = (location || '').trim().toLowerCase();
                              const addr = (address || '').trim();
                              if (loc && addr.toLowerCase().startsWith(loc)) {
                                return addr.slice(loc.length).replace(/^[,\s]+/, '');
                              }
                              return addr;
                            })()}
                          </div>
                        )}
                      </div>
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
  const [date, setDate] = useState('');
  const [rsvpByDate, setRsvpByDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('');
  const [scheduleItems, setScheduleItems] = useState([]);
  const [generalInfo, setGeneralInfo] = useState('');
  const [parkingInfo, setParkingInfo] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [hostContact, setHostContact] = useState('');
  const [hostName, setHostName] = useState('');
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [websiteEnabled, setWebsiteEnabled] = useState(true);
  const [memoriesEnabled, setMemoriesEnabled] = useState(false);
  const [memoriesTitle, setMemoriesTitle] = useState('');
  const [memoriesMessage, setMemoriesMessage] = useState('');
  const [memoriesOpenDate, setMemoriesOpenDate] = useState('');
  const [memoriesCloseDate, setMemoriesCloseDate] = useState('');
  const [showParentAttendance, setShowParentAttendance] = useState(true);
  const [stayOrDropOffMode, setStayOrDropOffMode] = useState('ask'); // 'ask' | 'stay' | 'dropoff'
  const [askChildAge, setAskChildAge] = useState(true);
  const [askAdultCount, setAskAdultCount] = useState(true);
  const [askDietary, setAskDietary] = useState(true);
  const [allowAdditionalChildren, setAllowAdditionalChildren] = useState(true);
  const [lockDownRSVP, setLockDownRSVP] = useState(false);
  const [requireGuestMatch, setRequireGuestMatch] = useState(false);
  const [authType, setAuthType] = useState('name');
  const [eventPassword, setEventPassword] = useState('');
  const [advancedRsvpOpen, setAdvancedRsvpOpen] = useState(false);
  const [kidsEstimate, setKidsEstimate] = useState(10);
  const [adultsEstimate, setAdultsEstimate] = useState(10);
  const [giftRegistryNote, setGiftRegistryNote] = useState('');
  const [giftRegistryLink, setGiftRegistryLink] = useState('');
  
  const [photoUrl, setPhotoUrl] = useState('');
  const [invitePreviewUrl, setInvitePreviewUrl] = useState('');
  
  const ogPreviewRef = React.useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showEventPageInfo, setShowEventPageInfo] = useState(false);
  const [printSize, setPrintSize] = useState('A5');
  const [printBg, setPrintBg] = useState('white');
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
      setDate(data.date ?? '');
      setTime(data.time ?? '');
      setEndTime(data.endTime ?? '');
      setRsvpByDate(data.rsvpByDate ?? '');
      setLocation(data.location ?? '');
      setAddress(data.address ?? '');
      setDescription(data.description ?? '');
      setSchedule(data.schedule ?? '');
      setScheduleItems(data.scheduleItems ?? []);
      setGeneralInfo(data.generalInfo ?? '');
      setParkingInfo(data.parkingInfo ?? '');
      setHostContact(data.hostContact ?? '');
      setHostName(data.hostName ?? '');
      setRsvpEnabled(data.rsvpEnabled ?? true);
      setWebsiteEnabled(data.websiteEnabled ?? true);
      setMemoriesEnabled(data.memoriesEnabled ?? false);
      setMemoriesTitle(data.memoriesTitle ?? '');
      setMemoriesMessage(data.memoriesMessage ?? '');
      setMemoriesOpenDate(data.memoriesOpenDate ?? '');
      setMemoriesCloseDate(data.memoriesCloseDate ?? '');
      const showParent = data.showParentAttendance ?? true;
      setShowParentAttendance(showParent);
      setStayOrDropOffMode(showParent ? (data.stayOrDropOffMode ?? 'ask') : 'none');
      setAskChildAge(data.askChildAge ?? true);
      setAskAdultCount(data.askAdultCount ?? true);
      setAskDietary(data.askDietary ?? true);
      setAllowAdditionalChildren(data.allowAdditionalChildren ?? true);
      setLockDownRSVP(data.lockDownRSVP ?? false);
      setRequireGuestMatch(data.requireGuestMatch ?? false);
      setAuthType(data.authType ?? 'name');
      setEventPassword(data.eventPassword ?? '');
      setKidsEstimate(data.kidsEstimate ?? (data.guestEstimate ? Math.floor(data.guestEstimate / 2) : 10));
      setAdultsEstimate(data.adultsEstimate ?? (data.guestEstimate ? Math.floor(data.guestEstimate / 2) : 10)); // Fixed: adultsEstimate should use ceil or keep consistent
      setGiftRegistryNote(data.giftRegistryNote ?? '');
      setGiftRegistryLink(data.giftRegistryLink ?? '');
      setPhotoUrl(data.photoUrl ?? '');
      setInvitePreviewUrl(data.invitePreviewUrl ?? '');
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
    
    let updatedPreviewUrl = invitePreviewUrl;
    try {
      if (ogPreviewRef.current) {
        const canvas = await html2canvas(ogPreviewRef.current, { scale: 1, useCORS: true, backgroundColor: null });
        const dataUrl = canvas.toDataURL('image/png');
        const imageRef = ref(storage, `invite-previews/${eventId}.png`);
        await uploadString(imageRef, dataUrl, 'data_url');
        updatedPreviewUrl = await getDownloadURL(imageRef);
        setInvitePreviewUrl(updatedPreviewUrl);
      }
    } catch (err) {
      console.error("Failed to generate or upload invite preview image", err);
    }

    try {
      await updateDoc(doc(db, 'events', eventId), {
        name: name.trim(),
        childName: childName.trim(),
        theme,
        themeColor,
        date,
        time,
        endTime,
        rsvpByDate,
        location: location.trim(),
        address: address.trim(),
        description: description.trim(),
        schedule: schedule.trim(),
        scheduleItems,
        generalInfo: generalInfo.trim(),
        parkingInfo: parkingInfo.trim(),
        hostContact: hostContact.trim(),
        hostName: hostName.trim(),
        rsvpEnabled,
        websiteEnabled,
        memoriesEnabled,
        memoriesTitle: memoriesTitle.trim(),
        memoriesMessage: memoriesMessage.trim(),
        memoriesOpenDate,
        memoriesCloseDate,
        showParentAttendance: stayOrDropOffMode !== 'none',
        stayOrDropOffMode: stayOrDropOffMode === 'none' ? 'ask' : stayOrDropOffMode,
        askChildAge,
        askAdultCount,
        askDietary,
        allowAdditionalChildren,
        lockDownRSVP,
        requireGuestMatch,
        authType,
        eventPassword: authType === 'password' ? eventPassword : '',
        kidsEstimate: kidsEstimate !== '' ? Number(kidsEstimate) : 10,
        adultsEstimate: adultsEstimate !== '' ? Number(adultsEstimate) : 10,
        giftRegistryNote: giftRegistryNote.trim(),
        giftRegistryLink: giftRegistryLink.trim(),
        photoUrl,
        invitePreviewUrl: updatedPreviewUrl,
      });
      toast.success('Changes saved! ✅');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  const addScheduleItem = () => {
    setScheduleItems([...scheduleItems, { id: Date.now().toString(), time: '12:00 PM', name: '', desc: '', iconKey: 'star' }]);
  };

  const updateScheduleItem = (index, field, value) => {
    const newItems = [...scheduleItems];
    newItems[index][field] = value;
    setScheduleItems(newItems);
  };

  const removeScheduleItem = (index) => {
    setScheduleItems(scheduleItems.filter((_, i) => i !== index));
  };

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
    const urlToCopy = `${getDevSafeOrigin()}/share/${event.slug}`;
    navigator.clipboard.writeText(urlToCopy).then(() => {
      setCopied(true);
      toast.success('Link copied!');
      trackEvent('invite_shared', { method: 'copy_link' });
      setTimeout(() => setCopied(false), 2500);
    });
  }

  async function handleDownloadQR() {
    if (!event?.slug) return;
    trackEvent('invite_shared', { method: 'qr_download' });
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

  function handlePrintInvite() {
    let url = `/dashboard/event/${eventId}/print?size=${printSize}&bg=${printBg}`;
    window.open(url, '_blank');
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--kb-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={styles.spinner} />
      </div>
    );
  }

  const inviteUrl = event?.slug
    ? rsvpEnabled
      ? `${getDevSafeOrigin()}/${event.slug}`
      : `${getDevSafeOrigin()}/${event.slug}/portal`
    : 'tinypartyportal.com/...';
  const qrCodeUrl = event?.slug 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(inviteUrl)}`
    : '/images/qr_code_mockup_1779434680273.png';
  const activeTheme = THEMES.find(t => t.key === theme);

  return (
    <div className="em-root" style={{ minHeight: '100vh', background: 'var(--kb-bg)' }}>
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
                {hostName && <span style={{color: 'var(--kb-text-muted)', marginLeft: 12}}>• 👤 {hostName}</span>}
                {hostContact && <span style={{color: 'var(--kb-text-muted)', marginLeft: 12}}>• 📞 {hostContact}</span>}
              </div>
            </div>
          </div>
          <div className="em-nav-btns" style={styles.navBtns}>
            <a href={inviteUrl} target="_blank" rel="noreferrer" className="kb-btn kb-btn-secondary kb-btn-sm em-nav-btn" style={{ ...styles.navBtn, borderColor: 'var(--kb-mint)', color: 'var(--kb-mint)' }}>
              <span>👁️</span> {rsvpEnabled ? 'View RSVP Page' : 'View Event Page'}
            </a>
            <Link to={`/dashboard/event/${eventId}/rsvps`} className="kb-btn kb-btn-secondary kb-btn-sm em-nav-btn" style={styles.navBtn}>
              <span style={{color: 'var(--kb-purple)'}}>👥</span> RSVPs
            </Link>
            {memoriesEnabled && (
              <Link to={`/dashboard/event/${eventId}/capsule`} className="kb-btn kb-btn-secondary kb-btn-sm em-nav-btn" style={styles.navBtn}>
                <span style={{color: 'var(--kb-coral)'}}>📸</span> Capsule
              </Link>
            )}
          </div>
        </div>

        {/* Module bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {/* Web — always on */}
          <div style={{ flex: 1, minWidth: 140, padding: '14px 18px', borderRadius: 16, background: 'var(--kb-surface)', border: '2px solid var(--kb-mint)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>🌐</span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--kb-text)' }}>Web</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--kb-mint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Always on</div>
            </div>
          </div>

          {/* RSVP */}
          <label htmlFor="module-rsvp" style={{ flex: 1, minWidth: 140, padding: '14px 18px', borderRadius: 16, background: 'var(--kb-surface)', border: `2px solid ${rsvpEnabled ? 'var(--kb-purple)' : 'var(--kb-border)'}`, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none', transition: 'border-color 0.2s' }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--kb-text)' }}>RSVP</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: rsvpEnabled ? 'var(--kb-purple)' : 'var(--kb-text-muted)' }}>{rsvpEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: rsvpEnabled ? 'var(--kb-purple)' : 'var(--kb-input-border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <input id="module-rsvp" type="checkbox" checked={rsvpEnabled} onChange={e => setRsvpEnabled(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
              <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: rsvpEnabled ? 18 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </label>

          {/* Memory Capsule */}
          <label htmlFor="module-capsule" style={{ flex: 1, minWidth: 140, padding: '14px 18px', borderRadius: 16, background: 'var(--kb-surface)', border: `2px solid ${memoriesEnabled ? 'var(--kb-coral)' : 'var(--kb-border)'}`, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none', transition: 'border-color 0.2s' }}>
            <span style={{ fontSize: 22 }}>📸</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--kb-text)' }}>Memory Capsule</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: memoriesEnabled ? 'var(--kb-coral)' : 'var(--kb-text-muted)' }}>{memoriesEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: memoriesEnabled ? 'var(--kb-coral)' : 'var(--kb-input-border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <input id="module-capsule" type="checkbox" checked={memoriesEnabled} onChange={e => setMemoriesEnabled(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
              <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: memoriesEnabled ? 18 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </label>
        </div>

        <div className="em-grid">
          {/* Edit Form Column */}
          <form onSubmit={handleSave} className="em-form-col">


            <div className="kb-card" style={styles.card}>
              <h3 style={styles.cardTitle}><span>📝</span> Basic Information</h3>
              
              {/* Photo Upload Row */}
              <div className="em-photo-row" style={{ padding: '20px', background: 'rgba(155, 93, 229, 0.04)', borderRadius: 20, border: '1px solid rgba(155, 93, 229, 0.1)' }}>
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
                  <label className="kb-label" htmlFor="em-childName">Birthday Star (e.g. Robin's)</label>
                  <input id="em-childName" type="text" className="kb-input" value={childName} onChange={e => setChildName(e.target.value)} placeholder="Robin's" />
                </div>
                <div className="kb-field" style={{ flex: 1 }}>
                  <label className="kb-label" htmlFor="em-name">Subtitle / Occasion</label>
                  <input id="em-name" type="text" className="kb-input" value={name} onChange={e => setName(e.target.value)} required placeholder="3rd Birthday" />
                </div>
              </div>
              <div style={styles.row}>
                <div className="kb-field" style={{ flex: 1 }}>
                  <label className="kb-label" htmlFor="em-hostName">Host Name (shown to guests)</label>
                  <input id="em-hostName" type="text" className="kb-input" value={hostName} onChange={e => setHostName(e.target.value)} placeholder="e.g. Sarah" />
                </div>
                <div className="kb-field" style={{ flex: 1 }}>
                  <label className="kb-label" htmlFor="em-hostContact">Host Contact Info (shown to guests)</label>
                  <input id="em-hostContact" type="text" className="kb-input" value={hostContact} onChange={e => setHostContact(e.target.value)} placeholder="e.g. 0400 000 000" />
                </div>
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
              <div className="em-location-row">
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="kb-field" style={{ marginBottom: 0 }}>
                    <label className="kb-label" htmlFor="em-location">Event/Venue Name</label>
                    <input id="em-location" type="text" className="kb-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. SuperZu Playcentre" />
                  </div>
                  <div className="kb-field" style={{ marginBottom: 0 }}>
                    <label className="kb-label" htmlFor="em-address">Address</label>
                    <LocationInput id="em-address" value={address} onChange={setAddress} placeholder="Search or enter address..." />
                  </div>
                </div>
                <img src="/images/park_trees_icon_1779434614720.png" alt="Trees" style={{height: 68, marginTop: 24}} />
              </div>
            </div>

            <div className="kb-card" style={styles.card}>
              <h3 style={styles.cardTitle}><span>💬</span> Message to Guests</h3>
              <div className="kb-field" style={{marginBottom: 0, position: 'relative'}}>
                <textarea id="em-description" className="kb-input" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Add a special message for your guests..." style={styles.textarea} />
                <span style={{position: 'absolute', bottom: 12, right: 12, fontSize: 20}}>🎉</span>
              </div>
            </div>

            {rsvpEnabled && (
            <div className="kb-card" style={styles.card}>
              <h3 style={styles.cardTitle}><span>✅</span> RSVP Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Parents + Estimates row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <label className="kb-label" htmlFor="em-stayOrDropOffMode">Parents at party</label>
                      <select
                        id="em-stayOrDropOffMode"
                        className="kb-select"
                        value={stayOrDropOffMode}
                        onChange={e => setStayOrDropOffMode(e.target.value)}
                      >
                        <option value="none">Don't ask</option>
                        <option value="ask">Ask (staying or drop-off?)</option>
                        <option value="stay">Must stay</option>
                        <option value="dropoff">Drop-off only</option>
                      </select>
                    </div>
                    <div>
                      <label className="kb-label">Estimated guests</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                          <input
                            id="em-kidsEstimate"
                            type="number"
                            min="0"
                            className="kb-input"
                            placeholder="0"
                            value={kidsEstimate}
                            onChange={e => setKidsEstimate(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--kb-text-muted)', fontWeight: 600 }}>Kids</p>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                          <input
                            id="em-adultsEstimate"
                            type="number"
                            min="0"
                            className="kb-input"
                            placeholder="0"
                            value={adultsEstimate}
                            onChange={e => setAdultsEstimate(e.target.value === '' ? '' : Number(e.target.value))}
                          />
                          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--kb-text-muted)', fontWeight: 600 }}>Adults</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ask guests about — compact chip toggles */}
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--kb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Ask guests about</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { id: 'em-askChildAge', checked: askChildAge, onChange: setAskChildAge, label: "Child's age" },
                        { id: 'em-askAdultCount', checked: askAdultCount, onChange: setAskAdultCount, label: 'Adults attending' },
                        { id: 'em-askDietary', checked: askDietary, onChange: setAskDietary, label: 'Dietary needs' },
                        { id: 'em-allowAdditionalChildren', checked: allowAdditionalChildren, onChange: setAllowAdditionalChildren, label: 'Extra children' },
                      ].map(({ id, checked, onChange, label }) => (
                        <label key={id} htmlFor={id} style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                          background: checked ? 'rgba(52, 211, 153, 0.07)' : 'var(--kb-surface)',
                          border: `1.5px solid ${checked ? 'var(--kb-mint)' : 'var(--kb-border)'}`,
                          transition: 'all 0.15s', userSelect: 'none'
                        }}>
                          <div style={{ width: 30, height: 17, borderRadius: 9, flexShrink: 0, position: 'relative', transition: 'background 0.2s', background: checked ? 'var(--kb-mint)' : 'var(--kb-input-border)' }}>
                            <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                            <div style={{ position: 'absolute', top: 2, width: 13, height: 13, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', left: checked ? 15 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--kb-text)' }}>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setAdvancedRsvpOpen(o => !o)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'none', border: 'none', padding: 0,
                        cursor: 'pointer', color: 'var(--kb-text-muted)',
                        fontSize: '0.82rem', fontWeight: 600
                      }}
                    >
                      <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: advancedRsvpOpen ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: '0.65rem' }}>▶</span>
                      Advanced
                    </button>

                    {advancedRsvpOpen && (
                      <div style={{
                        marginTop: 12, padding: '16px', borderRadius: 12,
                        background: 'var(--kb-surface)', border: '1px solid var(--kb-border)',
                        display: 'flex', flexDirection: 'column', gap: 14
                      }}>
                        <Toggle id="em-lockRsvp" checked={lockDownRSVP} onChange={setLockDownRSVP} label="Require approval for unlisted guests" />
                        <Toggle id="em-requireMatch" checked={requireGuestMatch} onChange={setRequireGuestMatch} label="Only invited guests can RSVP" />
                        <div>
                          <label className="kb-label" htmlFor="em-authType">Cross-device re-authentication</label>
                          <select
                            id="em-authType"
                            className="kb-select"
                            value={authType}
                            onChange={e => setAuthType(e.target.value)}
                            style={{ maxWidth: 280 }}
                          >
                            <option value="name">Name &amp; contact lookup</option>
                            <option value="password">Event password</option>
                          </select>
                          {authType === 'password' && (
                            <input
                              className="kb-input"
                              type="text"
                              placeholder="e.g. Birthday2026"
                              value={eventPassword}
                              onChange={e => setEventPassword(e.target.value)}
                              style={{ maxWidth: 280, marginTop: 8 }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
            </div>
            )}

            {memoriesEnabled && (
            <div className="kb-card" style={styles.card}>
              <h3 style={styles.cardTitle}><span>📸</span> Memory Capsule</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="kb-field" style={{ marginBottom: 0 }}>
                    <label className="kb-label" htmlFor="em-memoriesTitle">Capsule title (optional)</label>
                    <input
                      id="em-memoriesTitle"
                      type="text"
                      className="kb-input"
                      value={memoriesTitle}
                      onChange={e => setMemoriesTitle(e.target.value)}
                      placeholder={childName ? `${childName}'s Memories` : 'Birthday Memories'}
                    />
                  </div>
                  <div className="kb-field" style={{ marginBottom: 0 }}>
                    <label className="kb-label" htmlFor="em-memoriesMessage">Message shown to guests (optional)</label>
                    <input
                      id="em-memoriesMessage"
                      type="text"
                      className="kb-input"
                      value={memoriesMessage}
                      onChange={e => setMemoriesMessage(e.target.value)}
                      placeholder="Share a photo or memory from the party!"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="kb-field" style={{ marginBottom: 0 }}>
                    <label className="kb-label" htmlFor="em-memoriesOpenDate">Open date (optional)</label>
                    <input id="em-memoriesOpenDate" type="date" className="kb-input" value={memoriesOpenDate} onChange={e => setMemoriesOpenDate(e.target.value)} />
                  </div>
                  <div className="kb-field" style={{ marginBottom: 0 }}>
                    <label className="kb-label" htmlFor="em-memoriesCloseDate">Close date (optional)</label>
                    <input id="em-memoriesCloseDate" type="date" className="kb-input" value={memoriesCloseDate} onChange={e => setMemoriesCloseDate(e.target.value)} />
                  </div>
                </div>

                {event?.slug && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--kb-surface-2)', borderRadius: 12, padding: '12px 14px', flexWrap: 'wrap' }}>
                    <code style={{ flex: 1, fontSize: '0.8rem', color: 'var(--kb-text-muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getDevSafeOrigin()}/{event.slug}/memories/new
                    </code>
                    <button type="button" onClick={() => { navigator.clipboard.writeText(`${getDevSafeOrigin()}/${event.slug}/memories/new`); toast.success('Copied!'); }} className="kb-btn kb-btn-secondary kb-btn-sm">Copy link</button>
                    <Link to={`/dashboard/event/${eventId}/capsule`} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ color: 'var(--kb-coral)', borderColor: 'var(--kb-coral)' }}>View Capsule →</Link>
                  </div>
                )}

              </div>
            </div>
            )}

            <div className="kb-card" style={{ ...styles.card, transition: 'all 0.3s ease' }}>
              <div 
                onClick={() => setShowEventPageInfo(!showEventPageInfo)} 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
              >
                <div>
                  <h3 style={{ ...styles.cardTitle, margin: 0 }}>
                    <span>🌐</span> Guest Web Page Sections (Optional)
                  </h3>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--kb-text-muted)', fontWeight: 500, lineHeight: 1.4 }}>
                    Optional details to display on your guest invitation page (Schedule, Parking details, and Gift Registry).
                  </p>
                </div>
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--kb-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                  {showEventPageInfo ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              
              {showEventPageInfo && (
                <div style={{ marginTop: 28, borderTop: '1px solid var(--kb-border)', paddingTop: 28 }}>
                  <div className="kb-field" style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <label className="kb-label" style={{ marginBottom: 0 }}>Schedule / Timeline</label>
                      <button type="button" onClick={addScheduleItem} className="kb-btn kb-btn-secondary kb-btn-sm" style={{ padding: '6px 12px', fontSize: 13, gap: 4 }}>
                        <Plus size={14} /> Add Item
                      </button>
                    </div>
                    
                    {scheduleItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--kb-surface)', border: '1px dashed var(--kb-border)', borderRadius: 16 }}>
                        <p style={{ margin: '0 0 12px', color: 'var(--kb-text-muted)', fontSize: 14 }}>No schedule items added yet.</p>
                        <button type="button" onClick={addScheduleItem} className="kb-btn kb-btn-primary kb-btn-sm">Create Schedule</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {scheduleItems.map((item, index) => (
                          <div key={item.id} style={{ display: 'flex', gap: 16, background: 'var(--kb-surface)', padding: 16, borderRadius: 16, border: '1px solid var(--kb-border)', position: 'relative', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => removeScheduleItem(index)} style={{ position: 'absolute', top: -10, right: -10, width: 28, height: 28, background: '#fff', border: '1px solid var(--kb-border)', borderRadius: '50%', color: 'var(--kb-coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', zIndex: 2 }}>
                              <X size={14} />
                            </button>
                            
                            <div style={{ width: '100%', maxWidth: 100 }}>
                              <label className="kb-label" style={{ fontSize: 12 }}>Time</label>
                              <input type="text" className="kb-input" style={{ padding: '8px', fontSize: 14 }} value={item.time} onChange={e => updateScheduleItem(index, 'time', e.target.value)} placeholder="1:00 PM" />
                            </div>
                            
                            <div style={{ width: '100%', maxWidth: 120 }}>
                              <label className="kb-label" style={{ fontSize: 12 }}>Icon</label>
                              <select className="kb-select" style={{ padding: '8px 32px 8px 8px', fontSize: 14, height: 'auto' }} value={item.iconKey} onChange={e => updateScheduleItem(index, 'iconKey', e.target.value)}>
                                {SCHEDULE_ICONS.map(icon => (
                                  <option key={icon.id} value={icon.id}>{icon.label}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <label className="kb-label" style={{ fontSize: 12 }}>Activity Name</label>
                              <input type="text" className="kb-input" style={{ padding: '8px', fontSize: 14, marginBottom: 8 }} value={item.name} onChange={e => updateScheduleItem(index, 'name', e.target.value)} placeholder="Cake Cutting" />
                              
                              <label className="kb-label" style={{ fontSize: 12 }}>Description (Optional)</label>
                              <textarea className="kb-input" style={{ padding: '8px', fontSize: 13, minHeight: 40, resize: 'vertical' }} value={item.desc} onChange={e => updateScheduleItem(index, 'desc', e.target.value)} placeholder="Gather around for cake!" rows={1} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Fallback for old string schedule */}
                    {schedule && scheduleItems.length === 0 && (
                      <div style={{ marginTop: 16, padding: 12, background: 'rgba(255, 183, 77, 0.1)', borderRadius: 12, border: '1px solid rgba(255, 183, 77, 0.3)' }}>
                        <p style={{ margin: 0, fontSize: 13, color: '#d84315' }}>You have an old text-based schedule. It will still show to guests until you delete it and use the new schedule builder above.</p>
                        <button type="button" onClick={() => setSchedule('')} style={{ marginTop: 8, background: 'transparent', border: 'none', color: '#d84315', textDecoration: 'underline', cursor: 'pointer', padding: 0, fontSize: 13 }}>Delete Old Schedule</button>
                      </div>
                    )}
                  </div>

                  <div className="kb-field" style={{ borderTop: '1px solid var(--kb-border)', paddingTop: 24 }}>
                    <label className="kb-label" htmlFor="em-generalInfo">General Information</label>
                    <textarea
                      id="em-generalInfo"
                      className="kb-input"
                      placeholder="e.g. Please wear enclosed shoes. Dietary requirements can be added in the RSVP."
                      value={generalInfo}
                      onChange={e => setGeneralInfo(e.target.value)}
                      rows={4}
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
              )}
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
                  name={name} 
                  childName={childName} 
                  date={date} 
                  time={time} 
                  endTime={endTime} 
                  rsvpByDate={rsvpByDate}
                  location={location}
                  address={address}
                  hostContact={hostContact}
                  hostName={hostName}
                  photoUrl={event?.photoUrl}
                  description={description}
                  giftRegistryNote={giftRegistryNote}
                  giftRegistryLink={giftRegistryLink}
                  rsvpEnabled={rsvpEnabled}
                />
              </div>
              
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--kb-border)' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--kb-text)', fontWeight: 600 }}>Printable Version</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--kb-text-muted)' }}>Paper Size:</span>
                    <select 
                      className="kb-select"
                      value={printSize}
                      onChange={(e) => setPrintSize(e.target.value)}
                      style={{ fontSize: 13, padding: '8px 40px 8px 12px', width: 'auto', marginBottom: 0, height: 'auto' }}
                    >
                      <option value="A5">A5</option>
                      <option value="A4">A4</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--kb-text-muted)' }}>Background:</span>
                    <select 
                      className="kb-select"
                      value={printBg}
                      onChange={(e) => setPrintBg(e.target.value)}
                      style={{ fontSize: 13, padding: '8px 40px 8px 12px', flex: 1, marginBottom: 0, height: 'auto' }}
                    >
                      <option value="white">White (Ink Saver)</option>
                      <option value="theme">Themed Colors</option>
                    </select>
                  </div>
                  <button 
                    type="button" 
                    className="kb-btn kb-btn-secondary" 
                    onClick={handlePrintInvite}
                    style={{ width: '100%', justifyContent: 'center', borderColor: 'var(--kb-purple)', color: 'var(--kb-purple)' }}
                  >
                    🖨️ Open Printable Version
                  </button>
                </div>
              </div>
            </div>

            <div className="kb-card" style={styles.sideCard}>
              <div style={styles.sideCardHeader}>
                <span style={{fontSize: 18, color: 'var(--kb-mint)'}}>🚀</span>
                <h3 style={styles.sideCardTitle}>{rsvpEnabled ? 'Share RSVP Invite' : 'Share Event Page'}</h3>
              </div>
              <p style={styles.shareDesc}>
                {rsvpEnabled
                  ? 'Guests open this link to see the event details and RSVP. Share via WhatsApp, text, or email.'
                  : 'Share your event page with guests via WhatsApp, text, or email — no RSVP required.'}
              </p>

              <div className="em-share-flex">
                <div style={styles.shareFlexLeft}>
                  <div style={styles.urlBox}>
                    <span style={styles.urlText}>{inviteUrl}</span>
                    <button type="button" onClick={handleCopyLink} className="kb-btn kb-btn-secondary kb-btn-sm" style={styles.copyBtn}>
                      {copied ? '✅' : '📋'} Copy
                    </button>
                  </div>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(rsvpEnabled ? `You're invited! RSVP here: ${inviteUrl}` : `Check out our event: ${inviteUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="kb-btn"
                    style={styles.whatsappBtn}
                    onClick={() => trackEvent('invite_shared', { method: 'whatsapp' })}
                  >
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
                  <button onClick={handleDownloadQR} className="kb-btn kb-btn-secondary kb-btn-sm" style={{flex: 1, color: 'var(--kb-blue)', padding: '10px'}}>
                    ⬇️ Download QR
                  </button>
                </div>
              </div>

              {memoriesEnabled && event?.slug && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--kb-border)' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--kb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                    📸 Memory Capsule link
                  </p>
                  <div style={styles.urlBox}>
                    <span style={{ ...styles.urlText, fontSize: '0.75rem' }}>
                      {`${getDevSafeOrigin()}/${event.slug}/memories/new`.replace(/^https?:\/\//, '')}
                    </span>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(`${getDevSafeOrigin()}/${event.slug}/memories/new`); toast.success('Copied!'); }}
                      className="kb-btn kb-btn-secondary kb-btn-sm"
                      style={styles.copyBtn}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              )}
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

        {/* Hidden OG Image Generator */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={ogPreviewRef}>
            <OgImageTemplate 
              themeKey={theme} 
              themeColor={themeColor} 
              name={name} 
              childName={childName} 
              date={date} 
              time={time} 
              endTime={endTime} 
              location={location}
              address={address}
            />
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
