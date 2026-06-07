// src/pages/guest/EventLandingPage.jsx
// The page guests see when scanning the QR code / opening the link.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useSearchParams, Navigate } from 'react-router-dom';
import ThemedPage from '../../theme/ThemedPage';
import ThemeIllustration from '../../theme/ThemeIllustration';
import { fetchEventBySlug } from '../../utils/fetchEvent';
import { generateICS, downloadICS, getGoogleCalendarUrl } from '../../utils/calendarUtils';
import './EventLandingPage.css';
import { getDevSafeOrigin } from '../../utils/url';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Cake, Wand2, Gamepad2, Car, Utensils, Gift, Hand, Music, Star, Tent } from 'lucide-react';

const ICON_MAP = {
  cake: Cake,
  magician: Wand2,
  play: Gamepad2,
  ride: Car,
  tent: Tent,
  food: Utensils,
  gift: Gift,
  welcome: Hand,
  music: Music,
  star: Star
};

function SkeletonLanding() {
  return (
    <div className="elp-center">
      <div className="elp-container" style={{ width: '100%', maxWidth: '540px' }}>
        <div style={{ height: 400, width: '100%', background: 'rgba(0,0,0,0.05)', borderRadius: 24 }} className="kb-skeleton" />
        <div style={{ height: 200, width: '100%', background: 'rgba(0,0,0,0.05)', borderRadius: 24, marginTop: 24 }} className="kb-skeleton" />
      </div>
    </div>
  );
}

export default function EventLandingPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRsvpId = searchParams.get('rsvpId');

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calOpen, setCalOpen] = useState(false);
  const [memoryDismissed, setMemoryDismissed] = useState(false);
  const [hasRsvped, setHasRsvped] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState(null); // 'yes' | 'no'
  const calRef = useRef(null);

  const [showLookup, setShowLookup] = useState(false);
  const [lookupChildName, setLookupChildName] = useState('');
  const [lookupContact, setLookupContact] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (calRef.current && !calRef.current.contains(e.target)) {
        setCalOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log("Fetching event for slug:", slug);
    fetchEventBySlug(slug)
      .then(e => {
        console.log("Fetched event result:", e);
        setEvent(e);
        setLoading(false);
      })
      .catch(err => {
        console.error("fetchEventBySlug failed:", err);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (event?.id) {
      // If we have an rsvpId in the URL, prioritize it and save to local storage
      if (urlRsvpId) {
        localStorage.setItem(`rsvp_${event.id}`, urlRsvpId);
        // We don't necessarily know the status yet, but we can assume 'yes' for now if they are coming from a calendar link,
        // or just let it fall back to the next useEffect or fetch.
        // Actually, it's safer to just trigger a re-check.
        setHasRsvped(true);
        
        // Clean up the URL so it looks nicer
        searchParams.delete('rsvpId');
        setSearchParams(searchParams, { replace: true });
      } else {
        const storedRsvpId = localStorage.getItem(`rsvp_${event.id}`);
        setHasRsvped(!!storedRsvpId);
      }
      
      setMemoryDismissed(!!localStorage.getItem(`memory_dismissed_${event.id}`));
      setRsvpStatus(localStorage.getItem(`rsvp_status_${event.id}`));
    }
  }, [event?.id, urlRsvpId, searchParams, setSearchParams]);

  const isPostEvent = useMemo(() => {
    if (!event?.date) return false;
    return Date.now() > new Date(event.date + 'T23:59:59').getTime();
  }, [event?.date]);

  const pageUrl = useMemo(() => {
    const base = `${getDevSafeOrigin()}/${slug}`;
    const storedRsvpId = event ? localStorage.getItem(`rsvp_${event.id}`) : null;
    return storedRsvpId ? `${base}?rsvpId=${storedRsvpId}` : base;
  }, [slug, event]);

  const formattedDate = useMemo(() => {
    if (!event?.date) return null;
    return new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }, [event?.date]);

  const formattedRsvpBy = useMemo(() => {
    if (!event?.rsvpByDate) return null;
    return new Date(event.rsvpByDate + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    });
  }, [event?.rsvpByDate]);

  const formattedTime = useMemo(() => {
    if (!event?.time) return null;
    const [h, m] = event.time.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  }, [event?.time]);

  const calOpts = useMemo(() => {
    if (!event) return null;
    let desc = event.description || '';
    if (event.hostContact) {
      desc = `Contact: ${event.hostContact}\n\n${desc}`;
    }
    return {
      title: event.name,
      date: event.date,
      time: event.time,
      endTime: event.endTime,
      location: event.location,
      description: desc,
      url: pageUrl,
    };
  }, [event, pageUrl]);

  const rsvpCalOpts = useMemo(() => event?.rsvpByDate ? {
    title: `RSVP: ${event.name}`,
    date: event.rsvpByDate,
    description: `Time to RSVP for ${event.name}!\n\nInvitation: ${pageUrl}`,
    url: pageUrl,
  } : null, [event, pageUrl]);

  const handleDismiss = () => {
    setMemoryDismissed(true);
    if (event?.id) localStorage.setItem(`memory_dismissed_${event.id}`, '1');
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupChildName.trim() || !lookupContact.trim()) {
      setLookupError("Please enter both Child's Name and Parent's Email or Phone.");
      return;
    }
    setLookupError('');
    setLookupLoading(true);
    try {
      const q = query(
        collection(db, 'rsvps'),
        where('eventId', '==', event.id)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setLookupError("No RSVPs found for this event yet.");
        setLookupLoading(false);
        return;
      }

      const inputChildClean = lookupChildName.trim().toLowerCase();
      const inputContactClean = lookupContact.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      let foundRsvp = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const storedChildClean = (data.childName || '').trim().toLowerCase();
        const storedEmailClean = (data.email || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const storedPhoneClean = (data.phone || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (storedChildClean === inputChildClean && 
            (storedEmailClean === inputContactClean || storedPhoneClean === inputContactClean)) {
          foundRsvp = { id: doc.id, ...data };
        }
      });

      if (foundRsvp) {
        localStorage.setItem(`rsvp_${event.id}`, foundRsvp.id);
        localStorage.setItem(`rsvp_status_${event.id}`, foundRsvp.isAttending ? 'yes' : 'no');
        setHasRsvped(true);
        setRsvpStatus(foundRsvp.isAttending ? 'yes' : 'no');
        setShowLookup(false);
      } else {
        setLookupError("No matching RSVP found. Please check spelling or contact the host.");
      }
    } catch (err) {
      console.error("Error looking up RSVP:", err);
      setLookupError("An error occurred. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  if (loading) return <SkeletonLanding />;

  if (!event || event.published === false) {
    return (
      <ThemedPage themeKey="kids-generic">
        <div className="elp-center">
          <div className="elp-notfound">
            <div className="elp-nf-emoji">🎈</div>
            <h1 className="elp-nf-title">Party not found</h1>
            <p className="elp-nf-sub">Double-check your link or scan the QR code again.</p>
          </div>
        </div>
      </ThemedPage>
    );
  }


  const themeKey = event.theme?.startsWith('kids-') ? event.theme : `kids-${event.theme || 'generic'}`;

  return (
    <ThemedPage themeKey={themeKey} themeColor={event.themeColor} themeMode={event.themeMode}>
      <div className={hasRsvped ? "elp-portal-root" : "elp-container"}>

        {hasRsvped ? (
          /* =========================================
             EVENT PORTAL VIEW (Post-RSVP)
             ========================================= */
          <div className="elp-portal-v2">
            
            {/* Background Decorations */}
            <div className="elp-p2-bg-blobs">
              <div className="elp-p2-blob-1"></div>
              <div className="elp-p2-blob-2"></div>
              <div className="elp-p2-blob-3"></div>
            </div>

            {/* 1. Header Section */}
            <div className="elp-p2-header">
              
              <div className="elp-p2-banner-wrap">
                <div className="elp-p2-status-banner">
                  🤍 YOU'RE GOING! 🤍
                </div>
              </div>

              <div className="elp-p2-header-main">
                {/* Left: Child Photo */}
                {event.photoUrl && (
                  <div className="elp-p2-photo-col">
                    <div className="elp-p2-photo-frame">
                      <img src={event.photoUrl} alt={event.childName} className="elp-p2-child-img" />
                      <div className="elp-p2-photo-heart">💖</div>
                    </div>
                  </div>
                )}

                {/* Center: Title */}
                <div className="elp-p2-title-col">
                  <h1 className="elp-p2-title">
                    <span className="elp-p2-name">{event.childName || 'Robin'}'s</span><br/>
                    <span className="elp-p2-title-age">{event.childAge ? `${event.childAge}${event.childAge === 1 ? 'st' : (event.childAge === 2 ? 'nd' : (event.childAge === 3 ? 'rd' : 'th'))}` : '3rd'} Birthday</span>
                  </h1>
                </div>

                {/* Right: Theme Illustration */}
                <div className="elp-p2-illus-col">
                  <div className="elp-p2-main-illus">
                    <ThemeIllustration theme={themeKey} themeColor={event.themeColor} />
                  </div>
                </div>
              </div>

              {/* Details Block */}
              <div className="elp-p2-header-details">
                <div className="elp-p2-header-details-row">
                  {formattedDate && (
                    <div className="elp-p2-h-detail">
                      <span className="elp-p2-h-icon">📅</span> {formattedDate}
                    </div>
                  )}
                  <div className="elp-p2-h-divider">|</div>
                  {formattedTime && (
                    <div className="elp-p2-h-detail">
                      <span className="elp-p2-h-icon">🕒</span> {formattedTime} – {(() => { 
                        if (!event.endTime) return '2:00 PM';
                        const [h,m] = event.endTime.split(':'); 
                        const hr=parseInt(h,10); 
                        return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`; 
                      })()}
                    </div>
                  )}
                </div>
                {event.location && (
                  <div className="elp-p2-h-detail elp-p2-h-location">
                    <span className="elp-p2-h-icon">📍</span> {event.location}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="elp-p2-actions">
                <div className="elp-p2-btn-going">
                  <span className="elp-p2-check">✓</span> YOU'RE GOING!
                </div>
                <Link to={`/${slug}/rsvp?edit=true`} className="elp-p2-btn-change">
                  <span>📝</span> CHANGE RSVP
                </Link>
              </div>
            </div>

            {/* 2. Grid Content */}
            <div className="elp-p2-grid">
              
              {/* Left Column: Schedule */}
              {(() => {
                // If the user has structured schedule items, use those!
                if (event.scheduleItems && event.scheduleItems.length > 0) {
                  return (
                    <div className="elp-p2-card elp-p2-schedule-card">
                      <div className="elp-p2-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span className="elp-p2-card-icon">🎈</span>
                          <h2 className="elp-p2-card-title">Party Schedule</h2>
                        </div>
                        <svg className="elp-p2-bunting" width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.85 }}>
                          <path d="M0 5 C 30 15, 90 15, 120 5" stroke="#FFC2D4" strokeWidth="2" strokeDasharray="3 3" fill="none" />
                          <polygon points="10,8 24,8 17,25" fill="#FF75A2" />
                          <polygon points="28,10 42,10 35,27" fill="#B288C0" />
                          <polygon points="46,11 60,11 53,28" fill="#81D4FA" />
                          <polygon points="64,11 78,11 71,28" fill="#FFF59D" />
                          <polygon points="82,10 96,10 89,27" fill="#E8F5E9" />
                          <polygon points="100,8 114,8 107,25" fill="#FFB74D" />
                        </svg>
                      </div>
                      <div className="elp-p2-timeline">
                        {event.scheduleItems.map((item, i) => {
                          const IconComponent = ICON_MAP[item.iconKey] || Star;
                          return (
                            <div key={item.id || i} className="elp-p2-timeline-item">
                              <div className="elp-p2-t-time">{item.time}</div>
                              <div className="elp-p2-t-content">
                                <div className="elp-p2-t-activity" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--t-surface)', border: '1.5px solid var(--t-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <IconComponent size={14} style={{ color: 'var(--t-accent)' }} />
                                  </div>
                                  {item.name}
                                </div>
                                {item.desc && <div className="elp-p2-t-desc" style={{ whiteSpace: 'pre-wrap', marginTop: '6px' }}>{item.desc}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Fallback to old schedule logic
                const defaultSched = "11:00 AM - Welcome & Playtime\nLet's kick off the fun!\n11:30 AM - Farm Activities\nExplore and enjoy the farm\n12:30 PM - Pizza & Snacks\nYummy time!\n1:15 PM - Cake Cutting\nLet's celebrate!\n1:45 PM - Party Games & Prizes\nGames, fun and prizes to be won!\n2:00 PM - Goodie Bags & Farewell\nThanks for coming!";
                const scheduleText = event.schedule !== undefined ? event.schedule : defaultSched;
                if (!scheduleText || !scheduleText.trim()) return null;

                const lines = scheduleText.split('\n').filter(line => line.trim());
                const parsedEvents = [];
                let currentEvent = null;

                lines.forEach((line) => {
                  const timeMatch = line.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-–\s]\s*(.*)$/);
                  if (timeMatch) {
                    if (currentEvent) parsedEvents.push(currentEvent);
                    const rest = timeMatch[2];
                    const splitByColon = rest.split(/:\s*(.*)/);
                    currentEvent = {
                      time: timeMatch[1],
                      activity: splitByColon[0],
                      desc: splitByColon[1] || ''
                    };
                  } else if (currentEvent) {
                    currentEvent.desc = currentEvent.desc ? currentEvent.desc + '\n' + line : line;
                  } else {
                    parsedEvents.push({ raw: line });
                  }
                });
                if (currentEvent) parsedEvents.push(currentEvent);

                return (
                  <div className="elp-p2-card elp-p2-schedule-card">
                    <div className="elp-p2-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span className="elp-p2-card-icon">🎈</span>
                        <h2 className="elp-p2-card-title">Party Schedule</h2>
                      </div>
                      <svg className="elp-p2-bunting" width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.85 }}>
                        <path d="M0 5 C 30 15, 90 15, 120 5" stroke="#FFC2D4" strokeWidth="2" strokeDasharray="3 3" fill="none" />
                        <polygon points="10,8 24,8 17,25" fill="#FF75A2" />
                        <polygon points="28,10 42,10 35,27" fill="#B288C0" />
                        <polygon points="46,11 60,11 53,28" fill="#81D4FA" />
                        <polygon points="64,11 78,11 71,28" fill="#FFF59D" />
                        <polygon points="82,10 96,10 89,27" fill="#E8F5E9" />
                        <polygon points="100,8 114,8 107,25" fill="#FFB74D" />
                      </svg>
                    </div>
                    
                    <div className="elp-p2-timeline">
                      {parsedEvents.map((evt, i) => {
                        if (evt.raw) return <div key={i} className="elp-p2-timeline-item-raw">{evt.raw}</div>;
                        return (
                          <div key={i} className="elp-p2-timeline-item">
                            <div className="elp-p2-t-time">{evt.time}</div>
                            <div className="elp-p2-t-content">
                              <div className="elp-p2-t-activity">{evt.activity}</div>
                              {evt.desc && <div className="elp-p2-t-desc" style={{ whiteSpace: 'pre-wrap' }}>{evt.desc}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Right Column: Details */}
              <div className="elp-p2-details-col">
                
                {/* Date & Time Card */}
                <div className="elp-p2-card">
                  <div className="elp-p2-card-split">
                    <div className="elp-p2-card-text" style={{ position: 'relative' }}>
                      <div className="elp-p2-card-header">
                        <span className="elp-p2-card-icon-small">📅</span>
                        <h2 className="elp-p2-card-title-small">Date & Time</h2>
                      </div>
                      <div className="elp-p2-card-val-main">{formattedDate}</div>
                      <div className="elp-p2-card-val-sub">
                        {formattedTime} – {(() => { 
                          if (!event.endTime) return '2:00 PM';
                          const [h,m] = event.endTime.split(':'); 
                          const hr=parseInt(h,10); 
                          return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`; 
                        })()}
                      </div>
                      <div className="elp-card-cal-wrap" ref={calRef} data-open={calOpen} style={{ marginTop: '12px' }}>
                        <button className="elp-p2-btn-maps" onClick={() => setCalOpen(!calOpen)}>
                          📅 ADD TO CALENDAR
                          <svg className="elp-cal-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                        {calOpen && calOpts && (
                          <div className="elp-card-cal-dropdown" style={{ left: 0, transform: 'none' }}>
                            <a href={getGoogleCalendarUrl(calOpts)} target="_blank" rel="noreferrer" className="elp-card-cal-option" style={{ textDecoration: 'none' }} onClick={() => setCalOpen(false)}>
                              Google Calendar
                            </a>
                            <button className="elp-card-cal-option" onClick={() => { downloadICS(calOpts); setCalOpen(false); }}>
                              Apple Calendar
                            </button>
                            <button className="elp-card-cal-option" onClick={() => { downloadICS(calOpts); setCalOpen(false); }}>
                              Outlook
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="elp-p2-card-illus">
                      <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="20" y="30" width="60" height="55" rx="10" fill="color-mix(in srgb, var(--t-accent) 10%, #fff)" stroke="color-mix(in srgb, var(--t-accent) 60%, #ccc)" strokeWidth="3"/>
                        <path d="M20 50 L80 50" stroke="color-mix(in srgb, var(--t-accent) 60%, #ccc)" strokeWidth="3"/>
                        <rect x="30" y="20" width="10" height="20" rx="5" fill="color-mix(in srgb, var(--t-accent) 80%, #999)"/>
                        <rect x="60" y="20" width="10" height="20" rx="5" fill="color-mix(in srgb, var(--t-accent) 80%, #999)"/>
                        <circle cx="40" cy="65" r="4" fill="color-mix(in srgb, var(--t-accent) 40%, #ddd)"/>
                        <circle cx="60" cy="65" r="4" fill="color-mix(in srgb, var(--t-accent) 40%, #ddd)"/>
                        <path d="M30 40 L70 40" stroke="color-mix(in srgb, var(--t-accent) 20%, #eee)" strokeWidth="2"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Location Card */}
                <div className="elp-p2-card">
                  <div className="elp-p2-card-split">
                    <div className="elp-p2-card-text">
                      <div className="elp-p2-card-header">
                        <span className="elp-p2-card-icon-small">📍</span>
                        <h2 className="elp-p2-card-title-small">Location</h2>
                      </div>
                      <div className="elp-p2-card-val-main">{event.location || 'Myuna Farm'}</div>
                      <div className="elp-p2-card-val-sub">{event.address || '400 Myuna Farm Rd, Dural NSW 2158'}</div>
                      <button 
                        className="elp-p2-btn-maps"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address || event.location)}`, '_blank')}
                      >
                        🗺️ OPEN IN MAPS
                      </button>
                    </div>
                    <div className="elp-p2-card-illus">
                      <svg width="130" height="120" viewBox="0 0 130 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Rainbow */}
                        <path d="M10 65 C10 25 120 25 120 65" stroke="#FF9AA2" strokeWidth="4" fill="none" opacity="0.3"/>
                        <path d="M18 65 C18 33 112 33 112 65" stroke="#FFB7B2" strokeWidth="4" fill="none" opacity="0.3"/>
                        <path d="M26 65 C26 41 104 41 104 65" stroke="#FFDAC1" strokeWidth="4" fill="none" opacity="0.3"/>
                        {/* Barn roof */}
                        <polygon points="30,55 65,30 100,55" fill="var(--t-accent)" opacity="0.85"/>
                        {/* Barn body */}
                        <rect x="35" y="55" width="60" height="40" rx="3" fill="color-mix(in srgb, var(--t-accent) 70%, #fff)" />
                        {/* Barn door */}
                        <path d="M55 95 L55 70 A10 10 0 0 1 75 70 L75 95" fill="color-mix(in srgb, var(--t-accent) 90%, #333)"/>
                        {/* Barn windows */}
                        <rect x="40" y="62" width="10" height="10" rx="2" fill="#fff" opacity="0.7"/>
                        <rect x="80" y="62" width="10" height="10" rx="2" fill="#fff" opacity="0.7"/>
                        {/* Cross on door */}
                        <line x1="65" y1="70" x2="65" y2="90" stroke="#fff" strokeWidth="2" opacity="0.4"/>
                        <line x1="57" y1="80" x2="73" y2="80" stroke="#fff" strokeWidth="2" opacity="0.4"/>
                        {/* Tree */}
                        <rect x="108" y="70" width="6" height="25" rx="2" fill="#8D6E63"/>
                        <circle cx="111" cy="60" r="15" fill="#81C784" opacity="0.8"/>
                        <circle cx="105" cy="65" r="10" fill="#66BB6A" opacity="0.7"/>
                        {/* Fence */}
                        <line x1="15" y1="90" x2="30" y2="90" stroke="#D7CCC8" strokeWidth="2"/>
                        <line x1="18" y1="82" x2="18" y2="95" stroke="#D7CCC8" strokeWidth="2"/>
                        <line x1="27" y1="82" x2="27" y2="95" stroke="#D7CCC8" strokeWidth="2"/>
                        {/* Ground */}
                        <ellipse cx="65" cy="97" rx="55" ry="5" fill="#C8E6C9" opacity="0.5"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Parking Card */}
                {event.parkingInfo && (
                  <div className="elp-p2-card">
                    <div className="elp-p2-card-split">
                      <div className="elp-p2-card-text">
                        <div className="elp-p2-card-header">
                          <span className="elp-p2-card-icon-small">🚗</span>
                          <h2 className="elp-p2-card-title-small">Parking</h2>
                        </div>
                        <div className="elp-p2-card-val-text">{event.parkingInfo}</div>
                      </div>
                      <div className="elp-p2-card-illus">
                        <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Car body */}
                          <path d="M15 50 C15 42 25 38 35 38 L65 38 C75 38 85 42 85 50 L85 58 C85 62 82 64 78 64 L22 64 C18 64 15 62 15 58 Z" fill="color-mix(in srgb, var(--t-accent) 70%, #fff)"/>
                          {/* Car roof */}
                          <path d="M30 38 C32 26 68 26 70 38" fill="color-mix(in srgb, var(--t-accent) 50%, #fff)" stroke="color-mix(in srgb, var(--t-accent) 40%, #fff)" strokeWidth="1"/>
                          {/* Windows */}
                          <path d="M35 36 C36 28 48 28 49 36" fill="#E3F2FD" opacity="0.8"/>
                          <path d="M52 36 C53 28 64 28 65 36" fill="#E3F2FD" opacity="0.8"/>
                          {/* Wheels */}
                          <circle cx="30" cy="64" r="8" fill="#424242"/>
                          <circle cx="30" cy="64" r="4" fill="#9E9E9E"/>
                          <circle cx="70" cy="64" r="8" fill="#424242"/>
                          <circle cx="70" cy="64" r="4" fill="#9E9E9E"/>
                          {/* Headlights */}
                          <ellipse cx="84" cy="50" rx="3" ry="4" fill="#FFF9C4" opacity="0.8"/>
                          {/* Grass tufts */}
                          <path d="M5 72 C7 66 10 72 12 66" stroke="#81C784" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
                          <path d="M88 72 C90 66 93 72 95 66" stroke="#81C784" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gift Card */}
                {rsvpStatus === 'yes' && (event.giftRegistryNote || event.giftRegistryLink) && (
                  <div className="elp-p2-card">
                    <div className="elp-p2-card-split">
                      <div className="elp-p2-card-text">
                        <div className="elp-p2-card-header">
                          <span className="elp-p2-card-icon-small">🎁</span>
                          <h2 className="elp-p2-card-title-small">Gift Information</h2>
                        </div>
                        <div className="elp-p2-card-val-text">
                          {event.giftRegistryNote || "Your presence is the best gift! If you'd like to bring something, a book would be lovely."}
                          {event.giftRegistryLink && (
                            <div style={{ marginTop: 8 }}>
                              <a href={event.giftRegistryLink} target="_blank" rel="noreferrer" className="elp-p2-gift-link">View Registry →</a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="elp-p2-card-illus">
                        <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Sparkles */}
                          <path d="M15 25 L18 20 L21 25 L18 30 Z" fill="color-mix(in srgb, var(--t-accent) 40%, #FFD700)" opacity="0.6"/>
                          <path d="M90 15 L93 12 L96 15 L93 18 Z" fill="color-mix(in srgb, var(--t-accent) 30%, #fff)" opacity="0.5"/>
                          <path d="M95 70 L97 67 L99 70 L97 73 Z" fill="color-mix(in srgb, var(--t-accent) 30%, #B39DDB)" opacity="0.5"/>
                          {/* Bottom Book */}
                          <rect x="20" y="78" width="65" height="14" rx="4" fill="color-mix(in srgb, var(--t-accent) 25%, #B39DDB)"/>
                          <rect x="20" y="81" width="65" height="2" fill="color-mix(in srgb, var(--t-accent) 35%, #9575CD)" opacity="0.5"/>
                          {/* Middle Book */}
                          <rect x="25" y="64" width="55" height="14" rx="4" fill="color-mix(in srgb, var(--t-accent) 45%, #F8BBD0)"/>
                          <rect x="25" y="67" width="55" height="2" fill="color-mix(in srgb, var(--t-accent) 55%, #F48FB1)" opacity="0.5"/>
                          {/* Top Book */}
                          <rect x="30" y="50" width="45" height="14" rx="4" fill="color-mix(in srgb, var(--t-accent) 70%, #fff)"/>
                          <rect x="30" y="53" width="45" height="2" fill="var(--t-accent)" opacity="0.4"/>
                          {/* Heart on top */}
                          <path d="M52 44 C52 44 47 37 42 40 C37 44 40 52 52 58 C64 52 67 44 62 40 C57 37 52 44 52 44 Z" fill="var(--t-accent)"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* General Info Card */}
                {event.generalInfo && (
                  <div className="elp-p2-card">
                    <div className="elp-p2-card-header">
                      <span className="elp-p2-card-icon-small">✨</span>
                      <h2 className="elp-p2-card-title-small">General Information</h2>
                    </div>
                    <div className="elp-p2-card-val-text" style={{ whiteSpace: 'pre-wrap' }}>
                      {event.generalInfo}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* 3. Footer */}
            <div className="elp-p2-footer">
              <div className="elp-p2-footer-msg">
                💕 We can't wait to celebrate with you! 💕
              </div>
              <p className="elp-p2-powered">Powered by <a href="/">KidsBash</a></p>
            </div>

          </div>
        ) : (
          /* =========================================
             AUTH PORTAL VIEW (Pre-RSVP or New Device)
             ========================================= */
          <div className="elp-card-invitation">
            <div className="elp-card-border-inner">
              <div className="elp-hero" style={{ paddingTop: '24px' }}>
                <h1 className="elp-title">Event Portal</h1>
                <p className="elp-subtitle" style={{ marginTop: '8px' }}>
                  Please verify your RSVP to view the party details.
                </p>
              </div>

              <div className="elp-divider">
                <span className="elp-divider-dot"></span>
                <span className="elp-divider-line"></span>
                <span className="elp-divider-dot"></span>
              </div>

              <div className="elp-card-rsvp-wrap" style={{ marginTop: '24px', padding: '0 16px' }}>
                {event.authType === 'password' ? (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setLookupError('');
                      if (lookupContact.trim() === event.eventPassword) {
                        localStorage.setItem(`rsvp_${event.id}`, 'auth_only');
                        setHasRsvped(true);
                      } else {
                        setLookupError('Incorrect password.');
                      }
                    }} 
                    className="elp-lookup-form"
                    style={{ display: 'block', padding: '24px', border: '1px solid var(--t-border)', borderRadius: '16px', background: 'var(--t-surface)' }}
                  >
                    <div className="elp-lookup-field">
                      <label className="elp-lookup-label">Event Password</label>
                      <input 
                        type="password" 
                        className="elp-lookup-input" 
                        placeholder="Enter password..." 
                        value={lookupContact} 
                        onChange={e => setLookupContact(e.target.value)} 
                        required
                      />
                    </div>
                    {lookupError && <p className="elp-lookup-error">{lookupError}</p>}
                    <button type="submit" className="elp-btn elp-btn-accent elp-lookup-submit">
                      Unlock Portal
                    </button>
                  </form>
                ) : (
                  <form 
                    onSubmit={handleLookup} 
                    className="elp-lookup-form"
                    style={{ display: 'block', padding: '24px', border: '1px solid var(--t-border)', borderRadius: '16px', background: 'var(--t-surface)' }}
                  >
                    <div className="elp-lookup-field">
                      <label className="elp-lookup-label">Child's Name *</label>
                      <input 
                        type="text" 
                        className="elp-lookup-input" 
                        placeholder="e.g. Emily" 
                        value={lookupChildName} 
                        onChange={e => setLookupChildName(e.target.value)} 
                        required
                      />
                    </div>

                    <div className="elp-lookup-field">
                      <label className="elp-lookup-label">Parent's Email or Phone *</label>
                      <input 
                        type="text" 
                        className="elp-lookup-input" 
                        placeholder="e.g. sarah@example.com or 0400000000" 
                        value={lookupContact} 
                        onChange={e => setLookupContact(e.target.value)} 
                        required
                      />
                    </div>

                    {lookupError && <p className="elp-lookup-error">{lookupError}</p>}

                    <button 
                      type="submit" 
                      className="elp-btn elp-btn-accent elp-lookup-submit" 
                      disabled={lookupLoading}
                    >
                      {lookupLoading ? "Searching..." : "🔍 Find RSVP"}
                    </button>
                  </form>
                )}

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--t-text)', fontSize: '0.9rem', marginBottom: '12px' }}>
                    Haven't RSVP'd yet?
                  </p>
                  <Link to={`/${slug}/rsvp`} className="elp-btn elp-btn-lg" style={{ background: 'var(--t-surface)', border: '2px solid var(--t-accent)', color: 'var(--t-accent)', width: '100%', display: 'flex', justifyContent: 'center' }}>
                    View Invitation & RSVP
                  </Link>
                </div>
              </div>

              {/* Decorative Theme Illustration at Bottom */}
              <div className="elp-illustration-container" style={{ marginTop: '32px', opacity: 0.8 }}>
                <div className="elp-illustration-wrap" style={{ maxWidth: '100px' }}>
                  <ThemeIllustration theme={themeKey} themeColor={event.themeColor} />
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </ThemedPage>
  );
}
