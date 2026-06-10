import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ThemeIllustration from '../../theme/ThemeIllustration';
import { getTheme } from '../../theme/themes';
import { getDevSafeOrigin } from '../../utils/url';
import html2canvas from 'html2canvas';
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
  const cardRef = React.useRef(null);

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

  function handlePrint() {
    window.print();
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${(event.name || 'invitation').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download image', err);
      alert('Failed to download image. Try printing to PDF instead.');
    }
  }

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
  } : {
    ...cssVars,
  };

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
          .printable-actions {
            display: none !important;
          }
        }
      `}</style>

      <div className="printable-actions">
        <button onClick={handlePrint} className="printable-btn">🖨️ Print</button>
        <button onClick={handleDownload} className="printable-btn">⬇️ Download as Image</button>
      </div>
      
      <div className="printable-invite-card" style={cardStyle} ref={cardRef}>
        <div className="printable-card-inner">
          
          <div className="printable-invite-header">
            <span className="printable-badge">YOU'RE INVITED!</span>
            {guestName && (
              <div className="printable-guest-name">
                For: {guestName}
              </div>
            )}
          </div>

          <div className="printable-illustration-wrap">
            {event.photoUrl ? (
              <img src={event.photoUrl} alt="Birthday Star" className="printable-photo" />
            ) : (
              <ThemeIllustration theme={normalizedThemeKey} themeColor={event.themeColor || 'default'} />
            )}
          </div>

          <div className="printable-hero">
            <h1 className="printable-title-huge">{event.childName || event.name || 'Birthday Party'}</h1>
            {event.childName && (
              <h2 className="printable-title-sub">{event.name}</h2>
            )}
            
            <p className="printable-subtitle">
              {event.description || 'Join us for a magical celebration!'}
            </p>
          </div>

          <div className="printable-details-grid">
            <div className="pd-row">
              <span className="pd-icon">📅</span>
              <div className="pd-sep"></div>
              <div className="pd-text">{formattedDate}</div>
            </div>
            
            <div className="pd-row">
              <span className="pd-icon">🕒</span>
              <div className="pd-sep"></div>
              <div className="pd-text">{timeString}</div>
            </div>

            <div className="pd-row">
              <span className="pd-icon">📍</span>
              <div className="pd-sep"></div>
              <div className="pd-text">{event.location || 'Location TBD'}</div>
            </div>
          </div>

          {event.rsvpEnabled !== false && (
            <div className="printable-qr-box">
              <img src={qrCodeUrl} alt="RSVP QR Code" className="printable-qr-img" />
              <div className="printable-qr-info">
                <strong>SCAN TO RSVP</strong>
                {event.rsvpByDate && (
                  <span className="qr-date">By {new Date(event.rsvpByDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                )}
              </div>
            </div>
          )}

          <div className="printable-footer">
            <p>
              {event.hostName && event.hostName}
              {event.hostName && event.hostContact && ' • '}
              {event.hostContact && event.hostContact}
            </p>
            <p className="printable-footer-url">{inviteUrl.replace(/^https?:\/\//, '')}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
