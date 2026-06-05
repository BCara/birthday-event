// src/pages/guest/LeaveMemoryPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import ThemedPage from '../../theme/ThemedPage';
import ThemeIllustration from '../../theme/ThemeIllustration';
import { fetchEventBySlug } from '../../utils/fetchEvent';
import { db, storage } from '../../firebase';
import './LeaveMemoryPage.css';

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
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null); // 'image' | 'video'

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    console.log("Fetching event for LeaveMemory, slug:", slug);
    fetchEventBySlug(slug)
      .then(e => {
        console.log("Fetched event for LeaveMemory:", e);
        setEvent(e);
        setLoading(false);
      })
      .catch(err => {
        console.error("fetchEventBySlug failed in LeaveMemoryPage:", err);
        setLoading(false);
      });
  }, [slug]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);

    const objectUrl = URL.createObjectURL(selected);
    setPreviewUrl(objectUrl);
    setPreviewType(selected.type.startsWith('video/') ? 'video' : 'image');
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setPreviewType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!authorName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!file && !message.trim()) {
      setError('Please add a message or upload a photo/video.');
      return;
    }
    setError('');
    setUploading(true);

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (file) {
        const timestamp = Date.now();
        const storageRef = ref(storage, `memories/${event.id}/${timestamp}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(pct);
            },
            reject,
            async () => {
              mediaUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });

        mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      }

      await addDoc(collection(db, 'memories'), {
        eventId: event.id,
        authorName: authorName.trim(),
        message: message.trim(),
        mediaUrl,
        mediaType,
        approved: true,
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setUploading(false);
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

  return (
    <ThemedPage themeKey={themeKey} themeColor={event.themeColor}>
      <div className="lm-container">

        {/* Header */}
        <div className="lm-header">
          <Link to={`/${slug}`} className="lm-back">← Back</Link>
          <div style={{ width: '100%', maxWidth: '80px', margin: '0 auto 8px' }}>
            <ThemeIllustration theme={themeKey} themeColor={event.themeColor} />
          </div>
          <h1 className="lm-page-title">Share a Memory</h1>
          <p className="lm-page-sub">for {event.name}</p>
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
            <label className="lm-label" htmlFor="lm-message">Your Message</label>
            <textarea
              id="lm-message"
              className="lm-textarea"
              placeholder="Write a birthday wish…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* File upload */}
          <div className="lm-field">
            <label className="lm-label">Photo or Video</label>

            {previewUrl ? (
              <div className="lm-preview-wrap">
                {previewType === 'video' ? (
                  <video
                    className="lm-preview"
                    src={previewUrl}
                    controls
                    playsInline
                  />
                ) : (
                  <img className="lm-preview" src={previewUrl} alt="Preview" />
                )}
                <button
                  type="button"
                  className="lm-clear-file"
                  onClick={clearFile}
                  aria-label="Remove file"
                >
                  ✕ Remove
                </button>
              </div>
            ) : (
              <label className="lm-file-drop" htmlFor="lm-file-input">
                <span className="lm-file-icon">📷</span>
                <span className="lm-file-text">Click to add a photo or video</span>
                <span className="lm-file-hint">JPG, PNG, GIF, MP4, MOV accepted</span>
                <input
                  id="lm-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="lm-file-input-hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="lm-progress-wrap">
              <div className="lm-progress-bar-bg">
                <div className="lm-progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className="lm-progress-label">Uploading… {uploadProgress}%</span>
            </div>
          )}

          {error && <p className="lm-error">{error}</p>}

          <button
            type="submit"
            className="lm-btn lm-btn-accent lm-submit-btn"
            disabled={uploading}
            id="lm-submit"
          >
            {uploading ? `Uploading ${uploadProgress}%…` : '💌 Share Memory'}
          </button>
        </form>

        <div className="lm-footer">
          <p>Powered by <a href="/" className="lm-footer-link">KidsBash</a></p>
        </div>
      </div>
    </ThemedPage>
  );
}
