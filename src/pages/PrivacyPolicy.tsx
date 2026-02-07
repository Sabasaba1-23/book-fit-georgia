import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-20 flex items-center gap-3 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top, 0.75rem))" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Privacy Policy</h1>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 pb-12">
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 [&_h2]:text-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:text-sm [&_ul]:mb-3 [&_li]:mb-1">
          <h2 className="!text-xl !mt-0">Privacy Policy — Fitbook</h2>
          <p><strong>Effective date:</strong> 7 February 2026<br /><strong>Last updated:</strong> 7 February 2026</p>
          <p>This Privacy Policy explains how Fitbook ("we", "us", "our") collects, uses, and protects your personal information when you use the Fitbook mobile application and website (the "Services").</p>

          <h2>1) Who we are</h2>
          <p>Fitbook is operated by an individual developer based in Tbilisi, Georgia. Fitbook is not currently registered as a legal company or LLC. If a legal entity is created in the future, this Privacy Policy may be updated to reflect that change.</p>
          <p>Contact for privacy or data requests:<br />📧 support@fitbook.my</p>

          <h2>2) What this Privacy Policy applies to</h2>
          <p>This Privacy Policy applies to all users of Fitbook, including:</p>
          <ul>
            <li>Regular users / clients</li>
            <li>Trainers and coaches</li>
            <li>Gyms and business accounts</li>
          </ul>
          <p>It applies to data collected through:</p>
          <ul>
            <li>The Fitbook mobile application (Android, and iOS when available)</li>
            <li>The Fitbook website (including https://fitbook.my)</li>
            <li>Any communication with us via email or support channels</li>
          </ul>

          <h2>3) Information we collect</h2>
          <p>We collect information in the following categories.</p>

          <h3>A) Information you provide directly</h3>
          <p>Depending on your role and how you use the Services, this may include:</p>
          <ul>
            <li><strong>Account information:</strong> email address, name or username, password (if using email/password login)</li>
            <li><strong>Profile information:</strong> profile photo, biography, location (city or area), preferences</li>
            <li><strong>Role-related information:</strong> whether you register as a user, trainer, coach, or gym/business</li>
            <li><strong>Support communication:</strong> messages you send to us via email or support forms</li>
          </ul>

          <h3>B) Information created through use of the app</h3>
          <p>When you use Fitbook, we may generate or store:</p>
          <ul>
            <li><strong>Bookings and scheduling data:</strong> booking requests, appointments, confirmations, cancellations</li>
            <li><strong>Messages or chats:</strong> messages exchanged within the app (if messaging features are enabled)</li>
            <li><strong>Reviews or ratings:</strong> feedback you leave (if this feature is enabled)</li>
            <li><strong>Listings and services:</strong> information created by trainers, coaches, or gyms when offering services</li>
          </ul>

          <h3>C) Technical and usage information</h3>
          <p>We may collect limited technical information necessary to operate the Services, such as:</p>
          <ul>
            <li>Device type and operating system</li>
            <li>App version</li>
            <li>Basic usage and error logs</li>
          </ul>
          <p>We do not aim to collect unnecessary tracking or behavioral profiling data.</p>

          <h2>4) Account creation and login methods</h2>
          <p>Fitbook allows users to create accounts using:</p>
          <ul>
            <li>Email and password</li>
            <li>Google login</li>
          </ul>
          <p>If you use Google login, Google may provide us with limited information such as your email address and basic profile details. We do not receive or store your Google password.</p>

          <h2>5) Verification documents (trainers, coaches, gyms)</h2>
          <p>Fitbook may offer a verification system for trainers, coaches, and gym/business accounts. If enabled, these users may be asked to upload documents such as:</p>
          <ul>
            <li>Government-issued identification</li>
            <li>Professional certificates or diplomas</li>
            <li>Business registration documents</li>
          </ul>
          <p><strong>Purpose:</strong> verification, trust, and platform safety<br /><strong>Access:</strong> only the app administrator (not public, not other users)<br /><strong>Storage:</strong> secure cloud storage<br /><strong>Deletion:</strong> all verification documents are automatically deleted if the associated account is deleted</p>
          <p>If verification is not yet active, this section describes planned functionality.</p>

          <h2>6) Children's privacy</h2>
          <p>Fitbook is not intended for children under the age of 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, please contact us and we will delete it.</p>

          <h2>7) How we use your information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li>To create, authenticate, and manage user accounts</li>
            <li>To provide core features such as profiles, bookings, messaging, listings, and scheduling</li>
            <li>To verify trainers, coaches, and gym/business accounts (if verification is enabled)</li>
            <li>To communicate with users regarding account activity or support requests</li>
            <li>To maintain platform security, prevent abuse, and detect technical issues</li>
            <li>To improve and maintain the functionality and performance of the Services</li>
          </ul>
          <p><strong>We do not sell personal data to third parties.</strong></p>

          <h2>8) Legal basis for processing</h2>
          <p>Depending on the context, we process personal data based on one or more of the following legal grounds:</p>
          <ul>
            <li><strong>Performance of a contract:</strong> processing is necessary to provide the Services you requested</li>
            <li><strong>Consent:</strong> you voluntarily provide information or documents</li>
            <li><strong>Legitimate interests:</strong> ensuring platform safety, preventing fraud, improving functionality</li>
            <li><strong>Legal obligations:</strong> where required by applicable law</li>
          </ul>

          <h2>9) Data storage and security</h2>
          <p>Personal data is stored using Supabase, a cloud-based database and storage provider. Uploaded files such as profile images or verification documents are stored in secure cloud storage.</p>
          <p>We apply reasonable technical and organizational measures to protect data against unauthorized access, loss, or misuse. No system is completely secure, but we strive to use industry-standard protections appropriate to the size and nature of the Services.</p>

          <h2>10) Sharing of information</h2>
          <p>We only share personal data in limited circumstances:</p>
          <ul>
            <li><strong>Service providers:</strong> such as Supabase, solely to operate and maintain the Services</li>
            <li><strong>Other users:</strong> only information necessary for app functionality (for example, public trainer profiles)</li>
            <li><strong>Legal requirements:</strong> if required to comply with law or valid legal requests</li>
          </ul>
          <p><strong>We do not share personal data for advertising or resale.</strong></p>

          <h2>11) International data transfers</h2>
          <p>Your data may be processed and stored on servers located outside your country of residence, including in jurisdictions with different data protection laws. By using the Services, you consent to such transfers where legally permitted.</p>

          <h2>12) Analytics and tracking</h2>
          <p>At this time, Fitbook does not use third-party analytics or advertising tracking services. If analytics or crash-reporting tools are added in the future, this Privacy Policy will be updated accordingly.</p>

          <h2>13) Account deletion and data retention</h2>
          <p>Fitbook provides an in-app account deletion option. When you delete your account:</p>
          <ul>
            <li>Your user account is permanently removed</li>
            <li>All associated personal data is deleted, including: profile information, bookings and scheduling data, messages and chats, listings, reviews, and ratings, uploaded files, images, and verification documents</li>
          </ul>
          <p><strong>Account deletion is permanent and cannot be undone.</strong></p>
          <p>We do not retain personal data after account deletion, except where limited retention is required by law.</p>

          <h2>14) Your rights</h2>
          <p>Depending on applicable law, you may have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Delete your account and personal data</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p>You can exercise most rights directly within the app. For additional requests, contact us at support@fitbook.my.</p>

          <h2>15) Third-party services</h2>
          <p>Fitbook relies on trusted third-party services to operate, including:</p>
          <ul>
            <li><strong>Supabase</strong> (authentication, database, and file storage)</li>
            <li><strong>Google</strong> (authentication via Google Login, if chosen)</li>
          </ul>
          <p>These providers process data only as needed to deliver their services and according to their own privacy policies.</p>

          <h2>16) Payments</h2>
          <p>At this time, Fitbook does not process payments. If payment functionality is added in the future, this Privacy Policy will be updated to reflect how payment-related data is handled.</p>

          <h2>17) Changes to this Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time to reflect changes in the app, legal requirements, or business practices. When changes are made:</p>
          <ul>
            <li>The "Last updated" date will be revised</li>
            <li>Updated versions will be published within the app or on our website</li>
          </ul>
          <p>Continued use of the Services after updates means you accept the revised Privacy Policy.</p>

          <h2>18) Contact information</h2>
          <p>If you have questions, concerns, or requests regarding privacy or personal data, contact:</p>
          <p>📧 support@fitbook.my<br />📞 +995 511 10 29 16<br />📍 Tbilisi, Georgia</p>
        </div>
      </main>
    </div>
  );
}
