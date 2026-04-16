import { SEO } from '../components/SEO';

const legalStyles = `
.legal-page h2 {
  font-family: 'Roboto Condensed', sans-serif;
  color: #FFFFFF;
  font-size: clamp(20px, 3vw, 24px);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: -0.5px;
  margin: 40px 0 16px;
}
.legal-page h2:first-of-type { margin-top: 0; }
.legal-page p,
.legal-page li {
  font-family: 'Inter', sans-serif;
  color: #FFFFFF;
  font-size: 15px;
  line-height: 1.7;
}
.legal-page p { margin: 0 0 14px; }
.legal-page ul {
  margin: 0 0 16px;
  padding-left: 20px;
}
.legal-page li { margin-bottom: 8px; }
.legal-page a {
  color: #E88A1A;
  text-decoration: none;
  border-bottom: 1px solid rgba(232,138,26,0.4);
}
.legal-page a:hover {
  border-bottom-color: #E88A1A;
}
.legal-page strong {
  color: #FFFFFF;
  font-weight: 600;
}
.legal-intro {
  border-left: 3px solid #E88A1A;
  padding: 0 0 0 20px;
  margin: 0 0 40px;
  font-style: italic;
  color: #E88A1A !important;
  font-family: 'Roboto Condensed', sans-serif;
  font-size: 16px !important;
  letter-spacing: 0.02em;
}
`;

const EFFECTIVE_DATE = 'April 14, 2026';
const CONTACT_EMAIL = 'seekers@wotscampaign.com';

export function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="How War of the Sphinx collects, uses, and protects your information. Read our full privacy policy."
        canonicalPath="/privacy"
      />
      <style>{legalStyles}</style>
      <div
        style={{
          minHeight: '100vh',
          paddingTop: 24,
        }}
      >
        <div
          className="legal-page"
          style={{
            maxWidth: 780,
            margin: '0 auto',
            padding: '0 16px 80px',
          }}
        >
          <div style={{ marginBottom: 40 }}>
            <p
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                color: '#E88A1A',
                fontSize: 12,
                letterSpacing: 2,
                textTransform: 'uppercase',
                margin: '0 0 12px',
              }}
            >
              Privacy Policy
            </p>
            <h1
              style={{
                fontFamily: "'Roboto Condensed', sans-serif",
                color: '#FFFFFF',
                fontSize: 'clamp(32px, 6vw, 48px)',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: -0.5,
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              What the Archive Keeps
            </h1>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                color: '#AAAAAA',
                fontSize: 13,
                margin: '16px 0 0',
              }}
            >
              Effective {EFFECTIVE_DATE}
            </p>
          </div>

          <p className="legal-intro">
            The archive keeps only what is given, and only for as long as it serves the saga. Here is
            a plain accounting of what that means.
          </p>

          <h2>1. Who We Are</h2>
          <p>
            This Privacy Policy describes how the team behind <strong>War of the Sphinx</strong> ("we",
            "us", or "the Archive") collects, uses, and protects information about visitors to this website
            ("the Platform"). War of the Sphinx is a 7-volume independent comic book series in active
            production; the Platform serves as its public-facing gateway.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect the following categories of information:</p>
          <ul>
            <li>
              <strong>Email addresses</strong> — only when you voluntarily submit one through a subscription
              form on this site. We ask for nothing else at signup.
            </li>
            <li>
              <strong>Chat conversations</strong> — messages you send to The Griot (our AI assistant) and
              its responses are stored so that a single conversation can continue across messages.
            </li>
            <li>
              <strong>Visitor analytics</strong> — each time you load a page we record: a hashed
              (SHA-256) version of your IP address, your approximate country / region / city derived
              from that IP, the page you visited, the referring URL, and basic device information
              (device type, browser, operating system) parsed from your user-agent string. We do not
              store your raw IP address.
            </li>
            <li>
              <strong>Interaction events</strong> — in-session, anonymous records of events such as
              chat messages sent, voice playback requested, email signups submitted, and which pages
              or filters you used.
            </li>
            <li>
              <strong>Session identifier</strong> — a random token stored in your browser's
              sessionStorage so analytics events from the same visit can be grouped. This identifier
              is cleared when you close the tab.
            </li>
          </ul>

          <h2>3. How We Use This Information</h2>
          <ul>
            <li>To send you updates about the comic book series, Volume releases, and related news (email only).</li>
            <li>To understand where our audience is coming from in aggregate — which countries, which pages draw interest — so we can improve the Platform.</li>
            <li>To power The Griot's ability to hold a continuous conversation with you.</li>
            <li>To detect and prevent abuse of our API endpoints (rate limiting, bot filtering).</li>
            <li>To operate, maintain, and improve the Platform.</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal information. We do not share it with
            advertisers. We do not use it for targeted advertising.
          </p>

          <h2>4. Third-Party Services</h2>
          <p>
            The Platform relies on the following third-party services, each of which processes
            limited data on our behalf:
          </p>
          <ul>
            <li><strong>Google Firebase</strong> — database (Firestore) and static hosting. Data is stored in Google Cloud.</li>
            <li><strong>Cloudinary</strong> — image storage and delivery for artwork and graphics.</li>
            <li><strong>Anthropic</strong> — the AI model that powers The Griot. Chat messages are transmitted to Anthropic's API to generate responses.</li>
            <li><strong>ElevenLabs</strong> — voice synthesis for The Griot. The text of a Griot response is transmitted when you tap the speaker icon.</li>
            <li><strong>Resend</strong> — transactional email delivery for the welcome message and future newsletter.</li>
            <li><strong>ipapi.co</strong> — IP-to-location lookup, used to derive the approximate country / region / city of visitors.</li>
            <li><strong>Railway</strong> — server hosting for our backend API.</li>
          </ul>
          <p>
            Each of these providers has its own privacy policy governing how they handle data we send them.
          </p>

          <h2>5. Cookies &amp; Similar Technologies</h2>
          <p>
            We do not use third-party tracking cookies. We use one small piece of browser storage
            (<code style={{ background: '#2A2A2A', padding: '1px 6px', borderRadius: 2, fontSize: 13, color: '#FFFFFF' }}>sessionStorage</code>)
            to hold a random session identifier for the duration of your visit. If you enable
            analytics features of the browser-based Firebase SDK, Firebase may set its own cookies
            on its domains; refer to <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">Firebase's Privacy and Security page</a>.
          </p>

          <h2>6. Data Retention</h2>
          <ul>
            <li><strong>Email subscribers:</strong> kept until you unsubscribe or request removal.</li>
            <li><strong>Chat conversations:</strong> kept indefinitely in our database; we may anonymize or purge old conversations periodically.</li>
            <li><strong>Visitor analytics:</strong> retained for up to 24 months in aggregated form, then deleted.</li>
          </ul>

          <h2>7. Your Rights</h2>
          <p>Regardless of where you live, you may request the following at any time:</p>
          <ul>
            <li><strong>Access</strong> — a copy of the personal information we hold about you.</li>
            <li><strong>Correction</strong> — fixing information you believe is inaccurate.</li>
            <li><strong>Deletion</strong> — removal of your email and any associated records.</li>
            <li><strong>Unsubscribe</strong> — every email we send includes an unsubscribe link. You can also email us directly.</li>
            <li><strong>Objection</strong> — to any processing of your information you do not consent to.</li>
          </ul>
          <p>
            If you are in the European Economic Area, the United Kingdom, or California, you have
            additional rights under GDPR, UK GDPR, and CCPA respectively, including the right to
            data portability and the right to file a complaint with a supervisory authority. To
            exercise any of these rights, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>

          <h2>8. Security</h2>
          <p>
            We take reasonable technical and organizational measures to protect your information,
            including transport-layer encryption (HTTPS), IP hashing for analytics, and access
            controls on our databases. No method of transmission or storage is perfectly secure.
          </p>

          <h2>9. Children</h2>
          <p>
            The Platform is not directed to children under 13. We do not knowingly collect information
            from anyone under 13. If you believe a child has submitted information to us, contact
            us and we will delete it.
          </p>

          <h2>10. International Transfers</h2>
          <p>
            Our service providers (Firebase, Cloudinary, Anthropic, ElevenLabs, Resend, Railway)
            may process data in the United States or other countries. By using the Platform you
            acknowledge that your information may be transferred to and processed in jurisdictions
            with different data protection laws than your own.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy as the Platform evolves. The "Effective" date at the
            top of this page reflects the latest version. Material changes will be announced on
            the site or by email to subscribers.
          </p>

          <h2>12. Contact</h2>
          <p>
            Questions, requests, or concerns about this policy?{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </div>
      </div>
    </>
  );
}
