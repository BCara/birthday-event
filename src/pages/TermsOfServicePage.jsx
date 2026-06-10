import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="kb-container" style={{ maxWidth: '800px', margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontFamily: 'var(--kb-font-display)', fontSize: '2.5rem', marginBottom: '24px' }}>Terms of Service</h1>
      
      <div style={{ lineHeight: '1.7', color: 'var(--kb-text)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using Tiny Party Portal, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, you may not access or use the website or services.</p>
        
        <h2>2. Description of Service</h2>
        <p>Tiny Party Portal provides a platform for organizing children's birthday parties, including event creation, RSVP management, and memory sharing. We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice.</p>
        
        <h2>3. User Conduct</h2>
        <p>You are solely responsible for all code, video, images, information, data, text, software, music, sound, photographs, graphics, messages or other materials that you upload, post, publish or display via the service. You agree to not use the service to post inappropriate, offensive, or illegal content.</p>
        
        <h2>4. Privacy Policy</h2>
        <p>Our Privacy Policy describes how we handle the information you provide to us when you use our services. By using our services, you consent to our collection and use of this information as described in the Privacy Policy.</p>
        
        <h2>5. Termination</h2>
        <p>We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including without limitation if you breach the Terms.</p>
      </div>
    </div>
  );
}
