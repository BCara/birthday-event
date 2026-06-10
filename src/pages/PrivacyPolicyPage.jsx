import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="kb-container" style={{ maxWidth: '800px', margin: '80px auto', padding: '0 24px' }}>
      <h1 style={{ fontFamily: 'var(--kb-font-display)', fontSize: '2.5rem', marginBottom: '24px' }}>Privacy Policy</h1>
      
      <div style={{ lineHeight: '1.7', color: 'var(--kb-text)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us when you create an account, create an event, RSVP to an event, or communicate with us. This may include your name, email address, phone number, event details, and any photos or memories you upload.</p>
        
        <h2>2. How We Use Information</h2>
        <p>We use the information we collect to provide, maintain, and improve our services, to process transactions, to send you technical notices and support messages, and to communicate with you about products, services, offers, and events.</p>
        
        <h2>3. Information Sharing</h2>
        <p>We do not share your personal information with third parties except as necessary to provide our services, comply with the law, or protect our rights. Event information is shared with guests you invite, and memories shared by guests are visible to the event host and potentially other guests, depending on the event settings.</p>
        
        <h2>4. Data Security</h2>
        <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
        
        <h2>5. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at support@tinypartyportal.com.</p>
      </div>
    </div>
  );
}
