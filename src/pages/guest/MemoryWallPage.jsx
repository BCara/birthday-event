// src/pages/guest/MemoryWallPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import ThemedPage from '../../theme/ThemedPage';
import ThemeIllustration from '../../theme/ThemeIllustration';
import { fetchEventBySlug } from '../../utils/fetchEvent';
import { db } from '../../firebase';
import './MemoryWallPage.css';

function Spinner() {
  return (
    <div className="mwp-center">
      <div className="kb-spinner" />
    </div>
  );
}

/** Returns a human-readable relative time string */
function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MemoryWallPage() {
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);

  // Load event
  useEffect(() => {
    console.log("Fetching event for MemoryWall, slug:", slug);
    fetchEventBySlug(slug)
      .then(e => {
        console.log("Fetched event for MemoryWall:", e);
        setEvent(e);
        setEventLoading(false);
      })
      .catch(err => {
        console.error("fetchEventBySlug failed in MemoryWallPage:", err);
        setEventLoading(false);
      });
  }, [slug]);

  // Subscribe to memories
  useEffect(() => {
    if (!event?.id) return;
    const q = query(
      collection(db, 'memories'),
      where('eventId', '==', event.id),
      where('approved', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMemories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMemoriesLoading(false);
    }, () => setMemoriesLoading(false));

    return () => unsub();
  }, [event?.id]);

  if (eventLoading) {
    return (
      <ThemedPage themeKey="kids-generic">
        <Spinner />
      </ThemedPage>
    );
  }

  if (!event) {
    return (
      <ThemedPage themeKey="kids-generic">
        <div className="mwp-center">
          <div className="mwp-empty">
            <div className="mwp-empty-emoji">🎈</div>
            <h1 className="mwp-empty-title">Event not found</h1>
            <p className="mwp-empty-sub">Double-check your link or scan the QR code again.</p>
          </div>
        </div>
      </ThemedPage>
    );
  }

  const themeKey = event.theme?.startsWith('kids-') ? event.theme : `kids-${event.theme || 'generic'}`;

  return (
    <ThemedPage themeKey={themeKey} themeColor={event.themeColor}>
      <div className="mwp-container">

        {/* Header */}
        <div className="mwp-header">
          <div className="mwp-header-left">
            <Link to={`/${slug}`} className="mwp-back-btn" aria-label="View Event Details">←</Link>
            <div style={{ width: '40px', height: '40px', marginRight: '8px', flexShrink: 0 }}>
              <ThemeIllustration theme={themeKey} themeColor={event.themeColor} />
            </div>
            <div>
              <h1 className="mwp-title">Memory Wall 📸</h1>
              <p className="mwp-subtitle">
                {event.childName ? `Celebrating ${event.childName}'s special day!` : 'Moments shared with love ✨'}
              </p>
            </div>
          </div>
          <Link to={`/${slug}/leave`} className="mwp-add-btn" id="mw-leave-btn">
            + Leave a Memory
          </Link>
        </div>

        {/* Content */}
        {memoriesLoading ? (
          <Spinner />
        ) : memories.length === 0 ? (
          <div className="mwp-empty">
            <div className="mwp-empty-emoji">📸</div>
            <h2 className="mwp-empty-title">No memories yet!</h2>
            <p className="mwp-empty-sub">Be the first to share a photo, video, or a birthday wish!</p>
            <Link to={`/${slug}/leave`} className="mwp-add-btn" style={{ display: 'inline-flex' }}>
              + Share a Memory
            </Link>
          </div>
        ) : (
          <div className="mwp-grid" id="mw-grid">
            {memories.map((mem) => (
              <div key={mem.id} className="mwp-card">
                {mem.mediaType === 'image' && mem.mediaUrl && (
                  <img
                    className="mwp-media"
                    src={mem.mediaUrl}
                    alt={`Memory by ${mem.authorName}`}
                    loading="lazy"
                  />
                )}
                {mem.mediaType === 'video' && mem.mediaUrl && (
                  <video
                    className="mwp-media"
                    src={mem.mediaUrl}
                    controls
                    playsInline
                  />
                )}
                <div className="mwp-content">
                  {mem.message && (
                    <p className="mwp-msg">{mem.message}</p>
                  )}
                  <div className="mwp-footer">
                    <h3 className="mwp-author">{mem.authorName}</h3>
                    <span className="mwp-date">{timeAgo(mem.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mwp-page-footer">
          <p>Powered by <a href="/" className="mwp-page-footer-link">Tiny Party <span style={{ fontSize: '0.8em' }}>Portal</span></a></p>
        </div>
      </div>
    </ThemedPage>
  );
}
