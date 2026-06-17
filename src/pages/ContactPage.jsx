import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions, trackEvent } from '../firebase';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

export default function ContactPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    
    setLoading(true);
    try {
      const submitGlobalContactForm = httpsCallable(functions, 'submitGlobalContactForm');
      await submitGlobalContactForm({ name, email, message });
      trackEvent('contact_submitted', {});
      setStatus('Message sent successfully! We will get back to you shortly.');
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kb-container" style={{ maxWidth: '600px', margin: '80px auto', padding: '0 24px' }}>
      <SEO 
        title="Contact Us" 
        description="Get in touch with the Tiny Party Portal team for any questions or support." 
        url="https://tinypartyportal.com/contact"
      />
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--kb-font-display)', fontSize: '2.5rem', marginBottom: '16px' }}>Contact Us</h1>
        <p style={{ color: 'var(--kb-text-muted)', fontSize: '1.1rem' }}>Have questions? We'd love to hear from you.</p>
        <p style={{ color: 'var(--kb-text-muted)', fontSize: '0.95rem', marginTop: '8px' }}>
          Fill out the form below or email us directly at <a href="mailto:info@tinypartyportal.com" style={{ color: 'var(--kb-primary)', textDecoration: 'none' }}>info@tinypartyportal.com</a>.
        </p>
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
            <input type="text" className="kb-input" required placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
          </div>
          <div className="kb-field">
            <label className="kb-label">Email</label>
            <input type="email" className="kb-input" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          </div>
          <div className="kb-field">
            <label className="kb-label">Message</label>
            <textarea className="kb-input" required rows={5} placeholder="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)} disabled={loading}></textarea>
          </div>
          <button type="submit" className="kb-btn kb-btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      )}
    </div>
  );
}
