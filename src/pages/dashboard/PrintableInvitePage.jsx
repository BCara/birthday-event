import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ThemeIllustration from '../../theme/ThemeIllustration';
import { getTheme } from '../../theme/themes';
import { getDevSafeOrigin } from '../../utils/url';
import './PrintableInvitePage.css';

export default function PrintableInvitePage() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const guestName = searchParams.get('guestName');
  const sizeParam = searchParams.get('size') || 'A5';
  const paperSize = sizeParam.toUpperCase() === 'A4' ? 'A4' : 'A5';
  const bgParam = searchParams.get('bg') || 'white';
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        const snap = await getDoc(doc(db, 'events', eventId));
        if (snap.exists()) {
          setEvent({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error('Failed to load event for printing:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (!loading && event) {
      // Small delay to ensure images/fonts are rendered before printing
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, event]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        Loading invitation...
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h2>Event not found</h2>
      </div>
    );
  }

  const formattedDate = event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }) : 'Date TBD';

  const formatTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`;
  };

  const tStart = formatTime(event.time) || 'Time TBD';
  const tEnd = formatTime(event.endTime);
  const timeString = tEnd ? `${tStart} – ${tEnd}` : tStart;

  const normalizedThemeKey = event.theme && !event.theme.startsWith('kids-') ? `kids-${event.theme}` : event.theme;
  const themeData = getTheme(normalizedThemeKey, event.themeColor || 'default');
  const cssVars = Object.fromEntries(
    Object.entries(themeData.vars).map(([k, v]) => [k, v])
  );
  const patternUrl = themeData.patternSvg(themeData.vars['--t-accent']);

  const inviteUrl = event.slug ? `${getDevSafeOrigin()}/${event.slug}` : 'kidsbash.com/r/...';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteUrl)}`;

  const cardStyle = bgParam === 'theme' ? {
    ...cssVars,
    background: `${patternUrl}, linear-gradient(160deg, var(--t-bg-from) 0%, var(--t-bg-to) 100%)`,
    backgroundAttachment: 'local',
    color: 'var(--t-text)'
  } : {};

  return (
    <div className={`printable-invite-root size-${paperSize.toLowerCase()} bg-${bgParam}`}>
      <style>{`
        @media print {
          @page {
            size: ${paperSize} portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      
      <div className="printable-invite-card" style={cardStyle}>
        <div className="printable-card-inner">
          
          <div className="printable-invite-header">
            <span className="printable-badge">You're Invited!</span>
          </div>

          <div className="printable-illustration-wrap">
            {event.photoUrl ? (
              <img src={event.photoUrl} alt="Birthday Star" className="printable-photo" />
            ) : (
              <ThemeIllustration theme={normalizedThemeKey} themeColor={event.themeColor || 'default'} />
            )}
          </div>

          <div className="printable-hero">
            <h1 className="printable-title">{event.name || 'Birthday Party'}</h1>
            {event.childName && (
              <p className="printable-subtitle">Celebrating {event.childName}'s special day</p>
            )}
          </div>

          {guestName && (
            <div className="printable-guest-name">
              For: {guestName}
            </div>
          )}

          <div className="printable-details">
            <div className="printable-detail-row">
              <strong>When</strong>
              <span>{formattedDate} • {timeString}</span>
            </div>
            <div className="printable-detail-row">
              <strong>Where</strong>
              <span>{event.location || 'Location TBD'}</span>
            </div>
            {(event.hostName || event.hostContact) && (
              <div className="printable-detail-row">
                <strong>tinypartyportal.com/{event.slug}</strong>
                <span>
                  {event.hostName && event.hostName}
                  {event.hostName && event.hostContact && ' • '}
                  {event.hostContact && event.hostContact}
                </span>
              </div>
            )}
          </div>

          {event.description && (
            <div className="printable-description">
              <p>{event.description}</p>
            </div>
          )}

          <div className="printable-footer">
            <div className="printable-qr-wrap">
              <img src={qrCodeUrl} alt="RSVP QR Code" className="printable-qr" />
              <div className="printable-qr-text">
                <strong>Scan to RSVP</strong>
                {event.rsvpByDate && (
                  <span>by {new Date(event.rsvpByDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                )}
                <span className="printable-url">{inviteUrl.replace(/^https?:\/\//, '')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
