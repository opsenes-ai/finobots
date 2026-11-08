export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <p className="text-sm text-muted-foreground">
        Last updated:{" "}
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <h2>1. Agreement to Terms</h2>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of the Finobots website and any related services (collectively, the
        &quot;Service&quot;). The Service is operated by Finobots
        (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;).
      </p>
      <p>
        By accessing or using the Service, you agree to be bound by these Terms
        and our Privacy Policy. If you do not agree to these Terms, you may not
        access or use the Service. If you are using the Service on behalf of an
        organization, you represent that you have the authority to bind that
        organization to these Terms.
      </p>

      <h2>2. Definitions</h2>
      <ul>
        <li>
          <strong>&quot;Account&quot;</strong> means the account created for you
          to access the Service.
        </li>
        <li>
          <strong>&quot;Content&quot;</strong> means any text, data, files, or
          other materials submitted, uploaded, or transmitted through the
          Service.
        </li>
        <li>
          <strong>&quot;User&quot;</strong> or <strong>&quot;you&quot;</strong>{" "}
          means any individual or entity that accesses or uses the Service.
        </li>
        <li>
          <strong>&quot;User Content&quot;</strong> means Content that you submit
          or make available through the Service.
        </li>
      </ul>

      <h2>3. Eligibility</h2>
      <p>
        You must be at least sixteen (16) years of age to use the Service. By
        agreeing to these Terms, you represent and warrant that you meet this
        age requirement and have the legal capacity to enter into a binding
        agreement. If you are using the Service on behalf of an entity, you
        represent that you are authorized to bind that entity.
      </p>

      <h2>4. Account Registration</h2>
      <p>
        To access certain features of the Service, you must register for an
        Account. You agree to:
      </p>
      <ul>
        <li>Provide accurate, current, and complete information during registration</li>
        <li>Maintain the security of your Account credentials</li>
        <li>
          Notify us immediately of any unauthorized use or security breach of
          your Account
        </li>
        <li>
          Accept responsibility for all activities that occur under your Account
        </li>
      </ul>
      <p>
        You may not transfer or assign your Account to another party. We reserve
        the right to suspend or terminate Accounts that are inactive for an
        extended period.
      </p>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          Use the Service for any unlawful purpose or in violation of any
          applicable law or regulation
        </li>
        <li>
          Infringe upon the intellectual property or other rights of any party
        </li>
        <li>
          Upload, transmit, or distribute any Content that is harmful, harassing,
          defamatory, or otherwise objectionable
        </li>
        <li>
          Interfere with, disrupt, or impair the Service, servers, or networks
          connected to the Service
        </li>
        <li>
          Attempt to gain unauthorized access to any portion of the Service,
          other Accounts, or computer systems or networks connected to the
          Service
        </li>
        <li>
          Reverse engineer, decompile, disassemble, or otherwise attempt to
          derive the source code of the Service
        </li>
        <li>
          Use automated systems, including bots, scrapers, or spiders, to
          access the Service in a manner that sends more request messages to our
          servers than a human can reasonably produce
        </li>
        <li>
          Introduce any virus, malware, or other malicious code into the Service
        </li>
        <li>
          Collect or harvest personal information of other Users without their
          consent
        </li>
      </ul>

      <h2>6. User Content</h2>
      <p>
        You retain all ownership rights in your User Content. By submitting User
        Content to the Service, you grant us a worldwide, non-exclusive,
        royalty-free, sublicensable, and transferable license to use, reproduce,
        distribute, modify, adapt, and display your User Content solely for the
        purpose of operating and improving the Service.
      </p>
      <p>You represent and warrant that your User Content:</p>
      <ul>
        <li>Does not violate any applicable law or third-party rights</li>
        <li>
          Does not contain any infringing, defamatory, or otherwise unlawful
          material
        </li>
        <li>
          You have all necessary rights, licenses, and consents to submit and
          display it
        </li>
      </ul>
      <p>
        We are not responsible for User Content and do not endorse any opinion
        expressed in it. We reserve the right to remove or restrict access to
        any User Content that violates these Terms or that we determine is
        inappropriate.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        The Service, including its design, features, and underlying software,
        is owned by us and is protected by intellectual property laws. All
        trademarks, service marks, logos, and trade names displayed on the
        Service are our property or the property of our licensors.
      </p>
      <p>
        Nothing in these Terms grants you any right to use any of our trademarks
        or other proprietary rights. You may not copy, modify, distribute, sell,
        or lease any part of the Service without our prior written consent.
      </p>

      <h2>8. Service Modifications</h2>
      <p>
        We reserve the right to modify, suspend, or discontinue the Service, or
        any part of it, at any time and without notice. We will not be liable to
        you or any third party for any modification, suspension, or
        discontinuance of the Service.
      </p>

      <h2>9. Fees and Payment</h2>
      <p>
        Some features of the Service may be subject to fees. If you choose to use
        paid features, you agree to the fees and payment terms presented at the
        time of purchase. We may change our fees at any time upon reasonable
        notice.
      </p>
      <p>
        All fees are non-refundable unless otherwise stated at the time of
        purchase or required by applicable law. You are responsible for all
        taxes associated with your use of the Service.
      </p>

      <h2>10. Third-Party Services</h2>
      <p>
        The Service may contain links to or integrate with third-party websites
        or services. We do not control and are not responsible for the content,
        practices, or policies of third parties. You acknowledge that we are not
        liable for any damage or loss caused by your use of third-party services.
      </p>

      <h2>11. Termination</h2>
      <p>
        You may terminate your Account at any time by following the instructions
        in your Account settings. We may terminate or suspend your Account and
        access to the Service at any time, without prior notice, for any reason,
        including if we believe you have violated these Terms.
      </p>
      <p>
        Upon termination, all licenses granted to you will cease. Sections of
        these Terms that by their nature should survive termination shall
        survive, including intellectual property, disclaimers, limitation of
        liability, and indemnification provisions.
      </p>

      <h2>12. Disclaimer of Warranties</h2>
      <p>
        The Service is provided on an &quot;as is&quot; and &quot;as
        available&quot; basis without warranties of any kind, whether express or
        implied. We do not warrant that the Service will be uninterrupted,
        secure, error-free, or that defects will be corrected. We make no
        warranty regarding the accuracy, reliability, or completeness of any
        information available through the Service.
      </p>

      <h2>13. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, we and our officers, directors,
        employees, and agents shall not be liable for any indirect, incidental,
        special, consequential, or punitive damages, including loss of profits,
        data, or goodwill, arising from your access to or use of, or inability
        to access or use, the Service.
      </p>
      <p>
        Our total aggregate liability for all claims arising from or relating to
        the Service shall not exceed the amount you have paid us in the twelve
        (12) months preceding the claim, or fifty U.S. dollars (USD $50),
        whichever is greater.
      </p>

      <h2>14. Indemnification</h2>
      <p>
        You agree to indemnify and hold us and our affiliates harmless from any
        claims, damages, liabilities, costs, and expenses (including reasonable
        attorneys&apos; fees) arising from your User Content, your use of the
        Service, or your violation of these Terms.
      </p>

      <h2>15. Governing Law and Dispute Resolution</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the
        laws of the jurisdiction in which the Company is incorporated, without
        regard to its conflict of law provisions.
      </p>
      <p>
        Any dispute arising out of or relating to these Terms or the Service
        shall first be attempted to be resolved through good-faith negotiation.
        If the dispute cannot be resolved within thirty (30) days, it shall be
        submitted to binding arbitration in the applicable jurisdiction, and
        you waive any right to participate in a class action or class-wide
        arbitration.
      </p>

      <h2>16. Changes to These Terms</h2>
      <p>
        We may revise these Terms from time to time. The most current version
        will always be available on this page. We will notify Users of material
        changes by posting the updated Terms on this page with a revised
        &quot;Last updated&quot; date. Your continued use of the Service after
        changes take effect constitutes acceptance of the revised Terms.
      </p>

      <h2>17. Severability</h2>
      <p>
        If any provision of these Terms is held to be unenforceable or invalid,
        that provision shall be limited or eliminated to the minimum extent
        necessary, and the remaining provisions shall remain in full force and
        effect.
      </p>

      <h2>18. Entire Agreement</h2>
      <p>
        These Terms, together with our Privacy Policy and Cookie Policy,
        constitute the entire agreement between you and us regarding the use of
        the Service and supersede all prior agreements and understandings,
        whether written or oral.
      </p>

      <h2>19. Contact</h2>
      <p>
        If you have any questions about these Terms, please contact us at{" "}
        <a href="mailto:legal@finobots.com">legal@finobots.com</a>.
      </p>
    </>
  );
}
