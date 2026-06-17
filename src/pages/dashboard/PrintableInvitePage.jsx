import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ThemeIllustration from '../../theme/ThemeIllustration';
import { getTheme } from '../../theme/themes';
import { getDevSafeOrigin } from '../../utils/url';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
      const element = cardRef.current;
      const rect = element.getBoundingClientRect();
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true,
        backgroundColor: null,
        width: rect.width,
        height: rect.height,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });
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

  async function handleDownloadPdf() {
    if (!cardRef.current) return;
    try {
      const element = cardRef.current;
      const rect = element.getBoundingClientRect();
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true,
        backgroundColor: null,
        width: rect.width,
        height: rect.height,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      });
      const imgData = canvas.toDataURL('image/png');
      
      const format = paperSize.toLowerCase(); // 'a4' or 'a5'
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: format
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      const pdfRatio = pdfWidth / pdfHeight;

      let drawWidth = pdfWidth;
      let drawHeight = pdfHeight;

      if (ratio > pdfRatio) {
        drawHeight = pdfWidth / ratio;
      } else {
        drawWidth = pdfHeight * ratio;
      }

      const x = (pdfWidth - drawWidth) / 2;
      const y = (pdfHeight - drawHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, drawWidth, drawHeight);
      pdf.save(`${(event.name || 'invitation').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF', err);
      alert('Failed to download PDF. Try using the Print button and "Save as PDF" instead.');
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

  const inviteUrl = event.slug ? `${getDevSafeOrigin()}/share/${event.slug}` : 'tinypartyportal.com/share/...';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteUrl)}`;

  const cardStyle = bgParam === 'theme' ? {
    ...cssVars,
    background: `linear-gradient(165deg, var(--t-bg-from) 0%, var(--t-bg-to) 100%)`,
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
        <button onClick={handleDownloadPdf} className="printable-btn">📄 Download as PDF</button>
        <button onClick={handleDownload} className="printable-btn">🖼️ Download as Image</button>
      </div>
      
      <div className="printable-invite-wrapper" ref={cardRef} style={{ display: 'inline-block', background: 'transparent', padding: '2px' }}>
        <div className="printable-invite-card" style={cardStyle}>
          {bgParam === 'theme' && (
             <div style={{ position: 'absolute', inset: 0, backgroundImage: patternUrl, backgroundSize: '120px 120px', zIndex: 0 }} />
          )}
          <div className="printable-card-inner" style={{ position: 'relative', zIndex: 1 }}>
          
          <div className="printable-invite-header">
            <span className="printable-badge">YOU'RE INVITED!</span>
            <div className="printable-guest-name">
              For: <span className="printable-name-line"></span>
            </div>
          </div>

          <div className="printable-illustration-wrap">
            {event.photoUrl ? (
              <img src={event.photoUrl} alt="Birthday Star" className="printable-photo" />
            ) : (
              <ThemeIllustration theme={normalizedThemeKey} themeColor={event.themeColor || 'default'} styleOverride={{ height: '30mm', width: 'auto', maxHeight: 'none' }} />
            )}
          </div>

          <div className="printable-hero">
            <h1 className="printable-title-huge">
              {event.childName 
                ? `${event.childName}${event.childName.toLowerCase().endsWith('s') || event.childName.includes("'") ? "" : "'s"}`
                : (event.name || 'Birthday Party')
              }
            </h1>
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
              <div className="pd-text">
                {event.location && <div style={{ fontWeight: 700 }}>{event.location}</div>}
                {event.address && (
                  <div style={{ fontWeight: 400, fontSize: '0.9em', opacity: 0.9 }}>
                    {(() => {
                      const loc = (event.location || '').trim().toLowerCase();
                      const addr = (event.address || '').trim();
                      if (loc && addr.toLowerCase().startsWith(loc)) {
                        return addr.slice(loc.length).replace(/^[,\s]+/, '');
                      }
                      return addr;
                    })()}
                  </div>
                )}
                {!event.location && !event.address && 'Location TBD'}
              </div>
            </div>

            {(event.hostName || event.hostContact) && (
              <div className="pd-row">
                <span className="pd-icon">📞</span>
                <div className="pd-sep"></div>
                <div className="pd-text">
                  {[event.hostName, event.hostContact].filter(Boolean).join(' • ')}
                </div>
              </div>
            )}
          </div>

          {event.rsvpEnabled !== false && (
            <div className="printable-qr-container">
              <div className="printable-qr-box">
                <img src={qrCodeUrl} alt="RSVP QR Code" className="printable-qr-img" />
                <div className="printable-qr-info">
                  <strong>SCAN TO RSVP</strong>
                  {event.rsvpByDate && (
                    <span className="qr-date">By {new Date(event.rsvpByDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                  )}
                </div>
              </div>
              <div className="printable-qr-url">
                {inviteUrl.replace(/^https?:\/\//, '')}
              </div>
            </div>
          )}

        </div>
      </div>
      </div>
    </div>
  );
}
