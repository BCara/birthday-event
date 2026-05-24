import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContactPage() {
  const [status, setStatus] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('Message sent successfully! We will get back to you shortly.');
  };

  return (
    <div className="kb-container" style={{ maxWidth: '600px', margin: '80px auto', padding: '0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--kb-font-display)', fontSize: '2.5rem', marginBottom: '16px' }}>Contact Us</h1>
        <p style={{ color: 'var(--kb-text-muted)', fontSize: '1.1rem' }}>Have questions? We'd love to hear from you.</p>
      </div>

      {status ? (
        <div style={{ background: 'var(--kb-success-bg, #d4edda)', color: 'var(--kb-success-text, #155724)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <p>{status}</p>
          <button className="kb-btn kb-btn-primary" style={{ marginTop: '20px' }} onClick={() => setStatus('')}>Send another message</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="kb-field">
            <label className="kb-label">Name</label>
            <input type="text" className="kb-input" required placeholder="Your Name" />
          </div>
          <div className="kb-field">
            <label className="kb-label">Email</label>
            <input type="email" className="kb-input" required placeholder="you@example.com" />
          </div>
          <div className="kb-field">
            <label className="kb-label">Message</label>
            <textarea className="kb-input" required rows={5} placeholder="How can we help?"></textarea>
          </div>
          <button type="submit" className="kb-btn kb-btn-primary">Send Message</button>
        </form>
      )}
    </div>
  );
}
