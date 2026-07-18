import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Reunify",
  description: "Reunify Privacy Policy",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: July 2025</p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Information We Collect</h2>
            <p className="mb-2">Reunify (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects the following types of information:</p>
            <p className="font-medium mb-1">Information You Provide:</p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li><strong>Case Information:</strong> Case numbers, court names, caseworker details, judge names, attorney information, removal dates, and case notes that you voluntarily enter into the app.</li>
              <li><strong>Progress Data:</strong> Counseling sessions, drug test results, NA/AA meeting attendance, supervised visit logs, court dates, parenting class records, milestones, and daily check-ins.</li>
              <li><strong>Payment Information:</strong> When you upgrade to Pro, your payment is processed securely through Stripe. We do not store your credit card number — Stripe handles all payment data.</li>
              <li><strong>Account Information:</strong> Email address if provided for account creation or notifications.</li>
            </ul>
            <p className="font-medium mb-1">Information Collected Automatically:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Device Information:</strong> Browser type, operating system, device type, and screen resolution.</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent in the app, and interaction patterns.</li>
              <li><strong>Cookies:</strong> Small data files stored on your device to maintain your session and preferences (such as theme selection and subscription status).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve the Reunify app and its features</li>
              <li>Process subscription payments and manage your Pro account</li>
              <li>Generate progress reports and compliance summaries you request</li>
              <li>Send reminders about upcoming court dates, deadlines, and tasks</li>
              <li>Respond to your support requests and questions</li>
              <li>Monitor usage patterns to improve app performance and user experience</li>
              <li>Detect, prevent, and address technical issues or security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Information We Share</h2>
            <p className="mb-2">We <strong>do not sell</strong> your personal information. We may share your information only in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Service Providers:</strong> We share data with third-party services that help us operate the app:
                <ul className="list-disc pl-6 mt-1 space-y-1">
                  <li><strong>Stripe</strong> — processes subscription payments. Stripe receives your payment details directly and is subject to its own <a href="https://stripe.com/privacy" className="text-emerald-600 underline">Privacy Policy</a>.</li>
                  <li><strong>Vercel</strong> — hosts our application and database. Vercel is subject to its own <a href="https://vercel.com/legal/privacy-policy" className="text-emerald-600 underline">Privacy Policy</a>.</li>
                </ul>
              </li>
              <li><strong>With Your Consent:</strong> If you use the &quot;Attorney Sharing&quot; feature, we share your progress reports only with the recipients you designate.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or governmental regulation.</li>
              <li><strong>Safety:</strong> We may disclose information to protect the rights, property, or safety of Reunify, our users, or the public.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Method of Disclosure</h2>
            <p>
              Your data is stored in a secure PostgreSQL database hosted by Vercel. Data is transmitted between your device and our servers using HTTPS/TLS encryption. Payment information is transmitted directly to Stripe via their secure checkout flow and never passes through or is stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Data Security</h2>
            <p className="mb-2">We implement the following security practices to safeguard your information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Encryption in Transit:</strong> All data is transmitted over HTTPS with TLS encryption.</li>
              <li><strong>Secure Hosting:</strong> Application and database are hosted on Vercel with enterprise-grade security.</li>
              <li><strong>Payment Security:</strong> All payment processing is handled by Stripe, which is PCI DSS Level 1 certified (the highest level of payment security).</li>
              <li><strong>Access Controls:</strong> Access to production systems and databases is restricted to authorized personnel only.</li>
              <li><strong>No Local Storage of Sensitive Data:</strong> Sensitive case data is stored on our secure servers, not on your device (except for temporary caching).</li>
              <li><strong>Regular Updates:</strong> We keep all software dependencies up to date to address known security vulnerabilities.</li>
            </ul>
            <p className="mt-2 text-gray-500">
              While we take reasonable measures to protect your information, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Data Retention</h2>
            <p>
              We retain your case data for as long as your account is active. You may delete your data at any time by using the &quot;Start Fresh&quot; feature to clear case data, or by contacting us to delete your account entirely. When you delete your data, it is permanently removed from our database.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Export your case data at any time using the app&apos;s export feature</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Children&apos;s Privacy</h2>
            <p>
              Reunify is designed for adults involved in CPS reunification cases. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will take steps to delete that information promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Third-Party Links</h2>
            <p>
              Our app may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the app after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or your personal information, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Reunify</strong><br />
              Email: privacy@reunify.app<br />
              Website: <a href="https://reunify-six.vercel.app" className="text-emerald-600 underline">reunify-six.vercel.app</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t">
          <a href="/" className="text-emerald-600 hover:underline text-sm">&larr; Back to Reunify</a>
        </div>
      </div>
    </div>
  );
}
