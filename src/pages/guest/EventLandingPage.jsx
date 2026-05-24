// src/pages/guest/EventLandingPage.jsx
// The page guests see when scanning the QR code / opening the link.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import ThemedPage from '../../theme/ThemedPage';
import ThemeIllustration from '../../theme/ThemeIllustration';
import { fetchEventBySlug } from '../../utils/fetchEvent';
import { generateICS, downloadICS, getGoogleCalendarUrl } from '../../utils/calendarUtils';
import './EventLandingPage.css';
import { getDevSafeOrigin } from '../../utils/url';

function Spinner() {
  return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100dvh' }}><div className="kb-spinner" /></div>;
}

export default function EventLandingPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calOpen, setCalOpen] = useState(false);
  const [memoryDismissed, setMemoryDismissed] = useState(false);
  const [hasRsvped, setHasRsvped] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState(null); // 'yes' | 'no'
  const calRef = useRef(null);

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
      setMemoryDismissed(!!localStorage.getItem(`memory_dismissed_${event.id}`));
      setHasRsvped(!!localStorage.getItem(`rsvp_${event.id}`));
      setRsvpStatus(localStorage.getItem(`rsvp_status_${event.id}`));
    }
  }, [event?.id]);

  const isPostEvent = useMemo(() => {
    if (!event?.date) return false;
    return Date.now() > new Date(event.date + 'T23:59:59').getTime();
  }, [event?.date]);

  const pageUrl = useMemo(() => {
    return `${getDevSafeOrigin()}/${slug}`;
  }, [slug]);

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

  const calOpts = useMemo(() => event ? {
    title: event.name,
    date: event.date,
    time: event.time,
    endTime: event.endTime,
    location: event.location,
    description: event.description,
    url: pageUrl,
  } : null, [event, pageUrl]);

  const rsvpCalOpts = useMemo(() => event?.rsvpByDate ? {
    title: `RSVP: ${event.name}`,
    date: event.rsvpByDate,
    description: `Time to RSVP for ${event.name}!`,
    url: pageUrl,
  } : null, [event, pageUrl]);

  const handleDismiss = () => {
    setMemoryDismissed(true);
    if (event?.id) localStorage.setItem(`memory_dismissed_${event.id}`, '1');
  };

  if (loading) return <Spinner />;

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

        {/* Post-event memory banner (for both views, though style differently or keep as is) */}
        {isPostEvent && !memoryDismissed && (
          <div className="elp-banner">
            <span className="elp-banner-emoji">📸</span>
            <div className="elp-banner-text">
              <strong>Hope the party was amazing!</strong>
              <span>Share a photo or leave a birthday wish for {event.childName || 'the birthday star'}!</span>
            </div>
            <div className="elp-banner-actions">
              <Link to={`/${slug}/leave`} className="elp-btn elp-btn-accent elp-btn-sm">Leave a Memory</Link>
              <button className="elp-dismiss" onClick={handleDismiss} aria-label="Dismiss">✕</button>
            </div>
          </div>
        )}

        {hasRsvped ? (
          /* =========================================
             EVENT PORTAL VIEW (Post-RSVP)
             ========================================= */
          <div className="elp-portal-layout">
            <div className="elp-portal-header-wrap">
              <div className="elp-portal-intro">
                <span className={`elp-portal-badge ${rsvpStatus === 'yes' ? 'attending' : 'declined'}`}>
                  {rsvpStatus === 'yes' ? "🎉 You're Going!" : "😢 Can't Make It"}
                </span>
                <Link to={`/${slug}/rsvp`} className="elp-btn-change-rsvp elp-portal-change-btn">
                  🔄 Change RSVP
                </Link>
              </div>
              <h1 className="elp-portal-title">{event.name}</h1>
              {event.childName && <p className="elp-portal-subtitle">Celebrating {event.childName}'s special day!</p>}
            </div>

            <div className="elp-portal-grid">
              {/* Event Details Card */}
              <div className="elp-portal-card">
                <h2 className="elp-portal-card-title">📌 Event Details</h2>
                <div className="elp-portal-details">
                  {formattedDate && <div className="elp-portal-row"><span>📅</span> {formattedDate}</div>}
                  {formattedTime && <div className="elp-portal-row"><span>🕐</span> {formattedTime} {event.endTime && `– ${(() => { const [h,m] = event.endTime.split(':'); const hr=parseInt(h,10); return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`; })()}`}</div>}
                  {event.location && <div className="elp-portal-row"><span>📍</span> {event.location}</div>}
                </div>
                {event.date && (
                  <div className="elp-portal-actions">
                    <button 
                      className="elp-btn elp-btn-light elp-btn-sm" 
                      onClick={() => window.open(getGoogleCalendarUrl(calOpts), '_blank')}
                    >
                      📅 Add to Calendar
                    </button>
                  </div>
                )}
              </div>

              {/* Schedule Card */}
              {event.schedule && (
                <div className="elp-portal-card">
                  <h2 className="elp-portal-card-title">⏱️ Schedule</h2>
                  <div className="elp-portal-text">{event.schedule}</div>
                </div>
              )}

              {/* Parking & Info Card */}
              {event.parkingInfo && (
                <div className="elp-portal-card">
                  <h2 className="elp-portal-card-title">🚗 Parking & Info</h2>
                  <div className="elp-portal-text">{event.parkingInfo}</div>
                </div>
              )}

              {/* Description Card */}
              {event.description && (
                <div className="elp-portal-card">
                  <h2 className="elp-portal-card-title">💬 Message from Host</h2>
                  <div className="elp-portal-text">{event.description}</div>
                </div>
              )}

              {/* Gift Registry Card */}
              {rsvpStatus === 'yes' && event.giftRegistryNote && (
                <div className="elp-portal-card elp-portal-highlight">
                  <h2 className="elp-portal-card-title">🎁 Gift Registry</h2>
                  <p className="elp-portal-text">{event.giftRegistryNote}</p>
                  {event.giftRegistryLink && (
                    <div style={{ marginTop: 12 }}>
                      <a href={event.giftRegistryLink} target="_blank" rel="noopener noreferrer" className="elp-btn elp-btn-outline elp-btn-sm">
                        View Registry →
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Memory Capture Card */}
              {rsvpStatus === 'yes' && (
                <div className="elp-portal-card elp-portal-memories">
                  <h2 className="elp-portal-card-title">📸 Capture the Moment</h2>
                  <p className="elp-portal-text">Share your photos and wishes with {event.childName || 'the birthday star'}!</p>
                  <div className="elp-portal-actions-row">
                    <Link to={`/${slug}/leave`} className="elp-btn elp-btn-accent elp-btn-sm">
                      Leave a Memory
                    </Link>
                    <Link to={`/${slug}/memories`} className="elp-btn elp-btn-light elp-btn-sm">
                      View Wall
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="elp-portal-footer">
              <p>Powered by <a href="/" className="elp-portal-footer-link">KidsBash</a></p>
            </div>
          </div>
        ) : (
          /* =========================================
             INVITATION VIEW (Pre-RSVP)
             ========================================= */
          <>
            {/* Invitation Card */}
            <div className="elp-card-invitation">
              <div className="elp-card-border-inner">
                
                {/* Header Badge */}
                <div className="elp-invitation-intro">
                  <span className="elp-invitation-badge">You're Invited!</span>
                </div>

                {/* Celebration details above illustration */}
                <div className="elp-hero">
                  <h1 className="elp-title">{event.name}</h1>
                  {event.childName && <p className="elp-subtitle">Celebrating {event.childName}'s special day!</p>}
                </div>

                {/* Photo OR Illustration */}
                <div className="elp-illustration-container">
                  {event.photoUrl ? (
                    <div className="elp-photo-wrap">
                      <img src={event.photoUrl} alt={event.name} className="elp-photo" />
                    </div>
                  ) : (
                    <div className="elp-illustration-wrap">
                      <ThemeIllustration theme={themeKey} themeColor={event.themeColor} />
                    </div>
                  )}
                </div>

                <div className="elp-divider">
                  <span className="elp-divider-dot"></span>
                  <span className="elp-divider-line"></span>
                  <span className="elp-divider-dot"></span>
                </div>

                {/* Centered Details */}
                <div className="elp-details-clean">
                  {formattedDate && (
                    <div className="elp-detail-item">
                      <span className="elp-detail-icon-clean">📅</span>
                      <div className="elp-detail-content-clean">
                        <div className="elp-detail-label-clean">Date</div>
                        <div className="elp-detail-value-clean">{formattedDate}</div>
                      </div>
                      {event.date && (
                        <div className="elp-card-cal-wrap" ref={calRef} data-open={calOpen}>
                          <button 
                            className="elp-card-cal-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setCalOpen(v => !v);
                            }}
                            aria-label="Add to calendar"
                          >
                            <span>Add to Cal</span>
                            <svg className="elp-cal-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </button>
                          {calOpen && (
                            <div className="elp-card-cal-dropdown">
                              <button className="elp-card-cal-option" onClick={() => { window.open(getGoogleCalendarUrl(calOpts), '_blank'); setCalOpen(false); }}>
                                Google Calendar
                              </button>
                              <button className="elp-card-cal-option" onClick={() => { downloadICS(generateICS(calOpts), `${slug}.ics`); setCalOpen(false); }}>
                                Apple / Outlook
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {formattedTime && (
                    <div className="elp-detail-item">
                      <span className="elp-detail-icon-clean">🕐</span>
                      <div className="elp-detail-content-clean">
                        <div className="elp-detail-label-clean">Time</div>
                        <div className="elp-detail-value-clean">
                          {formattedTime}
                          {event.endTime && ` – ${(() => { const [h,m] = event.endTime.split(':'); const hr=parseInt(h,10); return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`; })()}`}
                        </div>
                      </div>
                    </div>
                  )}
                  {event.location && (
                    <div className="elp-detail-item">
                      <span className="elp-detail-icon-clean">📍</span>
                      <div className="elp-detail-content-clean">
                        <div className="elp-detail-label-clean">Location</div>
                        <div className="elp-detail-value-clean">{event.location}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RSVP By Deadline */}
                {formattedRsvpBy && (
                  <div className="elp-rsvp-deadline">
                    <span className="elp-deadline-text">Please RSVP by {formattedRsvpBy}</span>
                    <div className="elp-deadline-reminder">
                      <button 
                        className="elp-deadline-btn"
                        onClick={() => {
                          window.open(getGoogleCalendarUrl(rsvpCalOpts), '_blank');
                        }}
                      >
                        ⏰ Set Reminder
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Description */}
                {event.description && (
                  <>
                    <div className="elp-divider">
                      <span className="elp-divider-dot"></span>
                      <span className="elp-divider-line"></span>
                      <span className="elp-divider-dot"></span>
                    </div>
                    <div className="elp-desc-clean">
                      <p>{event.description}</p>
                    </div>
                  </>
                )}

                {/* RSVP Now inside the card */}
                {event.rsvpEnabled && (
                  <div className="elp-card-rsvp-wrap">
                    <Link to={`/${slug}/rsvp`} className="elp-btn elp-btn-accent elp-btn-lg elp-card-rsvp-btn" id="rsvp-btn">
                      ✉️ RSVP Now
                    </Link>
                  </div>
                )}

              </div>
            </div>

            {/* Footer */}
            <div className="elp-footer">
              <p>Powered by <a href="/" className="elp-footer-link">KidsBash</a></p>
            </div>
          </>
        )}

      </div>
    </ThemedPage>
  );
}
