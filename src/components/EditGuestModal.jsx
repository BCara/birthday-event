import React, { useState } from 'react';

export default function EditGuestModal({ guest, askAdultCount, showParentAttendance, onClose, onSave }) {
  const [name, setName] = useState(guest.childName || '');
  const [childAge, setChildAge] = useState(guest.childAge || '');
  const [parentName, setParentName] = useState(guest.parentName || '');
  const [email, setEmail] = useState(guest.email || '');
  const [phone, setPhone] = useState(guest.phone || '');
  const [stayOrDropOff, setStayOrDropOff] = useState(guest.stayOrDropOff || 'staying');
  
  // Normalize attending status
  let initialAttending = 'pending';
  if (guest.attending === true || guest.attending === 'yes' || guest.isAttending === true || guest.isAttending === 'yes') initialAttending = 'yes';
  if (guest.attending === false || guest.attending === 'no' || guest.isAttending === false || guest.isAttending === 'no') initialAttending = 'no';
  if (guest.attending === 'maybe' || guest.isAttending === 'maybe') initialAttending = 'maybe';
  
  const [attending, setAttending] = useState(initialAttending);
  
  const initialAdults = guest.adultsCount !== undefined && guest.adultsCount !== null ? guest.adultsCount : 1;
  const [adultsCount, setAdultsCount] = useState(initialAdults);
  const [unsureAdults, setUnsureAdults] = useState(guest.adultsCount === null);
  
  const [dietary, setDietary] = useState(guest.dietary || '');
  const [comments, setComments] = useState(guest.comments || '');

  const handleSave = (e) => {
    e.preventDefault();
    onSave({
      ...guest,
      childName: name.trim(),
      childAge: childAge !== '' ? Number(childAge) : null,
      parentName: parentName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      attending,
      isAttending: attending === 'yes',
      stayOrDropOff: (attending === 'yes' && showParentAttendance) ? stayOrDropOff : null,
      adultsCount: (attending === 'yes') ? ((showParentAttendance && stayOrDropOff === 'dropoff') ? 0 : (unsureAdults ? null : adultsCount)) : 0,
      dietary: dietary.trim(),
      comments: comments.trim()
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 24, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--kb-surface)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--kb-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--kb-font-display)', color: 'var(--kb-text)' }}>✏️ Edit Guest</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--kb-text-muted)' }}>✕</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--kb-text-muted)', marginBottom: 6, display: 'block' }}>Child Name *</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="kb-input" style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--kb-text-muted)', marginBottom: 6, display: 'block' }}>Age</label>
              <input type="number" value={childAge} onChange={e => setChildAge(e.target.value)} className="kb-input" style={{ width: '100%' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--kb-text-muted)', marginBottom: 6, display: 'block' }}>Parent Name</label>
            <input value={parentName} onChange={e => setParentName(e.target.value)} className="kb-input" style={{ width: '100%' }} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--kb-text-muted)', marginBottom: 6, display: 'block' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="kb-input" style={{ width: '100%' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--kb-text-muted)', marginBottom: 6, display: 'block' }}>Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="kb-input" style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ background: 'var(--kb-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--kb-border)' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--kb-text)', marginBottom: 12, display: 'block' }}>Attending Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setAttending('yes')} className={`kb-btn ${attending === 'yes' ? 'kb-btn-primary' : 'kb-btn-secondary'}`} style={{ flex: 1, padding: '8px', fontSize: 13, background: attending === 'yes' ? 'var(--kb-mint)' : undefined, border: attending === 'yes' ? 'none' : undefined }}>Yes</button>
              <button type="button" onClick={() => setAttending('no')} className={`kb-btn ${attending === 'no' ? 'kb-btn-primary' : 'kb-btn-secondary'}`} style={{ flex: 1, padding: '8px', fontSize: 13, background: attending === 'no' ? 'var(--kb-coral)' : undefined, border: attending === 'no' ? 'none' : undefined }}>No</button>
              <button type="button" onClick={() => setAttending('maybe')} className={`kb-btn ${attending === 'maybe' ? 'kb-btn-primary' : 'kb-btn-secondary'}`} style={{ flex: 1, padding: '8px', fontSize: 13, background: attending === 'maybe' ? '#F59E0B' : undefined, border: attending === 'maybe' ? 'none' : undefined }}>Maybe</button>
              <button type="button" onClick={() => setAttending('pending')} className={`kb-btn ${attending === 'pending' ? 'kb-btn-primary' : 'kb-btn-secondary'}`} style={{ flex: 1, padding: '8px', fontSize: 13, background: attending === 'pending' ? 'var(--kb-text-muted)' : undefined, border: attending === 'pending' ? 'none' : undefined }}>Pending</button>
            </div>
          </div>

          {attending === 'yes' && showParentAttendance && (
            <div style={{ background: 'var(--kb-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--kb-border)' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--kb-text)', marginBottom: 12, display: 'block' }}>Staying or Drop-off?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  type="button" 
                  onClick={() => setStayOrDropOff('staying')} 
                  className={`kb-btn ${stayOrDropOff === 'staying' ? 'kb-btn-primary' : 'kb-btn-secondary'}`} 
                  style={{ flex: 1, padding: '8px', fontSize: 13, background: stayOrDropOff === 'staying' ? 'var(--kb-mint)' : undefined, border: stayOrDropOff === 'staying' ? 'none' : undefined }}
                >
                  🏠 Staying
                </button>
                <button 
                  type="button" 
                  onClick={() => setStayOrDropOff('dropoff')} 
                  className={`kb-btn ${stayOrDropOff === 'dropoff' ? 'kb-btn-primary' : 'kb-btn-secondary'}`} 
                  style={{ flex: 1, padding: '8px', fontSize: 13, background: stayOrDropOff === 'dropoff' ? 'var(--kb-coral)' : undefined, border: stayOrDropOff === 'dropoff' ? 'none' : undefined }}
                >
                  🚗 Drop-off
                </button>
              </div>
            </div>
          )}

          {askAdultCount && attending === 'yes' && (showParentAttendance ? stayOrDropOff === 'staying' : true) && (
            <div style={{ background: 'var(--kb-surface-2)', padding: 16, borderRadius: 16, border: '1px solid var(--kb-border)' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--kb-text)', marginBottom: 12, display: 'block' }}>Adults Attending</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: unsureAdults ? 0.5 : 1 }}>
                <button type="button" disabled={unsureAdults} onClick={() => setAdultsCount(Math.max(0, adultsCount - 1))} className="kb-btn kb-btn-secondary" style={{ width: 36, height: 36, padding: 0, borderRadius: '50%' }}>−</button>
                <span style={{ fontSize: 16, fontWeight: 'bold', width: 24, textAlign: 'center' }}>{adultsCount}</span>
                <button type="button" disabled={unsureAdults} onClick={() => setAdultsCount(Math.min(10, adultsCount + 1))} className="kb-btn kb-btn-secondary" style={{ width: 36, height: 36, padding: 0, borderRadius: '50%' }}>+</button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={unsureAdults} onChange={e => setUnsureAdults(e.target.checked)} />
                <span style={{ fontSize: 13 }}>Unsure</span>
              </label>
            </div>
          )}

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--kb-text-muted)', marginBottom: 6, display: 'block' }}>Dietary / Notes</label>
            <input value={dietary} onChange={e => setDietary(e.target.value)} className="kb-input" style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--kb-text-muted)', marginBottom: 6, display: 'block' }}>Comments</label>
            <textarea value={comments} onChange={e => setComments(e.target.value)} className="kb-input" style={{ width: '100%', resize: 'vertical' }} rows={2} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="kb-btn kb-btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="kb-btn kb-btn-primary" style={{ flex: 1, background: 'var(--kb-purple)', border: 'none' }}>Save Changes</button>
          </div>

        </form>

      </div>
    </div>
  );
}
