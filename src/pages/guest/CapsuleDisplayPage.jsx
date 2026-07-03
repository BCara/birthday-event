// src/pages/guest/CapsuleDisplayPage.jsx
// Public day-of "scan to contribute" poster for the Memory Capsule.
// Shows the event name, birthday star photo, a crisp QR to /{slug}/memories/new,
// and a live "N memories shared!" count. Tablet-sized; never shows submitted
// memories (the capsule is private by design).
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../../firebase';
import { fetchEventBySlug } from '../../utils/fetchEvent';
import { getDevSafeOrigin } from '../../utils/url';
import ThemedPage from '../../theme/ThemedPage';
import ThemeIllustration from '../../theme/ThemeIllustration';
import './CapsuleDisplayPage.css';

export default function CapsuleDisplayPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound
  const [count, setCount] = useState(null);
  const [isFs, setIsFs] = useState(false);
  const wakeRef = useRef(null);

  // Fetch the (published) event by slug.
  useEffect(() => {
    let active = true;
    fetchEventBySlug(slug)
      .then(e => {
        if (!active) return;
        if (e) {
          setEvent(e);
          setCount(typeof e.memoryCount === 'number' ? e.memoryCount : null);
          setStatus('ready');
        } else {
          setStatus('notfound');
        }
      })
      .catch(() => { if (active) setStatus('notfound'); });
    return () => { active = false; };
  }, [slug]);

  // Live memory count via the event doc (public read; memories themselves stay private).
  useEffect(() => {
    if (!event?.id) return undefined;
    const unsub = onSnapshot(
      doc(db, 'events', event.id),
      snap => {
        const c = snap.data()?.memoryCount;
        if (typeof c === 'number') setCount(c);
      },
      () => {},
    );
    return unsub;
  }, [event?.id]);

  // Keep the tablet screen awake during the party.
  useEffect(() => {
    async function acquire() {
      try {
        if ('wakeLock' in navigator) {
          wakeRef.current = await navigator.wakeLock.request('screen');
        }
      } catch { /* unsupported or denied — non-fatal */ }
    }
    acquire();
    const onVis = () => { if (document.visibilityState === 'visible') acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      try { wakeRef.current?.release?.(); } catch { /* ignore */ }
    };
  }, []);

  // Track fullscreen state for the toggle label.
  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* ignore */ }
  }, []);

  if (status === 'loading') {
    return <div className="cd-fallback"><div className="cd-spinner" /></div>;
  }
  if (status === 'notfound') {
    return (
      <div className="cd-fallback">
        <div style={{ fontSize: 56 }}>🎈</div>
        <h1>Party not found</h1>
        <p>Double-check the link and try again.</p>
      </div>
    );
  }

  const themeKey = event.theme?.startsWith('kids-') ? event.theme : `kids-${event.theme || 'generic'}`;
  const submissionUrl = `${getDevSafeOrigin()}/${slug}/memories/new`;
  const eyebrow = event.memoriesTitle || `${event.childName ? `${event.childName}'s ` : ''}Memory Capsule`;
  const birthdayLine = event.name || 'Birthday';
  const helpText = event.memoriesMessage
    || `Help fill ${event.childName ? `${event.childName}'s` : 'the'} Memories with photos from today – this won't be shared on social media!`;

  return (
    <ThemedPage themeKey={themeKey} themeColor={event.themeColor}>
      <div className="cd-root">
        <button className="cd-fs-btn" onClick={toggleFullscreen} type="button">
          {isFs ? '⤡ Exit' : '⤢ Fullscreen'}
        </button>

        <div className="cd-eyebrow">💗 {eyebrow} 💗</div>

        <div className="cd-grid">
          {/* LEFT: branding */}
          <div className="cd-brand">
            <div className="cd-brand-row">
              <div className="cd-illustration">
                <ThemeIllustration theme={themeKey} themeColor={event.themeColor} />
              </div>
              <div className="cd-event-title">
                {event.childName ? (
                  <>
                    <span className="cd-ev-name">{event.childName}'s</span>
                    <span className="cd-ev-rest">{birthdayLine}</span>
                  </>
                ) : (
                  <span className="cd-ev-name">{event.name}</span>
                )}
              </div>
            </div>

            {event.photoUrl && (
              <div className="cd-photo-frame">
                <img src={event.photoUrl} alt={event.childName || event.name} className="cd-photo" />
              </div>
            )}

            <p className="cd-help">{helpText}</p>
            {typeof count === 'number' && count > 0 && (
              <div className="cd-count">📸 {count} {count === 1 ? 'memory' : 'memories'} shared!</div>
            )}
          </div>

          {/* RIGHT: QR */}
          <div className="cd-qr-side">
            <div className="cd-qr-card">
              <QRCodeSVG
                value={submissionUrl}
                level="M"
                size={512}
                bgColor="#ffffff"
                fgColor="#2d1b69"
                className="cd-qr"
              />
            </div>
            <p className="cd-scan-label">📸 Scan to upload photos or messages</p>
            <p className="cd-privacy">🔒 This won't be shared on social media</p>
            <p className="cd-url">{submissionUrl.replace(/^https?:\/\//, '')}</p>
          </div>
        </div>
      </div>
    </ThemedPage>
  );
}
