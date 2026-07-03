// src/pages/guest/LeaveMemoryPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import ThemedPage from '../../theme/ThemedPage';
import ThemeIllustration from '../../theme/ThemeIllustration';
import { fetchEventBySlug } from '../../utils/fetchEvent';
import { db, storage, trackEvent } from '../../firebase';
import './LeaveMemoryPage.css';

const MAX_FILES = 30;

function Spinner() {
  return (
    <div className="lm-center">
      <div className="kb-spinner" />
    </div>
  );
}

export default function LeaveMemoryPage() {
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [authorName, setAuthorName] = useState('');
  const [message, setMessage] = useState('');

  // Each entry: { file, previewUrl, type: 'image'|'video' }
  const [files, setFiles] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { index, total, pct }
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Track the current preview URLs so the unmount cleanup revokes the actual
  // set (avoids a stale closure over the first render's empty `files`).
  const previewUrlsRef = useRef([]);
  useEffect(() => {
    previewUrlsRef.current = files.map(f => f.previewUrl);
  }, [files]);

  useEffect(() => {
    fetchEventBySlug(slug)
      .then(e => { setEvent(e); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  // Revoke any remaining object URLs on unmount to avoid memory leaks.
  useEffect(() => {
    return () => previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const addFiles = (selected) => {
    const incoming = Array.from(selected).slice(0, MAX_FILES - files.length);
    const entries = incoming.map(f => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : 'image',
    }));
    setFiles(prev => [...prev, ...entries]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
  };

  const removeFile = (i) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[i].previewUrl);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const uploadOne = (entry, index, total) =>
    new Promise((resolve, reject) => {
      const token = crypto.randomUUID();
      const safeName = entry.file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
      const storageRef = ref(storage, `memories/${event.id}/${token}_${safeName}`);
      const task = uploadBytesResumable(storageRef, entry.file);
      task.on(
        'state_changed',
        snap => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setUploadProgress({ index: index + 1, total, pct });
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ url, type: entry.type });
        },
      );
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authorName.trim()) { setError('Please enter your name.'); return; }
    if (!files.length && !message.trim()) { setError('Please add a message or upload a photo/video.'); return; }
    setError('');
    setUploading(true);

    try {
      const media = [];
      for (let i = 0; i < files.length; i++) {
        const result = await uploadOne(files[i], i, files.length);
        media.push(result);
      }

      await addDoc(collection(db, 'memories'), {
        eventId: event.id,
        authorName: authorName.trim(),
        message: message.trim(),
        // Keep scalar fields for backward compat with existing dashboard/display code.
        mediaUrl: media[0]?.url ?? null,
        mediaType: media[0]?.type ?? null,
        media,
        createdAt: serverTimestamp(),
      });

      trackEvent('memory_uploaded', { has_media: media.length > 0, media_count: media.length });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  if (loading) return <Spinner />;

  if (!event) {
    return (
      <ThemedPage themeKey="kids-generic">
        <div className="lm-center">
          <div className="lm-notfound">
            <div className="lm-nf-emoji">🎈</div>
            <h1 className="lm-nf-title">Event not found</h1>
            <p className="lm-nf-sub">Double-check your link or scan the QR code again.</p>
          </div>
        </div>
      </ThemedPage>
    );
  }

  const themeKey = event.theme?.startsWith('kids-') ? event.theme : `kids-${event.theme || 'generic'}`;
  const birthdayLine = event.name || 'Birthday';

  if (success) {
    return (
      <ThemedPage themeKey={themeKey} themeColor={event.themeColor}>
        <div className="lm-center">
          <div className="lm-card lm-success-card">
            <div className="lm-success-emoji">🎉</div>
            <h1 className="lm-success-title">Memory saved!</h1>
            <p className="lm-success-msg">Thank you for sharing this special moment.</p>
            <div className="lm-success-actions">
              <Link to={`/${slug}`} className="lm-btn lm-btn-accent" style={{ width: '100%' }}>
                ← View Event Details
              </Link>
            </div>
          </div>
        </div>
      </ThemedPage>
    );
  }

  // Enforce the host's capsule settings: disabled, or outside the
  // open/close window. Mirrors EventLandingPage's `capsule` logic so
  // behaviour stays consistent across the guest experience.
  const now = Date.now();
  const openTime = event.memoriesOpenDate ? new Date(event.memoriesOpenDate + 'T00:00:00').getTime() : null;
  const closeTime = event.memoriesCloseDate ? new Date(event.memoriesCloseDate + 'T23:59:59').getTime() : null;
  const capsuleClosed =
    !event.memoriesEnabled ||
    (openTime && now < openTime) ||
    (closeTime && now > closeTime);

  if (capsuleClosed) {
    const notYetOpen = openTime && now < openTime;
    const openDateLabel = event.memoriesOpenDate
      ? new Date(event.memoriesOpenDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })
      : null;
    return (
      <ThemedPage themeKey={themeKey} themeColor={event.themeColor}>
        <div className="lm-center">
          <div className="lm-card lm-success-card">
            <div className="lm-success-emoji">📸</div>
            <h1 className="lm-success-title">The memory capsule isn't open</h1>
            <p className="lm-success-msg">
              {notYetOpen && openDateLabel
                ? `Check back from ${openDateLabel} to share your photos and messages.`
                : 'This memory capsule isn’t accepting new memories right now. Thanks so much for wanting to share!'}
            </p>
            <div className="lm-success-actions">
              <Link to={`/${slug}`} className="lm-btn lm-btn-accent" style={{ width: '100%' }}>
                ← View Event Details
              </Link>
            </div>
          </div>
        </div>
      </ThemedPage>
    );
  }

  const canAddMore = files.length < MAX_FILES;
  const progressLabel = uploadProgress
    ? `Uploading ${uploadProgress.index} of ${uploadProgress.total} — ${uploadProgress.pct}%`
    : null;

  return (
    <ThemedPage themeKey={themeKey} themeColor={event.themeColor}>
      <div className="lm-container">

        {/* Header — matches the invite / portal / display branding */}
        <div className="lm-header">
          <Link to={`/${slug}`} className="lm-back">← Back</Link>

          <div className="lm-brand-row">
            <div className="lm-illus">
              <ThemeIllustration theme={themeKey} themeColor={event.themeColor} />
            </div>
            <div className="lm-title-col">
              <span className="lm-ev-name">{event.childName ? `${event.childName}'s` : event.name}</span>
              {event.childName && <span className="lm-ev-rest">{birthdayLine}</span>}
            </div>
          </div>

          {event.photoUrl && (
            <div className="lm-star-photo-wrap">
              <img className="lm-star-photo" src={event.photoUrl} alt={event.childName || event.name} />
            </div>
          )}

          <h2 className="lm-page-title">📸 Share a Memory</h2>
        </div>

        <form className="lm-card" onSubmit={handleSubmit} noValidate>

          {/* Your Name */}
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-author">Your Name *</label>
            <input
              id="lm-author"
              className="lm-input"
              type="text"
              placeholder="e.g. Aunt Lisa"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              required
            />
          </div>

          {/* Message */}
          <div className="lm-field">
            <label className="lm-label" htmlFor="lm-message">Your Message <span className="lm-optional">optional</span></label>
            <textarea
              id="lm-message"
              className="lm-textarea"
              placeholder="Write a birthday wish…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* File upload — multiple */}
          <div className="lm-field">
            <label className="lm-label">
              Photos or Videos <span className="lm-optional">optional</span>
              {files.length > 0 && <span className="lm-file-count">{files.length}/{MAX_FILES}</span>}
            </label>

            {files.length > 0 && (
              <div className="lm-thumb-grid">
                {files.map((entry, i) => (
                  <div key={i} className="lm-thumb">
                    {entry.type === 'video' ? (
                      <div className="lm-thumb-video">🎬</div>
                    ) : (
                      <img className="lm-thumb-img" src={entry.previewUrl} alt={`Photo ${i + 1}`} />
                    )}
                    <button
                      type="button"
                      className="lm-thumb-remove"
                      onClick={() => removeFile(i)}
                      aria-label="Remove"
                    >✕</button>
                  </div>
                ))}

                {canAddMore && (
                  <label className="lm-thumb lm-thumb-add" htmlFor="lm-file-input" aria-label="Add more photos">
                    <span className="lm-thumb-add-icon">+</span>
                    <span className="lm-thumb-add-text">Add more</span>
                  </label>
                )}
              </div>
            )}

            {files.length === 0 && (
              <label className="lm-file-drop" htmlFor="lm-file-input">
                <span className="lm-file-icon">📷</span>
                <span className="lm-file-text">Click to add photos or videos</span>
                <span className="lm-file-hint">Select multiple at once — JPG, PNG, GIF, MP4, MOV</span>
              </label>
            )}

            <input
              id="lm-file-input"
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="lm-file-input-hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Upload progress */}
          {uploading && uploadProgress && (
            <div className="lm-progress-wrap">
              <div className="lm-progress-bar-bg">
                <div
                  className="lm-progress-bar"
                  style={{ width: `${uploadProgress.pct}%` }}
                />
              </div>
              <span className="lm-progress-label">{progressLabel}</span>
            </div>
          )}

          {error && <p className="lm-error">{error}</p>}

          <button
            type="submit"
            className="lm-btn lm-btn-accent lm-submit-btn"
            disabled={uploading}
            id="lm-submit"
          >
            {uploading ? progressLabel || 'Uploading…' : '💌 Share Memory'}
          </button>
        </form>

        <div className="lm-footer">
          <p>Powered by <a href="/" className="lm-footer-link">Tiny Party <span style={{ fontSize: '0.8em' }}>Portal</span></a></p>
        </div>
      </div>
    </ThemedPage>
  );
}
