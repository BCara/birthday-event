import React from 'react';
import SEO from '../components/SEO';

const Section = ({ title, children }) => (
  <div>
    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>{title}</h2>
    {children}
  </div>
);

export default function TermsOfServicePage() {
  return (
    <div className="kb-container" style={{ maxWidth: '800px', margin: '80px auto', padding: '0 24px 80px' }}>
      <SEO 
        title="Terms of Service" 
        description="Terms of Service for Tiny Party Portal." 
        url="https://tinypartyportal.com/terms"
      />
      <h1 style={{ fontFamily: 'var(--kb-font-display)', fontSize: '2.5rem', marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ color: 'var(--kb-text-muted)', marginBottom: 40 }}>Last updated: 13 June 2026</p>

      <div style={{ lineHeight: '1.8', color: 'var(--kb-text)', display: 'flex', flexDirection: 'column', gap: 28 }}>

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using Tiny Party Portal ("the Service"), you agree to be bound by these Terms of Service and our <a href="/privacy" style={{ color: 'var(--kb-mint)' }}>Privacy Policy</a>. If you do not agree, you may not use the Service. These Terms are governed by the laws of New South Wales, Australia.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>Tiny Party Portal is a platform that helps parents and guardians organise children's birthday parties, manage RSVPs, and share event details with guests. We reserve the right to modify, suspend, or discontinue the Service at any time with reasonable notice where possible.</p>
        </Section>

        <Section title="3. Eligibility">
          <p>You must be at least 18 years old to create an account and use the Service. By registering, you confirm that you are at least 18 years of age. The Service is designed for use by parents and guardians to organise events for children — children themselves should not create accounts.</p>
        </Section>

        <Section title="4. Your Account">
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at <a href="mailto:support@tinypartyportal.com" style={{ color: 'var(--kb-mint)' }}>support@tinypartyportal.com</a> if you suspect unauthorised access.</p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to use the Service to:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>Upload or share content that is illegal, offensive, defamatory, or that infringes third-party rights.</li>
            <li>Collect or store personal information about others without their consent.</li>
            <li>Attempt to gain unauthorised access to the Service or its underlying systems.</li>
            <li>Use the Service for any commercial purpose not expressly permitted by us.</li>
          </ul>
        </Section>

        <Section title="6. Content You Upload">
          <p>You retain ownership of content you upload (including event details and photos). By uploading content, you grant us a limited licence to store and display that content solely for the purpose of providing the Service to you and your guests. You are responsible for ensuring you have the right to upload any photos or information, including photos of children.</p>
        </Section>

        <Section title="7. Guest Data">
          <p>When guests RSVP to your event, they provide personal information (such as their name, contact details, and dietary requirements). As the event host, you are responsible for using that information appropriately and in accordance with applicable privacy laws. Do not use guest data for any purpose beyond managing your event.</p>
        </Section>

        <Section title="8. AI Features">
          <p>The Magic Paste feature uses Google's Gemini AI to parse RSVP messages. By using this feature, you acknowledge that the text you provide will be processed by Google's AI systems. Do not include sensitive personal information beyond what is needed to identify the RSVP response.</p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>To the maximum extent permitted by Australian law, Tiny Party Portal and its operators are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including loss of data, loss of revenue, or any harm resulting from unauthorised access to your account or event data.</p>
          <p style={{ marginTop: 8 }}>Nothing in these Terms limits any rights you may have under the <em>Australian Consumer Law</em> that cannot be excluded by contract.</p>
        </Section>

        <Section title="10. Termination">
          <p>We may suspend or terminate your account if you breach these Terms, with or without notice. You may delete your account at any time by contacting us. Upon termination, standard event and guest data will be deleted. Paid Memory Capsule content will be retained until the end of your paid period or until you request deletion — whichever comes first. See our <a href="/privacy" style={{ color: 'var(--kb-mint)' }}>Privacy Policy</a> for full details on data retention.</p>
        </Section>

        <Section title="11. Changes to These Terms">
          <p>We may update these Terms from time to time. We will notify registered users of material changes by email or via an in-app notice. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>
        </Section>

        <Section title="12. Governing Law">
          <p>These Terms are governed by the laws of New South Wales, Australia. Any disputes arising from these Terms or your use of the Service will be subject to the exclusive jurisdiction of the courts of New South Wales.</p>
        </Section>

        <Section title="13. Contact">
          <p>For any questions about these Terms, contact us at <a href="mailto:support@tinypartyportal.com" style={{ color: 'var(--kb-mint)' }}>support@tinypartyportal.com</a>.</p>
        </Section>

      </div>
    </div>
  );
}
