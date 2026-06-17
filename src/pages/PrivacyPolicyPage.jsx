import React from 'react';
import SEO from '../components/SEO';

const Section = ({ title, children }) => (
  <div>
    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>{title}</h2>
    {children}
  </div>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="kb-container" style={{ maxWidth: '800px', margin: '80px auto', padding: '0 24px 80px' }}>
      <SEO 
        title="Privacy Policy" 
        description="Privacy Policy for Tiny Party Portal." 
        url="https://tinypartyportal.com/privacy"
      />
      <h1 style={{ fontFamily: 'var(--kb-font-display)', fontSize: '2.5rem', marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--kb-text-muted)', marginBottom: 40 }}>Last updated: 13 June 2026</p>

      <div style={{ lineHeight: '1.8', color: 'var(--kb-text)', display: 'flex', flexDirection: 'column', gap: 28 }}>

        <Section title="1. Who We Are">
          <p>Tiny Party Portal ("we", "us", "our") is an Australian-based service that helps parents organise children's birthday parties, manage RSVPs, and share event details with guests. By using our service you agree to this Privacy Policy.</p>
        </Section>

        <Section title="2. Information We Collect">
          <p>We collect the following categories of information:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Account information:</strong> your name and email address when you sign up.</li>
            <li><strong>Event details:</strong> event name, date, time, location, and any description or message you write.</li>
            <li><strong>Guest information:</strong> children's first names and ages, parent/guardian names, contact details (email or phone), dietary requirements or allergy notes, and RSVP responses — provided by you or directly by your guests.</li>
            <li><strong>Photos:</strong> images of the birthday child you choose to upload to your event page.</li>
            <li><strong>Guest messages:</strong> if you use the Magic Paste feature, the text you paste is sent to an AI service to extract RSVP details (see Section 5).</li>
          </ul>
        </Section>

        <Section title="3. Children's Information">
          <p>Our service is used to organise children's parties. We collect children's first names, ages, and dietary or allergy information as part of the RSVP process. This information is provided by parents or guardians and is used solely to help event hosts manage their guest list. We do not use children's information for marketing or profiling, and we do not sell it to third parties.</p>
          <p style={{ marginTop: 8 }}>Dietary and allergy notes may constitute health information under the <em>Privacy Act 1988</em> (Cth). We handle this information with appropriate care and limit access to the event host only.</p>
        </Section>

        <Section title="4. How We Use Information">
          <p>We use collected information to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Create and display your event page to invited guests.</li>
            <li>Record and display RSVP responses to the event host.</li>
            <li>Send transactional communications (e.g. confirmation emails) where applicable.</li>
            <li>Improve and maintain the platform.</li>
          </ul>
          <p style={{ marginTop: 8 }}>We do not use your data for advertising or sell it to third parties.</p>
        </Section>

        <Section title="5. Third-Party Services">
          <p>We rely on the following third-party services to operate Tiny Party Portal. By using our service, you acknowledge that your data may be processed by these providers in accordance with their own privacy policies:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Google Firebase:</strong> We use Firebase for authentication, database storage (Firestore), and file storage. Event data, guest lists, and uploaded photos are stored on Google's infrastructure. See <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{ color: 'var(--kb-mint)' }}>Google's Privacy Policy</a>.</li>
            <li><strong>Google Gemini AI:</strong> When you use the Magic Paste feature, the text you paste is sent to Google's Gemini API to extract RSVP details. Do not include sensitive personal information beyond what is needed to identify the RSVP. See <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer" style={{ color: 'var(--kb-mint)' }}>Gemini API Terms</a>.</li>
          </ul>
        </Section>

        <Section title="6. Data Retention">
          <p>We retain your data for as long as your account is active or as needed to provide the Service to you. Specifically:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><strong>Event and guest data:</strong> retained while your account is active. If you delete an event, its associated guest and RSVP data is also deleted.</li>
            <li><strong>Memory Capsule content (paid feature):</strong> photos, memories, and capsule content are retained for the duration of your active subscription or capsule period — which may be several years. This content is intentionally kept long-term as part of the paid service. You can request deletion of capsule content at any time by contacting us.</li>
            <li><strong>Account closure:</strong> if you close your account, standard event data will be deleted. Paid capsule content will be deleted upon your request or at the end of the paid period, whichever comes first.</li>
          </ul>
          <p style={{ marginTop: 8 }}>We do not retain your data longer than necessary for the purpose for which it was collected, except where required by law.</p>
        </Section>

        <Section title="7. Your Rights">
          <p>Under the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles, you have the right to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Access the personal information we hold about you.</li>
            <li>Request correction of inaccurate information.</li>
            <li>Request deletion of your personal information (subject to legal obligations).</li>
          </ul>
          <p style={{ marginTop: 8 }}>To exercise any of these rights, contact us at <a href="mailto:support@tinypartyportal.com" style={{ color: 'var(--kb-mint)' }}>support@tinypartyportal.com</a>.</p>
        </Section>

        <Section title="8. Security">
          <p>We use industry-standard security measures including Firebase's built-in authentication and security rules to protect your data. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page. Continued use of the service after changes constitutes acceptance of the updated policy.</p>
        </Section>

        <Section title="10. Contact">
          <p>If you have questions, concerns, or a complaint about how we handle your personal information, please contact us at <a href="mailto:support@tinypartyportal.com" style={{ color: 'var(--kb-mint)' }}>support@tinypartyportal.com</a>. If we cannot resolve your complaint, you may contact the <a href="https://www.oaic.gov.au" target="_blank" rel="noreferrer" style={{ color: 'var(--kb-mint)' }}>Office of the Australian Information Commissioner (OAIC)</a>.</p>
        </Section>

      </div>
    </div>
  );
}
