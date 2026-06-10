// src/pages/guest/LiveDisplayPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import ThemedPage from '../../theme/ThemedPage';
import { fetchEventBySlug } from '../../utils/fetchEvent';
import { db } from '../../firebase';
import './LiveDisplayPage.css';
import { getDevSafeOrigin } from '../../utils/url';

function Spinner() {
  return (
    <div className="ldp-center">
      <div className="kb-spinner" />
    </div>
  );
}

function timeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function LiveDisplayPage() {
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const prevFirstIdRef = useRef(null);

  // 1. Fetch Event Details
  useEffect(() => {
    console.log("Fetching event for LiveDisplay, slug:", slug);
    fetchEventBySlug(slug)
      .then(e => {
        setEvent(e);
        setEventLoading(false);
      })
      .catch(err => {
        console.error("fetchEventBySlug failed in LiveDisplayPage:", err);
        setEventLoading(false);
      });
  }, [slug]);

  // 2. Subscribe to Approved Memories in Real-Time
  useEffect(() => {
    if (!event?.id) return;
    const q = query(
      collection(db, 'memories'),
      where('eventId', '==', event.id),
      where('approved', '==', true),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMemories(list);
      setMemoriesLoading(false);
    }, (err) => {
      console.error("Memories sub failed:", err);
      setMemoriesLoading(false);
    });

    return () => unsub();
  }, [event?.id]);

  // 3. Reactively show new memories immediately
  useEffect(() => {
    if (memories.length > 0) {
      const currentFirstId = memories[0].id;
      // If there was a previous list and the top memory ID changed, jump to it!
      if (prevFirstIdRef.current && prevFirstIdRef.current !== currentFirstId) {
        setActiveIndex(0);
      }
      prevFirstIdRef.current = currentFirstId;
    }
  }, [memories]);

  // 4. Auto-advance slideshow interval
  useEffect(() => {
    if (memories.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % memories.length);
    }, 7000); // transition every 7 seconds
    return () => clearInterval(interval);
  }, [memories.length]);

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
        <div className="ldp-center">
          <div className="ldp-empty">
            <div className="ldp-empty-emoji">🎈</div>
            <h1 className="ldp-empty-title">Event not found</h1>
            <p className="ldp-empty-sub">Double-check your link or scan the QR code again.</p>
          </div>
        </div>
      </ThemedPage>
    );
  }

  const themeKey = event.theme?.startsWith('kids-') ? event.theme : `kids-${event.theme || 'generic'}`;
  const inviteUrl = `${getDevSafeOrigin()}/${slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteUrl)}`;

  const activeMemory = memories.length > 0 ? memories[activeIndex] : null;

  return (
    <ThemedPage themeKey={themeKey} themeColor={event.themeColor}>
      <div className="ldp-root-container">
        
        {/* Left Sidebar containing instructions & QR Code */}
        <aside className="ldp-sidebar">
          <div className="ldp-sidebar-top">
            <Link to={`/dashboard/event/${event.id}`} className="ldp-back-btn">
              ← Dashboard
            </Link>
            
            <div className="ldp-event-info">
              <h1 className="ldp-event-title">{event.name}</h1>
              {event.childName && (
                <p className="ldp-event-sub">Celebrating {event.childName}! 🎂</p>
              )}
            </div>
            
            <div className="ldp-qr-section">
              <div className="ldp-qr-wrapper">
                <img 
                  className="ldp-qr-image" 
                  src={qrCodeUrl} 
                  alt="Scan QR code to leave a memory" 
                />
              </div>
              <h2 className="ldp-qr-title">Share a Memory! 📸</h2>
              <p className="ldp-qr-desc">
                Scan this code with your phone camera to share a photo, video, or a birthday wish to this screen!
              </p>
            </div>
          </div>
          
          <div className="ldp-sidebar-bottom">
            <p className="ldp-sidebar-footer">
              Powered by <a href="/" className="ldp-footer-link">Tiny Party <span style={{ fontSize: '0.8em' }}>Portal</span></a>
            </p>
          </div>
        </aside>

        {/* Main projection display area */}
        <main className="ldp-main">
          {memoriesLoading ? (
            <Spinner />
          ) : !activeMemory ? (
            // Empty State
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="ldp-empty"
            >
              <span className="ldp-empty-emoji" style={{ animation: 'kb-float 4s ease-in-out infinite' }}>📸</span>
              <h2 className="ldp-empty-title">Be the first to share!</h2>
              <p className="ldp-empty-sub">
                Scan the QR code on the left to post a photo or birthday wish and see it appear here instantly!
              </p>
            </motion.div>
          ) : (
            // Slideshow Card
            <div className="ldp-slideshow-wrap">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeMemory.id}
                  initial={{ opacity: 0, scale: 0.94, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.03, y: -20 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="ldp-card"
                >
                  {/* Visual timer countdown progress bar */}
                  {memories.length > 1 && (
                    <motion.div
                      key={`progress-${activeMemory.id}`}
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 7, ease: 'linear' }}
                      style={{
                        height: 6,
                        background: 'var(--t-accent)',
                        borderRadius: '0 0 99px 99px',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    />
                  )}

                  {/* Media Content (Image/Video) */}
                  {activeMemory.mediaUrl && (
                    <div className="ldp-media-container">
                      {activeMemory.mediaType === 'video' ? (
                        <video
                          className="ldp-media"
                          src={activeMemory.mediaUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          className="ldp-media"
                          src={activeMemory.mediaUrl}
                          alt={`Memory by ${activeMemory.authorName}`}
                        />
                      )}
                    </div>
                  )}

                  {/* Text Wish & Footer */}
                  <div className="ldp-card-body">
                    {activeMemory.message && (
                      <p className="ldp-msg">“{activeMemory.message}”</p>
                    )}
                    
                    <div className="ldp-card-footer">
                      <h3 className="ldp-author">— {activeMemory.authorName}</h3>
                      <span className="ldp-date">• {timeAgo(activeMemory.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>
    </ThemedPage>
  );
}
