// src/pages/guest/RSVPPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import ThemedPage from '../../theme/ThemedPage';
import { fetchEventBySlug } from '../../utils/fetchEvent';
import { getGoogleCalendarUrl } from '../../utils/calendarUtils';
import { getDevSafeOrigin } from '../../utils/url';
import { db } from '../../firebase';
import './RSVPPage.css';

function Spinner() {
  return (
    <div className="rsvp-center">
      <div className="kb-spinner" />
    </div>
  );
}

export default function RSVPPage() {
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isAttending, setIsAttending] = useState(true);
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [stayOrDropOff, setStayOrDropOff] = useState('staying');
  const [adultsCount, setAdultsCount] = useState(1);
  const [siblings, setSiblings] = useState([]);
  const [dietary, setDietary] = useState('');
  const [comments, setComments] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    console.log("Fetching event for RSVP, slug:", slug);
    fetchEventBySlug(slug)
      .then(e => {
        console.log("Fetched event for RSVP:", e);
        setEvent(e);
        setLoading(false);
        if (e && localStorage.getItem('rsvp_' + e.id)) {
          setSuccess(true);
        }
      })
      .catch(err => {
        console.error("fetchEventBySlug failed in RSVPPage:", err);
        setLoading(false);
      });
  }, [slug]);

  const addSibling = () => {
    setSiblings(prev => [...prev, { name: '', age: '', dietary: '' }]);
  };

  const removeSibling = (i) => {
    setSiblings(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateSibling = (i, field, value) => {
    setSiblings(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parentName.trim() || !childName.trim()) {
      setError('Please fill in your name and your child\'s name.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setError('Please provide either an email address or a phone number so we can reach you.');
      return;
    }
    setError('');
    setSubmitting(true);
    const askChildAge = event.askChildAge !== false;
    const askAdultCount = event.askAdultCount !== false;
    const siblingsAllowed = true;
    const stayOrDropOffAllowed = true;
    try {
      let finalAttending = isAttending;
      let existingDocId = null;
      let requiresApproval = false;

      if (event.lockDownRSVP) {
        const q = query(
          collection(db, 'rsvps'),
          where('eventId', '==', event.id),
          where('childName', '==', childName.trim())
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          existingDocId = snap.docs[0].id;
        } else {
          requiresApproval = true;
          finalAttending = 'needs_approval';
        }
      }

      const rsvpData = {
        eventId: event.id,
        parentName: parentName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        childName: childName.trim(),
        childAge: (askChildAge && isAttending && childAge !== '') ? Number(childAge) : null,
        isAttending,
        attending: finalAttending,
        intendedAttending: isAttending,
        stayOrDropOff: null,
        adultsCount: isAttending ? (askAdultCount ? (adultsCount !== null ? Number(adultsCount) : null) : 1) : 0,
        siblings: isAttending ? siblings : [],
        dietary: isAttending ? dietary.trim() : '',
        comments: comments.trim(),
        createdAt: serverTimestamp(),
      };

      if (existingDocId) {
        await updateDoc(doc(db, 'rsvps', existingDocId), rsvpData);
      } else {
        await addDoc(collection(db, 'rsvps'), rsvpData);
      }
      
      localStorage.setItem('rsvp_' + event.id, '1');
      localStorage.setItem('rsvp_status_' + event.id, requiresApproval ? 'needs_approval' : (isAttending ? 'yes' : 'no'));
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  if (!event) {
    return (
      <ThemedPage themeKey="kids-generic">
        <div className="rsvp-center">
          <div className="rsvp-notfound">
            <div className="rsvp-nf-emoji">🎈</div>
            <h1 className="rsvp-nf-title">Event not found</h1>
            <p className="rsvp-nf-sub">Double-check your link or scan the QR code again.</p>
          </div>
        </div>
      </ThemedPage>
    );
  }

  const themeKey = event.theme?.startsWith('kids-') ? event.theme : `kids-${event.theme || 'generic'}`;
  const askChildAge = event.askChildAge !== false;
  const askAdultCount = event.askAdultCount !== false;
  const siblingsAllowed = true;
  const stayOrDropOffAllowed = true;

  const formattedRsvpBy = event?.rsvpByDate ? new Date(event.rsvpByDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric'
  }) : null;

  const pageUrl = `${getDevSafeOrigin()}/${slug}`;

  const rsvpCalOpts = event?.rsvpByDate ? {
    title: `RSVP: ${event.name}`,
    date: event.rsvpByDate,
    description: `Time to RSVP for ${event.name}!`,
    url: pageUrl,
  } : null;

  if (success) {
    const savedStatus = localStorage.getItem('rsvp_status_' + event.id);
    const isNeedsApproval = savedStatus === 'needs_approval';
    const yes = savedStatus === 'yes' || savedStatus === 'needs_approval';

    return (
      <ThemedPage themeKey={themeKey} themeColor={event.themeColor} themeMode={event.themeMode}>
        <div className="rsvp-center">
          <div className="rsvp-card rsvp-success-card">
            <div className="rsvp-success-emoji">{isNeedsApproval ? '⏳' : '🎉'}</div>
            <h1 className="rsvp-success-title">{isNeedsApproval ? 'Request Submitted' : "You're all set!"}</h1>
            <p className="rsvp-success-msg">
              {isNeedsApproval
                ? "Your RSVP has been submitted and is pending the host's approval. We'll let you know once it's confirmed!"
                : (savedStatus === 'yes'
                  ? `We can't wait to see you at ${event.name}!`
                  : "Thanks for letting us know — we'll miss you!")
              }
            </p>
            {savedStatus === 'yes' && (
              <div className="rsvp-success-tip">
                <span className="rsvp-success-tip-icon">📌</span>
                <span className="rsvp-success-tip-text">
                  <strong>Save this link!</strong> Return to this page on the day of the party for directions, time, and to upload photos to the Memory Wall.
                </span>
              </div>
            )}
            <div className="rsvp-success-actions">
              {yes && (
                <Link to={`/${slug}/leave`} className="rsvp-btn rsvp-btn-accent">
                  📸 Leave a Birthday Wish
                </Link>
              )}
              <Link to={`/${slug}`} className="rsvp-btn rsvp-btn-outline">
                ← Back to Event
              </Link>
            </div>
          </div>
        </div>
      </ThemedPage>
    );
  }

  return (
    <ThemedPage themeKey={themeKey} themeColor={event.themeColor} themeMode={event.themeMode}>
      <div className="rsvp-container">

        {/* Header */}
        <div className="rsvp-header">
          <Link to={`/${slug}`} className="rsvp-back">← Back</Link>
          <h1 className="rsvp-page-title">RSVP</h1>
          <p className="rsvp-page-sub">for {event.name}</p>
          {formattedRsvpBy && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--t-accent)', fontWeight: 'bold' }}>
                Please respond by {formattedRsvpBy}
              </p>
              <button 
                type="button"
                onClick={() => {
                  window.open(getGoogleCalendarUrl(rsvpCalOpts), '_blank');
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--t-accent)',
                  color: 'var(--t-accent)',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ⏰ Set Reminder
              </button>
            </div>
          )}
        </div>

        <form className="rsvp-card" onSubmit={handleSubmit} noValidate>

          {/* Attending? */}
          <div className="rsvp-field">
            <label className="rsvp-label">Are you attending?</label>
            <div className="rsvp-toggle-group">
              <button
                type="button"
                className={`rsvp-toggle ${isAttending ? 'rsvp-toggle-active' : ''}`}
                onClick={() => setIsAttending(true)}
              >
                🎉 Yes, we'll be there!
              </button>
              <button
                type="button"
                className={`rsvp-toggle ${!isAttending ? 'rsvp-toggle-active' : ''}`}
                onClick={() => setIsAttending(false)}
              >
                😢 Sorry, can't make it
              </button>
            </div>
          </div>

          {/* Parent Name */}
          <div className="rsvp-field">
            <label className="rsvp-label" htmlFor="rsvp-parent-name">Your Name *</label>
            <input
              id="rsvp-parent-name"
              className="rsvp-input"
              type="text"
              placeholder="e.g. Sarah Johnson"
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              required
            />
          </div>

          {/* Contact Info */}
          <div className="rsvp-row">
            <div className="rsvp-field" style={{ flex: 1 }}>
              <label className="rsvp-label" htmlFor="rsvp-email">Email Address</label>
              <input
                id="rsvp-email"
                className="rsvp-input"
                type="email"
                placeholder="e.g. sarah@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="rsvp-field" style={{ flex: 1 }}>
              <label className="rsvp-label" htmlFor="rsvp-phone">Phone Number</label>
              <input
                id="rsvp-phone"
                className="rsvp-input"
                type="tel"
                placeholder="e.g. 0400 000 000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--t-text-light)', marginTop: '-8px', marginBottom: '16px' }}>
            * Please provide at least one contact method.
          </p>

          {/* Child Name & Age */}
          <div className="rsvp-row">
            <div className="rsvp-field" style={{ flex: askChildAge ? 3 : 1 }}>
              <label className="rsvp-label" htmlFor="rsvp-child-name">Child's Name *</label>
              <input
                id="rsvp-child-name"
                className="rsvp-input"
                type="text"
                placeholder="e.g. Emily"
                value={childName}
                onChange={e => setChildName(e.target.value)}
                required
              />
            </div>
            {askChildAge && (
              <div className="rsvp-field" style={{ flex: 1 }}>
                <label className="rsvp-label" htmlFor="rsvp-child-age">Age</label>
                <input
                  id="rsvp-child-age"
                  className="rsvp-input"
                  type="number"
                  min="0"
                  max="18"
                  placeholder="e.g. 5"
                  value={childAge}
                  onChange={e => setChildAge(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Siblings / Additional Children (Moved up) */}
          {siblingsAllowed && isAttending && (
            <div className="rsvp-field rsvp-siblings-section" style={{ marginTop: '-4px', marginBottom: '16px' }}>
              {siblings.map((sib, i) => (
                <div key={i} className="rsvp-sibling-card">
                  <div className="rsvp-sibling-header">
                    <span className="rsvp-sibling-num">Child {i + 2}</span>
                    <button
                      type="button"
                      className="rsvp-remove-btn"
                      onClick={() => removeSibling(i)}
                      aria-label="Remove child"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    className="rsvp-input rsvp-input-sm"
                    type="text"
                    placeholder="Name"
                    value={sib.name}
                    onChange={e => updateSibling(i, 'name', e.target.value)}
                  />
                  <input
                    className="rsvp-input rsvp-input-sm"
                    type="number"
                    min="0"
                    max="18"
                    placeholder="Age"
                    value={sib.age}
                    onChange={e => updateSibling(i, 'age', e.target.value)}
                  />
                  <input
                    className="rsvp-input rsvp-input-sm"
                    type="text"
                    placeholder="Dietary needs / Allergies"
                    value={sib.dietary}
                    onChange={e => updateSibling(i, 'dietary', e.target.value)}
                  />
                </div>
              ))}
              <button type="button" className="rsvp-add-sibling-btn" onClick={addSibling} style={{ marginTop: siblings.length > 0 ? '8px' : '0' }}>
                + Add another child
              </button>
            </div>
          )}



          {/* Adults Count Stepper */}
          {askAdultCount && isAttending && (
            <div className="rsvp-field">
              <label className="rsvp-label">Number of Adults Attending</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', opacity: adultsCount === null ? 0.6 : 1 }}>
                <button
                  type="button"
                  disabled={adultsCount === null}
                  onClick={() => setAdultsCount(prev => Math.max(0, prev - 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--t-input-border)',
                    background: 'var(--t-input-bg)',
                    color: 'var(--t-text)',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: adultsCount === null ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                    outline: 'none'
                  }}
                >
                  −
                </button>
                <span style={{ fontSize: '1.15rem', fontWeight: 'bold', minWidth: '36px', textAlign: 'center', color: 'var(--t-text)' }}>
                  {adultsCount === null ? '?' : adultsCount}
                </span>
                <button
                  type="button"
                  disabled={adultsCount === null}
                  onClick={() => setAdultsCount(prev => Math.min(10, prev + 1))}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--t-input-border)',
                    background: 'var(--t-input-bg)',
                    color: 'var(--t-text)',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: adultsCount === null ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                    outline: 'none'
                  }}
                >
                  +
                </button>
                <span style={{ fontSize: '0.88rem', color: 'var(--t-text-light)', marginLeft: '8px' }}>
                  {adultsCount === null ? 'Unsure' : (adultsCount === 1 ? 'Adult' : 'Adults') + ' staying'}
                </span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--t-text-light)' }}>
                <input
                  type="checkbox"
                  checked={adultsCount === null}
                  onChange={e => setAdultsCount(e.target.checked ? null : 1)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px', borderRadius: '4px' }}
                />
                <span>Unsure how many adults yet</span>
              </label>
            </div>
          )}

          {/* Dietary */}
          {isAttending && (
            <div className="rsvp-field">
              <label className="rsvp-label" htmlFor="rsvp-dietary">Allergies or dietary requirements</label>
              <textarea
                id="rsvp-dietary"
                className="rsvp-textarea"
                placeholder="Any food allergies or dietary needs we should know about?"
                value={dietary}
                onChange={e => setDietary(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Comments */}
          <div className="rsvp-field">
            <label className="rsvp-label" htmlFor="rsvp-comments">Comments / Notes</label>
            <textarea
              id="rsvp-comments"
              className="rsvp-textarea"
              placeholder={isAttending ? "Any other notes or comments for the host?" : "Leave a message for the host..."}
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="rsvp-error">{error}</p>}

          <button
            type="submit"
            className="rsvp-btn rsvp-btn-accent rsvp-submit-btn"
            disabled={submitting}
            id="rsvp-submit"
          >
            {submitting ? 'Sending…' : '✉️ Submit RSVP'}
          </button>
        </form>

        <div className="rsvp-footer">
          <p>Powered by <a href="/" className="rsvp-footer-link">KidsBash</a></p>
        </div>
      </div>
    </ThemedPage>
  );
}
