// src/pages/guest/RSVPPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import ThemedPage from '../../theme/ThemedPage';
import ThemeIllustration from '../../theme/ThemeIllustration';
import { fetchEventBySlug } from '../../utils/fetchEvent';
import { getGoogleCalendarUrl } from '../../utils/calendarUtils';
import { getDevSafeOrigin } from '../../utils/url';
import { db } from '../../firebase';
import confetti from 'canvas-confetti';
import './RSVPPage.css';

function SkeletonRSVP() {
  return (
    <div className="rsvp-center">
      <div className="rsvp-container" style={{ width: '100%', maxWidth: '540px' }}>
        <div style={{ height: 40, width: '60%', background: 'rgba(0,0,0,0.05)', margin: '0 auto 20px', borderRadius: 8 }} className="kb-skeleton" />
        <div className="rsvp-card" style={{ height: 400, opacity: 0.5 }}>
          <div style={{ height: 20, width: '40%', background: 'rgba(0,0,0,0.05)', marginBottom: 20, borderRadius: 4 }} className="kb-skeleton" />
          <div style={{ height: 44, width: '100%', background: 'rgba(0,0,0,0.05)', marginBottom: 20, borderRadius: 12 }} className="kb-skeleton" />
          <div style={{ height: 20, width: '30%', background: 'rgba(0,0,0,0.05)', marginBottom: 20, borderRadius: 4 }} className="kb-skeleton" />
          <div style={{ height: 44, width: '100%', background: 'rgba(0,0,0,0.05)', marginBottom: 20, borderRadius: 12 }} className="kb-skeleton" />
        </div>
      </div>
    </div>
  );
}

export default function RSVPPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

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

  const [showLookup, setShowLookup] = useState(false);
  const [lookupChildName, setLookupChildName] = useState('');
  const [lookupContact, setLookupContact] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    console.log("Fetching event for RSVP, slug:", slug);
    fetchEventBySlug(slug)
      .then(async (e) => {
        console.log("Fetched event for RSVP:", e);
        setEvent(e);
        
        if (e) {
          // Set default stay/drop-off based on mode
          if (e.stayOrDropOffMode === 'stay') {
            setStayOrDropOff('staying');
            setAdultsCount(1);
          } else if (e.stayOrDropOffMode === 'dropoff') {
            setStayOrDropOff('dropoff');
            setAdultsCount(0);
          }

          const urlRsvpId = searchParams.get('rsvpId');
          const storedRsvpId = localStorage.getItem('rsvp_' + e.id);
          const rsvpId = urlRsvpId || storedRsvpId;

          if (rsvpId) {
            // If we have an ID from URL, persist it
            if (urlRsvpId) {
              localStorage.setItem('rsvp_' + e.id, urlRsvpId);
            }

            // Try to fetch existing RSVP data
            try {
              const rsvpSnap = await getDoc(doc(db, 'rsvps', rsvpId));
              if (rsvpSnap.exists()) {
                const data = rsvpSnap.data();
                setIsAttending(data.isAttending ?? true);
                setParentName(data.parentName ?? '');
                setEmail(data.email ?? '');
                setPhone(data.phone ?? '');
                setChildName(data.childName ?? '');
                setChildAge(data.childAge ?? '');
                setAdultsCount(data.adultsCount ?? 1);
                setSiblings(data.siblings ?? []);
                setDietary(data.dietary ?? '');
                setComments(data.comments ?? '');

                // Only show success screen if NOT in edit mode
                if (!isEditMode) {
                  setSuccess(true);
                }
              }
            } catch (err) {
              console.error("Failed to fetch existing RSVP:", err);
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("fetchEventBySlug failed in RSVPPage:", err);
        setLoading(false);
      });
  }, [slug, isEditMode, searchParams]);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupChildName.trim() || !lookupContact.trim()) {
      setLookupError("Please enter both Child's Name and Parent's Email or Phone.");
      return;
    }
    setLookupError('');
    setLookupLoading(true);
    try {
      const q = query(
        collection(db, 'rsvps'),
        where('eventId', '==', event.id)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        setLookupError("No RSVPs found for this event yet.");
        setLookupLoading(false);
        return;
      }

      const inputChildClean = lookupChildName.trim().toLowerCase();
      const inputContactClean = lookupContact.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      let foundRsvp = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const storedChildClean = (data.childName || '').trim().toLowerCase();
        const storedEmailClean = (data.email || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const storedPhoneClean = (data.phone || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (storedChildClean === inputChildClean && 
            (storedEmailClean === inputContactClean || storedPhoneClean === inputContactClean)) {
          foundRsvp = { id: doc.id, ...data };
        }
      });

      if (foundRsvp) {
        localStorage.setItem('rsvp_' + event.id, foundRsvp.id);
        localStorage.setItem('rsvp_status_' + event.id, foundRsvp.isAttending ? 'yes' : 'no');
        
        setIsAttending(foundRsvp.isAttending ?? true);
        setParentName(foundRsvp.parentName ?? '');
        setEmail(foundRsvp.email ?? '');
        setPhone(foundRsvp.phone ?? '');
        setChildName(foundRsvp.childName ?? '');
        setChildAge(foundRsvp.childAge ?? '');
        setAdultsCount(foundRsvp.adultsCount ?? 1);
        setSiblings(foundRsvp.siblings ?? []);
        setDietary(foundRsvp.dietary ?? '');
        setComments(foundRsvp.comments ?? '');

        setSuccess(true);
        setShowLookup(false);
      } else {
        setLookupError("No matching RSVP found. Please check spelling or contact the host.");
      }
    } catch (err) {
      console.error("Error looking up RSVP:", err);
      setLookupError("An error occurred. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

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
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setError('Please provide either an email address or a phone number.');
      return;
    }
    setError('');
    setSubmitting(true);
    const askChildAge = event.askChildAge !== false;
    const askAdultCount = event.askAdultCount !== false;
    const siblingsAllowed = true;
    const stayOrDropOffAllowed = event.showParentAttendance !== false && (event.stayOrDropOffMode === 'ask' || !event.stayOrDropOffMode);
    try {
      let finalAttending = isAttending;
      let existingDocId = localStorage.getItem('rsvp_' + event.id);
      let requiresApproval = false;

      if (event.lockDownRSVP && !existingDocId) {
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
        stayOrDropOff: isAttending ? stayOrDropOff : null,
        adultsCount: isAttending ? (askAdultCount ? (adultsCount !== null ? Number(adultsCount) : null) : (stayOrDropOff === 'staying' ? 1 : 0)) : 0,
        siblings: isAttending ? siblings : [],
        dietary: isAttending ? dietary.trim() : '',
        comments: comments.trim(),
        createdAt: serverTimestamp(),
      };

      let rsvpId = existingDocId;
      if (existingDocId) {
        await updateDoc(doc(db, 'rsvps', existingDocId), rsvpData);
      } else {
        const docRef = await addDoc(collection(db, 'rsvps'), rsvpData);
        rsvpId = docRef.id;
      }
      
      localStorage.setItem('rsvp_' + event.id, rsvpId);
      localStorage.setItem('rsvp_status_' + event.id, requiresApproval ? 'needs_approval' : (isAttending ? 'yes' : 'no'));
      
      if (isAttending && !requiresApproval) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C']
        });
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SkeletonRSVP />;

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
  const stayOrDropOffAllowed = event.showParentAttendance !== false && (event.stayOrDropOffMode === 'ask' || !event.stayOrDropOffMode);

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

    return (
      <ThemedPage themeKey={themeKey} themeColor={event.themeColor} themeMode={event.themeMode}>
        <div className="rsvp-center">
          <div className="rsvp-card rsvp-success-card">
            <div style={{ width: '100%', maxWidth: '120px', margin: '0 auto 16px' }}>
              <ThemeIllustration theme={themeKey} themeColor={event.themeColor} />
            </div>
            <div className="rsvp-success-emoji" style={{ marginTop: '-40px', position: 'relative', zIndex: 1 }}>{isNeedsApproval ? '⏳' : '🎉'}</div>
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
                  <strong>Save this link!</strong> Return to this page on the day of the party for directions, time, and to leave a message for the birthday star.
                </span>
              </div>
            )}
            <div className="rsvp-success-actions">
              <Link to={`/${slug}`} className="rsvp-btn rsvp-btn-outline">
                ← View Event Details
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
          <div className="rsvp-illus-wrap" style={{ width: '100%', maxWidth: '80px', margin: '0 auto 8px' }}>
            <ThemeIllustration theme={themeKey} themeColor={event.themeColor} />
          </div>
          <h1 className="rsvp-page-title">{isEditMode ? 'Update RSVP' : 'RSVP'}</h1>
          <p className="rsvp-page-sub">for {event.name}</p>
          {event.hostContact && (
            <p className="rsvp-page-host-contact" style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--t-text-light)' }}>
              Questions? Contact {event.hostContact}
            </p>
          )}
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
        {/* Already RSVP'd? Lookup section */}
        {!isEditMode && (
          <div className="rsvp-lookup-section" style={{ marginBottom: '24px', textAlign: 'center' }}>
            <button 
              type="button" 
              className="rsvp-lookup-toggle-btn"
              onClick={() => {
                setShowLookup(v => !v);
                setLookupError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--t-accent)',
                fontFamily: 'var(--t-font-body)',
                fontSize: '0.92rem',
                fontWeight: '700',
                cursor: 'pointer',
                textDecoration: 'underline',
                transition: 'opacity 0.2s',
              }}
            >
              {showLookup ? "✕ Close search" : "Already RSVP'd? Find your RSVP here →"}
            </button>

            {showLookup && (
              <form onSubmit={handleLookup} className="rsvp-card rsvp-lookup-form" style={{ marginTop: '16px', textAlign: 'left' }}>
                <h3 style={{ fontFamily: 'var(--t-font-heading)', fontSize: '1.25rem', color: 'var(--t-accent)', margin: '0 0 4px 0' }}>Find Your RSVP</h3>
                <p style={{ fontFamily: 'var(--t-font-body)', fontSize: '0.82rem', color: 'var(--t-text-light)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                  Enter the details you used to RSVP to restore access to the party details portal.
                </p>
                
                <div className="rsvp-field">
                  <label className="rsvp-label">Child's Name *</label>
                  <input 
                    type="text" 
                    className="rsvp-input" 
                    placeholder="e.g. Emily" 
                    value={lookupChildName} 
                    onChange={e => setLookupChildName(e.target.value)} 
                    required
                  />
                </div>

                <div className="rsvp-field">
                  <label className="rsvp-label">Parent's Email or Phone *</label>
                  <input 
                    type="text" 
                    className="rsvp-input" 
                    placeholder="e.g. sarah@example.com or 0400000000" 
                    value={lookupContact} 
                    onChange={e => setLookupContact(e.target.value)} 
                    required
                  />
                </div>

                {lookupError && <p className="rsvp-error">{lookupError}</p>}

                <button 
                  type="submit" 
                  className="rsvp-btn rsvp-btn-accent" 
                  disabled={lookupLoading}
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {lookupLoading ? "Searching..." : "🔍 Find RSVP"}
                </button>
              </form>
            )}
          </div>
        )}

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

          {/* Child Name & Age */}
          <div className="rsvp-row">
            <div className="rsvp-field" style={{ flex: (askChildAge && isAttending) ? 3 : 1 }}>
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
            {askChildAge && isAttending && (
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



          {/* Stay or Drop-off */}
          {stayOrDropOffAllowed && isAttending && (
            <div className="rsvp-field">
              <label className="rsvp-label">Are you staying or dropping off?</label>
              <div className="rsvp-toggle-group">
                <button
                  type="button"
                  className={`rsvp-toggle ${stayOrDropOff === 'staying' ? 'rsvp-toggle-active' : ''}`}
                  onClick={() => {
                    setStayOrDropOff('staying');
                    if (adultsCount === 0) setAdultsCount(1);
                  }}
                >
                  🏠 Staying
                </button>
                <button
                  type="button"
                  className={`rsvp-toggle ${stayOrDropOff === 'dropoff' ? 'rsvp-toggle-active' : ''}`}
                  onClick={() => {
                    setStayOrDropOff('dropoff');
                    setAdultsCount(0);
                  }}
                >
                  🚗 Drop-off
                </button>
              </div>
            </div>
          )}

          {/* Adults Count Stepper */}
          {askAdultCount && isAttending && stayOrDropOff === 'staying' && (
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
            {submitting ? 'Sending…' : (isEditMode ? '✅ Update RSVP' : '✉️ Submit RSVP')}
          </button>
        </form>

        <div className="rsvp-footer">
          <p>Powered by <a href="/" className="rsvp-footer-link">KidsBash</a></p>
        </div>
      </div>
    </ThemedPage>
  );
}
