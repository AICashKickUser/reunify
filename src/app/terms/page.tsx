import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Reunify",
  description: "Reunify Terms of Service",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: July 2025</p>

        <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Reunify application (&quot;App&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the App. These Terms apply to all visitors, users, and others who access or use the App.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Description of Service</h2>
            <p className="mb-2">
              Reunify is a CPS (Child Protective Services) reunification case tracking application that helps parents and guardians:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Track court-ordered case plan requirements and progress</li>
              <li>Log counseling sessions, drug tests, NA/AA meetings, supervised visits, and parenting classes</li>
              <li>Monitor court dates and milestones</li>
              <li>Record daily check-ins and mood tracking</li>
              <li>Generate progress reports and compliance summaries</li>
              <li>Export court-ready documentation (Pro feature)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Free and Pro Tiers</h2>
            <p className="mb-2">
              Reunify offers two subscription tiers:
            </p>
            <ul className="list-disc pl-6 space-y-1 mb-3">
              <li><strong>Free Tier:</strong> Basic case tracking and data entry features at no cost.</li>
              <li><strong>Pro Tier:</strong> Advanced features including PDF export, detailed summaries, multiple case tracking, smart reminders, and more. The Pro tier is available for $4.99/month or $39.99/year.</li>
            </ul>
            <p className="mb-2">
              Pro subscriptions include a <strong>7-day free trial</strong>. You may cancel during the trial period at no charge. After the trial, your selected payment method will be charged.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Payment Processing:</strong> All payments are processed securely through Stripe. We do not store your credit card information on our servers.</li>
              <li><strong>Billing Cycle:</strong> Monthly subscriptions are billed every 30 days. Yearly subscriptions are billed annually from the date of subscription.</li>
              <li><strong>Free Trial:</strong> You will not be charged during the 7-day free trial. If you cancel before the trial ends, you will not be charged.</li>
              <li><strong>Auto-Renewal:</strong> Subscriptions automatically renew at the end of each billing period unless you cancel before the renewal date.</li>
              <li><strong>Price Changes:</strong> We may change our pricing with 30 days&apos; advance notice. Price changes will take effect at the start of your next billing cycle.</li>
              <li><strong>Taxes:</strong> Prices do not include applicable taxes, which will be added at checkout where required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Cancellation and Refunds</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cancellation:</strong> You may cancel your Pro subscription at any time through the app or by contacting us. Upon cancellation, you will retain access to Pro features until the end of your current billing period.</li>
              <li><strong>Refunds:</strong> We offer a full refund within 14 days of your first payment if you are not satisfied with the Pro tier. After 14 days, refunds are issued at our discretion on a case-by-case basis.</li>
              <li><strong>Data After Cancellation:</strong> If you cancel your subscription, your data will be preserved and accessible in the Free tier. You will lose access to Pro-only features, but your data will not be deleted.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. User Responsibilities</h2>
            <p className="mb-2">By using Reunify, you agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide accurate and truthful information when entering case data</li>
              <li>Not use the App for any illegal or unauthorized purpose</li>
              <li>Not attempt to gain unauthorized access to any portion of the App or its related systems</li>
              <li>Not share your account access with others without authorization</li>
              <li>Not misuse or abuse the App&apos;s features, including the reporting and export functions</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. User Content</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Ownership:</strong> You retain ownership of all case data, notes, and other content you enter into the App (&quot;User Content&quot;).</li>
              <li><strong>License:</strong> By entering User Content, you grant us a limited license to store, process, and display that content solely for the purpose of providing the App&apos;s services to you.</li>
              <li><strong>Accuracy:</strong> You are solely responsible for the accuracy and completeness of your User Content. We do not verify the accuracy of data you enter.</li>
              <li><strong>Export:</strong> You may export your User Content at any time using the App&apos;s export features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Disclaimer of Warranties</h2>
            <p className="mb-2">
              THE APP IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Implied warranties of merchantability or fitness for a particular purpose</li>
              <li>That the App will be uninterrupted, timely, secure, or error-free</li>
              <li>That the results obtained from the use of the App will be accurate or reliable</li>
              <li>That any errors in the App will be corrected</li>
            </ul>
            <p className="mt-2">
              <strong>Important:</strong> Reunify is a tracking and organization tool only. It is <strong>not</strong> a substitute for legal advice, professional counseling, or guidance from your caseworker or attorney. Always consult with qualified professionals regarding your CPS case.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Reunify and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Your use of or inability to use the App</li>
              <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
              <li>Any interruption or cessation of transmission to or from the App</li>
              <li>Any bugs, viruses, or similar harmful code transmitted to or through the App</li>
              <li>Any errors or omissions in any content or for any loss or damage incurred as a result of the use of any content posted, emailed, transmitted, or otherwise made available through the App</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Reunify and its operators from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the App or your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">11. Intellectual Property</h2>
            <p>
              The App and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of Reunify and its licensors. The App is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">12. Termination</h2>
            <p>
              We may terminate or suspend your access to the App immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the App will immediately cease. Provisions of these Terms that by their nature should survive termination shall survive.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions. Any disputes arising from these Terms or the App will be resolved in the courts of the applicable jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">14. Changes to Terms</h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. Your continued use of the App after any changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">15. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="mt-2">
              <strong>Reunify</strong><br />
              Email: legal@reunify.app<br />
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
