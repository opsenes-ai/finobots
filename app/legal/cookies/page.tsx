export default function CookiesPage() {
  return (
    <>
      <h1>Cookie Policy</h1>
      <p className="text-sm text-muted-foreground">
        Last updated: November 8, 2026
      </p>

      <h2>1. Introduction</h2>
      <p>
        This Cookie Policy explains how Finobots (&quot;Company,&quot;
        &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) uses cookies and
        similar technologies on our website and services (collectively, the
        &quot;Service&quot;). This policy should be read alongside our Privacy
        Policy, which explains how we collect and process personal information.
      </p>

      <h2>2. What Are Cookies</h2>
      <p>
        Cookies are small text files that a website stores on your device
        (computer, tablet, or mobile phone) when you visit. They allow the
        website to recognize your device and remember your preferences, actions,
        and activity over time.
      </p>
      <p>
        In addition to cookies, we may use similar technologies such as web
        beacons, pixel tags, and local storage (&quot;local shared
        objects&quot;). For simplicity, this policy refers to all of these
        technologies as &quot;cookies.&quot;
      </p>

      <h2>3. Types of Cookies We Use</h2>
      <p>We categorize the cookies we use into the following types:</p>
      <ul>
        <li>
          <strong>Strictly Necessary Cookies</strong> — Required for the Service
          to function. They enable core functionality such as authentication,
          security, and session management. You cannot disable these without
          affecting the operation of the Service.
        </li>
        <li>
          <strong>Preference Cookies</strong> — Remember your choices and
          settings, such as language, display preferences, and region. These are
          not essential but improve your experience.
        </li>
        <li>
          <strong>Analytics and Performance Cookies</strong> — Collect anonymous
          information about how visitors use the Service, including which pages
          are visited most often and whether error messages are displayed. This
          helps us measure and improve Service performance.
        </li>
        <li>
          <strong>Functionality Cookies</strong> — Allow the Service to remember
          choices you make to provide enhanced, more personalized features.
        </li>
        <li>
          <strong>Marketing and Advertising Cookies</strong> — Used to deliver
          content and advertisements relevant to your interests. They may also
          be used to limit the number of times you see an advertisement and
          measure the effectiveness of advertising campaigns.
        </li>
      </ul>

      <h2>4. Specific Cookies Used</h2>
      <p>The following table summarizes the specific cookies set by the Service:</p>
      <table>
        <thead>
          <tr>
            <th>Cookie Name</th>
            <th>Type</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>session</td>
            <td>Strictly Necessary</td>
            <td>
              Maintains your authenticated session and prevents cross-site
              request forgery attacks
            </td>
            <td>Session</td>
          </tr>
          <tr>
            <td>csrf_token</td>
            <td>Strictly Necessary</td>
            <td>Protects against cross-site request forgery</td>
            <td>Session</td>
          </tr>
          <tr>
            <td>theme</td>
            <td>Preference</td>
            <td>Stores your light or dark mode preference</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td>locale</td>
            <td>Preference</td>
            <td>Stores your selected language and region</td>
            <td>1 year</td>
          </tr>
          <tr>
            <td>analytics_id</td>
            <td>Analytics</td>
            <td>
              Generates a unique identifier to track page visits and user
              behavior anonymously
            </td>
            <td>2 years</td>
          </tr>
          <tr>
            <td>ab_test_group</td>
            <td>Functionality</td>
            <td>
              Assigns you to an A/B test group to evaluate feature variations
            </td>
            <td>30 days</td>
          </tr>
        </tbody>
      </table>

      <h2>5. Session vs. Persistent Cookies</h2>
      <p>
        <strong>Session cookies</strong> are temporary and are deleted from your
        device when you close your browser. They are used to maintain state
        during a single browsing session.
      </p>
      <p>
        <strong>Persistent cookies</strong> remain on your device for a set
        period or until you delete them manually. They are used to remember your
        preferences and recognize you across sessions.
      </p>

      <h2>6. First-Party and Third-Party Cookies</h2>
      <p>
        <strong>First-party cookies</strong> are set by the Service directly and
        are used to operate and improve the Service.
      </p>
      <p>
        <strong>Third-party cookies</strong> are set by domains other than ours.
        We may use third-party services for analytics, error reporting, and
        advertising. These third parties set their own cookies and are
        responsible for their own cookie practices. We recommend reviewing their
        respective privacy and cookie policies.
      </p>

      <h2>7. Managing and Disabling Cookies</h2>
      <p>
        You can control and delete cookies through your browser settings. Most
        browsers allow you to refuse cookies or alert you when cookies are being
        sent. Refer to your browser&apos;s help documentation for instructions:
      </p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647">
            Google Chrome
          </a>
        </li>
        <li>
          <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer">
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac">
            Apple Safari
          </a>
        </li>
        <li>
          <a href="https://support.microsoft.com/help/17442/windows-internet-explorer-delete-manage-cookies">
            Microsoft Edge
          </a>
        </li>
      </ul>
      <p>
        Disabling strictly necessary cookies may prevent the Service from
        functioning properly. Disabling preference, analytics, or marketing
        cookies will not affect core functionality but may reduce the quality of
        your experience.
      </p>

      <h2>8. Do Not Track Signals</h2>
      <p>
        Some browsers offer a &quot;Do Not Track&quot; (DNT) feature. The Service
        does not currently respond to DNT signals. We continue to monitor
        developments in this area and may update this policy to reflect any
        changes in our approach to DNT signals.
      </p>

      <h2>9. Updates to This Policy</h2>
      <p>
        We may update this Cookie Policy from time to time to reflect changes in
        technology, regulation, or our practices. We will post the updated
        version on this page with a revised &quot;Last updated&quot; date. We
        encourage you to review this page periodically.
      </p>

      <h2>10. Contact</h2>
      <p>
        If you have questions about this Cookie Policy or our use of cookies,
        please contact us at{" "}
        <a href="mailto:legal@finobots.com">legal@finobots.com</a>.
      </p>
    </>
  );
}
