// src/pages/guest/RSVPPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import ThemedPage from '../../theme/ThemedPage';
import ThemeIllustration from '../../theme/ThemeIllustration';
import { fetchEventBySlug } from '../../utils/fetchEvent';
import { getGoogleCalendarUrl } from '../../utils/calendarUtils';
import { getDevSafeOrigin } from '../../utils/url';
import { db, trackEvent } from '../../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import './RSVPPage.css';
import '../guest/EventLandingPage.css'; // ensure we have styles for invitation card
import { downloadICS, generateICS } from '../../utils/calendarUtils';
import SEO from '../../components/SEO';

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

export default function RSVPPage({ event: propEvent, onRsvpSuccess, embedded = false, forceEditMode = false }) {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = forceEditMode || searchParams.get('edit') === 'true';

  const [event, setEvent] = useState(propEvent || null);
  const [loading, setLoading] = useState(!propEvent);

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

  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [canSubmitFinal, setCanSubmitFinal] = useState(false);

  useEffect(() => {
    if (currentStep === 4) {
      const timer = setTimeout(() => setCanSubmitFinal(true), 500);
      return () => clearTimeout(timer);
    } else {
      setCanSubmitFinal(false);
    }
  }, [currentStep]);

  const validateStep = (step) => {
    setError('');
    if (step === 2) {
      if (!childName.trim()) {
        setError("Please enter your child's name.");
        return false;
      }
    }
    if (step === 3) {
      if (!parentName.trim()) {
        setError("Please enter your name.");
        return false;
      }
      if (!email.trim() && !phone.trim()) {
        setError("Please provide either an email address or a phone number.");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email.trim() && !emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const [showLookup, setShowLookup] = useState(false);
  const [lookupChildName, setLookupChildName] = useState('');
  const [lookupContact, setLookupContact] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const [matchFound, setMatchFound] = useState(false);
  const [showContactOrganiser, setShowContactOrganiser] = useState(false);
  const [contactMessage, setContactMessage] = useState("Hi, I couldn't find my invitation on the list. Could you please check?");
  const [sendingContact, setSendingContact] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => {
    if (propEvent) {
      setEvent(propEvent);
      
      // Set default stay/drop-off based on mode
      if (propEvent.stayOrDropOffMode === 'stay') {
        setStayOrDropOff('staying');
        setAdultsCount(1);
      } else if (propEvent.stayOrDropOffMode === 'dropoff') {
        setStayOrDropOff('dropoff');
        setAdultsCount(0);
      }

      const urlRsvpId = searchParams.get('rsvpId');
      const storedRsvpId = localStorage.getItem('rsvp_' + propEvent.id);
      const rsvpId = urlRsvpId || storedRsvpId;

      if (rsvpId) {
        if (urlRsvpId) {
          localStorage.setItem('rsvp_' + propEvent.id, urlRsvpId);
        }
        getDoc(doc(db, 'rsvps', rsvpId)).then(rsvpSnap => {
          if (rsvpSnap.exists()) {
            const data = rsvpSnap.data();
            setIsAttending(data.isAttending ?? true);
            setParentName(data.parentName ?? '');
            setEmail(data.email ?? '');
            setPhone(data.phone ?? '');
            if (data.email) setShowEmailInput(true);
            if (data.phone) setShowPhoneInput(true);
            setChildName(data.childName ?? '');
            setChildAge(data.childAge ?? '');
            setAdultsCount(data.adultsCount ?? 1);
            setSiblings(data.siblings ?? []);
            setDietary(data.dietary ?? '');
            setComments(data.comments ?? '');
            if (!isEditMode) {
              setSuccess(true);
            }
            setMatchFound(true);
          } else {
            localStorage.removeItem('rsvp_' + propEvent.id);
            if (!propEvent.requireGuestMatch) {
              setMatchFound(true);
            }
          }
        }).catch(err => {
          console.error(err);
          if (!propEvent.requireGuestMatch) {
            setMatchFound(true);
          }
        });
      } else {
        if (!propEvent.requireGuestMatch) {
          setMatchFound(true);
        }
      }
      setLoading(false);
    } else {
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
                  if (data.email) setShowEmailInput(true);
                  if (data.phone) setShowPhoneInput(true);
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
                  setMatchFound(true);
                } else {
                  localStorage.removeItem('rsvp_' + e.id);
                  if (!e.requireGuestMatch) {
                    setMatchFound(true);
                  }
                }
              } catch (err) {
                console.error("Failed to fetch existing RSVP:", err);
                if (!e.requireGuestMatch) {
                  setMatchFound(true);
                }
              }
            } else {
              // if we are NOT in edit mode and NO rsvpId is stored, we only set matchFound=true if requireGuestMatch is false
              if (!e.requireGuestMatch) {
                setMatchFound(true);
              }
            }
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("fetchEventBySlug failed in RSVPPage:", err);
          setLoading(false);
        });
    }
  }, [slug, isEditMode, searchParams, propEvent]);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupChildName.trim() || !lookupContact.trim()) {
      setLookupError("Please enter both Child's Name and Parent's Email or Phone.");
      return;
    }
    setLookupError('');
    setLookupLoading(true);
    try {
      const functions = getFunctions();
      const lookup = httpsCallable(functions, 'lookupRsvp');
      const res = await lookup({
        eventId: event.id,
        childName: lookupChildName,
        contact: lookupContact,
      });
      const foundRsvp = res.data?.found ? res.data.rsvp : null;

      if (foundRsvp) {
        localStorage.setItem('rsvp_' + event.id, foundRsvp.id);
        localStorage.setItem('rsvp_status_' + event.id, foundRsvp.isAttending ? 'yes' : 'no');
        
        setIsAttending(foundRsvp.isAttending ?? true);
        setParentName(foundRsvp.parentName ?? '');
        setEmail(foundRsvp.email ?? '');
        setPhone(foundRsvp.phone ?? '');
        if (foundRsvp.email) setShowEmailInput(true);
        if (foundRsvp.phone) setShowPhoneInput(true);
        setChildName(foundRsvp.childName ?? '');
        setChildAge(foundRsvp.childAge ?? '');
        setAdultsCount(foundRsvp.adultsCount ?? 1);
        setSiblings(foundRsvp.siblings ?? []);
        setDietary(foundRsvp.dietary ?? '');
        setComments(foundRsvp.comments ?? '');

        setMatchFound(true);
        setSuccess(true);
        setShowLookup(false);
        trackEvent('rsvp_lookup', { result: 'found' });
      } else {
        setLookupError("No matching RSVP found. Please check spelling or contact the host.");
        setShowContactOrganiser(true);
        trackEvent('rsvp_lookup', { result: 'not_found' });
      }
    } catch (err) {
      console.error("Error looking up RSVP:", err);
      setLookupError("An error occurred. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleContactOrganiser = async () => {
    setSendingContact(true);
    try {
      const functions = getFunctions();
      const contactOrganiserCall = httpsCallable(functions, 'contactOrganiser');
      await contactOrganiserCall({
        eventId: event.id,
        guestName: lookupChildName,
        guestContact: lookupContact,
        message: contactMessage
      });
      toast.success("Message sent to the organiser!");
      setShowContactOrganiser(false);
    } catch (e) {
      console.error("contactOrganiser error:", e);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSendingContact(false);
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

    // If the user presses Enter on a step before the final step, proceed to the next step
    if (currentStep < 4) {
      handleNextStep();
      return;
    }

    // Prevent queued double-submits from Enter keypresses
    if (currentStep === 4 && !canSubmitFinal) {
      return;
    }

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
        // Match an existing RSVP server-side (requires child name + matching contact),
        // so the guest list can't be enumerated from the client.
        const contact = email.trim() || phone.trim();
        let matchedId = null;
        if (contact) {
          try {
            const functions = getFunctions();
            const lookup = httpsCallable(functions, 'lookupRsvp');
            const res = await lookup({ eventId: event.id, childName: childName.trim(), contact });
            if (res.data?.found) matchedId = res.data.rsvp.id;
          } catch (err) {
            console.error('lockdown lookup failed', err);
          }
        }
        if (matchedId) {
          existingDocId = matchedId;
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
        siblings: isAttending ? siblings.map(s => ({ ...s, dietary: askDietary ? (s.dietary ?? '') : '' })) : [],
        dietary: (isAttending && askDietary) ? dietary.trim() : '',
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

      trackEvent('rsvp_submitted', {
        attending: requiresApproval ? 'needs_approval' : (isAttending ? 'yes' : 'no'),
        party_size: isAttending ? (1 + (siblings?.length || 0)) : 0,
        is_edit: isEditMode,
      });

      if (isAttending && !requiresApproval) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C']
        });
      }

      setSuccess(true);
      if (onRsvpSuccess) {
        onRsvpSuccess(rsvpId, requiresApproval ? 'needs_approval' : (isAttending ? 'yes' : 'no'));
      }
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
  const askDietary = event.askDietary !== false;
  const siblingsAllowed = true;
  const stayOrDropOffAllowed = event.showParentAttendance !== false && (event.stayOrDropOffMode === 'ask' || !event.stayOrDropOffMode);

  const formattedRsvpBy = event?.rsvpByDate ? new Date(event.rsvpByDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric'
  }) : null;

  const pageUrl = `${getDevSafeOrigin()}/${slug}/portal`;

  const rsvpCalOpts = event?.rsvpByDate ? {
    title: `RSVP: ${event.name}`,
    date: event.rsvpByDate,
    description: `Time to RSVP for ${event.name}!`,
    url: pageUrl,
  } : null;

  const formattedDate = event?.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  }) : null;

  const formattedTime = event?.time ? (() => {
    const [h, m] = event.time.split(':');
    const hr = parseInt(h, 10);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  })() : null;

  const calOpts = event?.date ? {
    title: event.name,
    date: event.date,
    time: event.time,
    endTime: event.endTime,
    location: event.location,
    description: event.description,
    url: pageUrl,
  } : null;

  if (success) {
    const savedStatus = localStorage.getItem('rsvp_status_' + event.id);
    const isNeedsApproval = savedStatus === 'needs_approval';

    const childNameStr = event?.childName ? event.childName.trim() : '';
    let occasionText = event?.name || 'the event';
    if (childNameStr) {
      if (childNameStr.endsWith("'s") || childNameStr.endsWith("'")) {
        occasionText = `${childNameStr} ${event?.name}`;
      } else if (childNameStr.toLowerCase().endsWith('s')) {
        occasionText = `${childNameStr}' ${event?.name}`;
      } else {
        occasionText = `${childNameStr}'s ${event?.name}`;
      }
    }

    const successCard = (
      <div className="rsvp-center" style={embedded ? { minHeight: 'auto', padding: '16px 0' } : {}}>
        <div className="rsvp-card rsvp-success-card">
          <div style={{ width: '100%', maxWidth: '120px', margin: '0 auto 16px' }}>
            <ThemeIllustration theme={themeKey} themeColor={event.themeColor} />
          </div>
          {isNeedsApproval && (
            <div className="rsvp-success-emoji" style={{ marginTop: '-40px', position: 'relative', zIndex: 1 }}>⏳</div>
          )}
          <h1 className="rsvp-success-title">{isNeedsApproval ? 'Request Submitted' : `You're all set for ${occasionText}!`}</h1>
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
                <strong>Head to the Event Portal!</strong> Bookmark the <Link to={`/${slug}/portal`} style={{color: 'inherit', textDecoration: 'underline'}}>portal link</Link> for directions, time, and to leave a message for the birthday star.
              </span>
            </div>
          )}
          <div className="rsvp-success-actions">
            <Link to={`/${slug}/portal`} className="rsvp-btn rsvp-btn-outline" onClick={() => {
              if (onRsvpSuccess) onRsvpSuccess();
            }}>
              ← View Event Details
            </Link>
          </div>
        </div>
      </div>
    );

    if (embedded) return successCard;

    return (
      <ThemedPage themeKey={themeKey} themeColor={event.themeColor}>
        <SEO 
          title={`RSVP - ${event.childName ? event.childName + "'s " : ""}${event.name}`} 
          description={`RSVP to ${event.childName ? event.childName + "'s " : ""} birthday party!`}
          url={pageUrl}
          noindex={true}
        />
        {successCard}
      </ThemedPage>
    );
  }

  const renderCardHeader = () => (
    <div className="rsvp-card-header">
      <div className="rsvp-card-header-top">
        {isEditMode ? (
          <Link to={`/${slug}/portal`} className="rsvp-card-back">
            <span className="rsvp-back-arrow">←</span> Back to Portal
          </Link>
        ) : (
          <div /> // Empty div to keep flexbox alignment if needed
        )}
        {(event.hostName || event.hostContact) && (
          <span className="rsvp-card-host">
            Host: {[event.hostName, event.hostContact].filter(Boolean).join(' - ')}
          </span>
        )}
      </div>
      
      <div className="rsvp-card-hero">
        <div className="rsvp-card-illus-wrap">
          <ThemeIllustration theme={themeKey} themeColor={event.themeColor} />
        </div>
        <div className="rsvp-card-title-group">
          <h1 className="rsvp-card-title">{isEditMode ? 'Update RSVP' : 'RSVP'}</h1>
          <p className="rsvp-card-subtitle">for {event.name}</p>
        </div>
      </div>

      {formattedRsvpBy && (
        <div className="rsvp-card-reminder-bar">
          <span className="rsvp-card-deadline">
            Please respond by <strong>{formattedRsvpBy}</strong>
          </span>
          <button 
            type="button"
            className="rsvp-card-reminder-btn"
            onClick={() => {
              window.open(getGoogleCalendarUrl(rsvpCalOpts), '_blank');
            }}
          >
            ⏰ Set Reminder
          </button>
        </div>
      )}
      
      <div className="rsvp-card-header-divider" />
    </div>
  );

  const containerContent = (
    <div className="rsvp-container" style={embedded ? { padding: '20px 0', maxWidth: '100%' } : {}}>

        {/* Guest Matching / Lookup section */}
        {!matchFound && event.requireGuestMatch ? (
          <div className="rsvp-card rsvp-lookup-form" style={{ marginTop: '16px', textAlign: 'left' }}>
            {renderCardHeader()}
            <h3 style={{ fontFamily: 'var(--t-font-heading)', fontSize: '1.25rem', color: 'var(--t-accent)', margin: '0 0 4px 0' }}>Find Your Invitation</h3>
            <p style={{ fontFamily: 'var(--t-font-body)', fontSize: '0.82rem', color: 'var(--t-text-light)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              This event requires you to match your name with the guest list to RSVP.
            </p>
            
            <form onSubmit={handleLookup}>
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
                {lookupLoading ? "Searching..." : "🔍 Check Guest List"}
              </button>
            </form>

            {showContactOrganiser && (
              <div style={{ marginTop: '24px', padding: '16px', borderTop: '1px solid var(--t-border)' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--t-text)' }}>Still can't find your invite?</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--t-text-light)', marginBottom: '12px' }}>Send a message directly to the host.</p>
                <textarea 
                  className="rsvp-textarea" 
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  style={{ marginBottom: '12px' }}
                  rows={3}
                />
                <button 
                  type="button"
                  className="rsvp-btn"
                  onClick={handleContactOrganiser}
                  disabled={sendingContact}
                  style={{ width: '100%', background: 'var(--t-surface)', border: '2px solid var(--t-accent)', color: 'var(--t-accent)' }}
                >
                  {sendingContact ? "Sending..." : "✉️ Contact Organiser"}
                </button>
              </div>
            )}
          </div>
        ) : (
          !isEditMode && !event.requireGuestMatch && (
            <div className="rsvp-lookup-section" style={{ marginBottom: '24px', textAlign: 'center' }}>
              <Link 
                to={`/${slug}/portal`}
                className="rsvp-lookup-toggle-btn"
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
                  display: 'inline-block'
                }}
              >
                Already RSVP'd? Find your RSVP here →
              </Link>
            </div>
          )
        )}

        {matchFound && (
          <form className="rsvp-card" onSubmit={handleSubmit} noValidate>
            {renderCardHeader()}

            {/* Premium Wizard Progress Bar */}
            <div className="rsvp-wizard-progress" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', position: 'relative' }}>
              {[
                { num: 1, label: 'Attendance' },
                { num: 2, label: 'Child' },
                { num: 3, label: 'Parent' },
                { num: 4, label: isAttending ? 'Details' : 'Message' }
              ].map((s, idx) => {
                const isActive = currentStep === s.num;
                const isCompleted = currentStep > s.num;
                return (
                  <React.Fragment key={s.num}>
                    <div 
                      className={`rsvp-step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      onClick={() => {
                        if (s.num < currentStep) setCurrentStep(s.num);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 2,
                        cursor: s.num < currentStep ? 'pointer' : 'default',
                        flex: 1
                      }}
                    >
                      <div 
                        className="rsvp-step-dot"
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isCompleted ? 'var(--t-accent)' : (isActive ? 'var(--t-btn-bg, var(--t-accent))' : 'var(--t-soft-bg)'),
                          color: isCompleted || isActive ? 'var(--t-btn-text, #fff)' : 'var(--t-text-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s ease',
                          border: isActive ? '2px solid var(--t-accent)' : '2px solid transparent'
                        }}
                      >
                        {isCompleted ? '✓' : s.num}
                      </div>
                      <span 
                        className="rsvp-step-text"
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: isActive ? '800' : '600',
                          color: isActive ? 'var(--t-accent)' : 'var(--t-text-light)',
                          marginTop: '4px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div 
                        className="rsvp-step-line"
                        style={{
                          height: '2px',
                          flex: 1,
                          background: currentStep > s.num ? 'var(--t-accent)' : 'var(--t-soft-bg)',
                          marginTop: '-16px',
                          zIndex: 1,
                          marginRight: '-12px',
                          marginLeft: '-12px',
                          transition: 'background 0.3s ease'
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* STEP 1: Attendance */}
            {currentStep === 1 && (
              <div className="rsvp-step-content animate-fade-in">
                <div className="rsvp-field">
                  <label className="rsvp-label" style={{ textAlign: 'center', fontSize: '0.9rem', marginBottom: '16px' }}>Are you attending?</label>
                  <div className="rsvp-toggle-group" style={{ flexDirection: 'column', gap: '12px' }}>
                    <button
                      type="button"
                      className={`rsvp-toggle ${isAttending ? 'rsvp-toggle-active' : ''}`}
                      onClick={() => {
                        setIsAttending(true);
                        setCurrentStep(2);
                      }}
                      style={{ padding: '20px', fontSize: '1.05rem' }}
                    >
                      🎉 Yes, we'll be there!
                    </button>
                    <button
                      type="button"
                      className={`rsvp-toggle ${!isAttending ? 'rsvp-toggle-active' : ''}`}
                      onClick={() => {
                        setIsAttending(false);
                        setCurrentStep(2);
                      }}
                      style={{ padding: '20px', fontSize: '1.05rem' }}
                    >
                      😢 Sorry, can't make it
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Child Information */}
            {currentStep === 2 && (
              <div className="rsvp-step-content animate-fade-in">
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
                      autoFocus
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
                        {askDietary && (
                          <input
                            className="rsvp-input rsvp-input-sm"
                            type="text"
                            placeholder="Dietary needs / Allergies"
                            value={sib.dietary}
                            onChange={e => updateSibling(i, 'dietary', e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', marginTop: siblings.length > 0 ? '8px' : '0' }}>
                      <button type="button" className="rsvp-add-sibling-btn" onClick={addSibling} style={{ flex: 1 }}>
                        + Add another child
                      </button>
                      {siblings.length === 0 && (
                        <button type="button" className="rsvp-add-sibling-btn" onClick={handleNextStep} style={{ flex: 1, background: 'var(--t-soft-bg)', border: '1.5px solid var(--t-border)', color: 'var(--t-text-light)' }}>
                          No children to add →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Parent Information */}
            {currentStep === 3 && (
              <div className="rsvp-step-content animate-fade-in">
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
                    autoFocus
                  />
                </div>

                {!showEmailInput && !showPhoneInput ? (
                  <div className="rsvp-field">
                    <label className="rsvp-label">Contact Method *</label>
                    <div className="rsvp-toggle-group">
                      <button 
                        type="button" 
                        className="rsvp-toggle" 
                        onClick={() => setShowEmailInput(true)}
                      >
                        ✉️ Email
                      </button>
                      <button 
                        type="button" 
                        className="rsvp-toggle" 
                        onClick={() => setShowPhoneInput(true)}
                      >
                        📱 Phone
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--t-text-light)', marginTop: '8px', marginBottom: '16px' }}>
                      Please select how you'd like us to contact you.
                    </p>
                  </div>
                ) : (
                  <div className="rsvp-row">
                    {showEmailInput && (
                      <div className="rsvp-field" style={{ flex: 1, position: 'relative' }}>
                        <label className="rsvp-label" htmlFor="rsvp-email">Email Address</label>
                        {!showPhoneInput && (
                          <button 
                            type="button" 
                            onClick={() => { setShowEmailInput(false); setShowPhoneInput(true); setEmail(''); }}
                            style={{ position: 'absolute', right: 0, top: 0, background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--t-accent)', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Use phone instead
                          </button>
                        )}
                        <input
                          id="rsvp-email"
                          className="rsvp-input"
                          type="email"
                          placeholder="e.g. sarah@example.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                        />
                      </div>
                    )}
                    {showPhoneInput && (
                      <div className="rsvp-field" style={{ flex: 1, position: 'relative' }}>
                        <label className="rsvp-label" htmlFor="rsvp-phone">Phone Number</label>
                        {!showEmailInput && (
                          <button 
                            type="button" 
                            onClick={() => { setShowPhoneInput(false); setShowEmailInput(true); setPhone(''); }}
                            style={{ position: 'absolute', right: 0, top: 0, background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--t-accent)', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Use email instead
                          </button>
                        )}
                        <input
                          id="rsvp-phone"
                          className="rsvp-input"
                          type="tel"
                          placeholder="e.g. 0400 000 000"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {(showEmailInput || showPhoneInput) && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--t-text-light)', marginTop: '-8px', marginBottom: '16px' }}>
                    * We'll use this to send you any updates about the party.
                  </p>
                )}
              </div>
            )}

            {/* STEP 4: Logistics & Comments */}
            {currentStep === 4 && (
              <div className="rsvp-step-content animate-fade-in">
                {isAttending ? (
                  <>
                    {/* Stay or Drop-off */}
                    {stayOrDropOffAllowed && (
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
                    {askAdultCount && stayOrDropOff === 'staying' && (
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
                    {askDietary && (
                      <div className="rsvp-field">
                        <label className="rsvp-label" htmlFor="rsvp-dietary">Allergies or dietary requirements</label>
                        <textarea
                          id="rsvp-dietary"
                          className="rsvp-textarea"
                          placeholder="Any food allergies or dietary needs we should know about?"
                          value={dietary}
                          onChange={e => setDietary(e.target.value)}
                          rows={2}
                        />
                      </div>
                    )}
                  </>
                ) : null}

                {/* Comments */}
                <div className="rsvp-field">
                  <label className="rsvp-label" htmlFor="rsvp-comments">Comments / Notes</label>
                  <textarea
                    id="rsvp-comments"
                    className="rsvp-textarea"
                    placeholder={isAttending ? "Any other notes or comments for the host?" : "Leave a message for the host..."}
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {error && <p className="rsvp-error" style={{ marginTop: '12px' }}>{error}</p>}

            {/* Navigation buttons */}
            <div className="rsvp-wizard-nav-container">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  className="rsvp-btn rsvp-wizard-back-btn" 
                  onClick={handlePrevStep}
                >
                  ← Back
                </button>
              )}
              {currentStep > 1 && currentStep < 4 ? (
                <button
                  type="button"
                  className="rsvp-btn rsvp-wizard-next-btn"
                  onClick={handleNextStep}
                >
                  Continue →
                </button>
              ) : currentStep === 4 ? (
                <button
                  type="submit"
                  className="rsvp-btn rsvp-submit-btn"
                  disabled={submitting || !canSubmitFinal}
                  id="rsvp-submit"
                  style={{ 
                    flex: 2, 
                    margin: 0, 
                    opacity: canSubmitFinal ? 1 : 0.7,
                    borderRadius: '50px', 
                    fontSize: '1.3rem', 
                    padding: '20px 24px', 
                    boxShadow: '0 12px 32px color-mix(in srgb, var(--t-accent) 40%, transparent)', 
                    width: '100%', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    background: 'var(--t-btn-bg)',
                    color: 'var(--t-btn-text)',
                    border: 'none'
                  }}
                >
                  {submitting ? 'Sending…' : (isEditMode ? '✅ Update RSVP' : '✉️ Submit RSVP')}
                </button>
              ) : null}
            </div>
          </form>
        )}

        <div className="rsvp-footer">
          <p>Powered by <a href="/" className="rsvp-footer-link">Tiny Party <span style={{ fontSize: '0.8em' }}>Portal</span></a></p>
        </div>
      </div>
  );

  if (embedded) return containerContent;

  return (
    <ThemedPage themeKey={themeKey} themeColor={event.themeColor}>
      <SEO 
        title={`RSVP - ${event.childName ? event.childName + "'s " : ""}${event.name}`} 
        description={`RSVP to ${event.childName ? event.childName + "'s " : ""} birthday party!`}
        url={pageUrl}
        noindex={true}
      />
      {containerContent}
    </ThemedPage>
  );
}
