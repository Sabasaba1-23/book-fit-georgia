import { useNavigate } from "react-router-dom";
import BackButton from "@/components/BackButton";

export default function TermsConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header
        className="sticky top-0 z-20 flex items-center gap-3 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Terms & Conditions</h1>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 pb-12">
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 [&_h2]:text-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-foreground [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:text-sm [&_ul]:mb-3 [&_li]:mb-1">
          <h2 className="!text-xl !mt-0">Terms & Conditions — Fitbook Georgia</h2>
          <p><strong>Effective date:</strong> 7 February 2026<br /><strong>Last updated:</strong> 7 February 2026</p>
          <p>These Terms & Conditions ("Terms") govern your access to and use of Fitbook, including the Fitbook mobile application and website (the "Services").</p>
          <p>By accessing or using Fitbook, you agree to be bound by these Terms.</p>

          <h2>1) Who we are</h2>
          <p>Fitbook Georgia is operated by an individual developer based in Tbilisi, Georgia ("Fitbook Georgia", "we", "us", "our"). Fitbook Georgia is not currently operated by a registered company or legal entity.</p>
          <p>Contact: 📧 support@fitbook.my</p>

          <h2>2) Acceptance of these Terms (IMPORTANT)</h2>
          <p>By creating an account, logging in, or using the Services, you automatically agree to these Terms and our Privacy Policy.</p>
          <p>This agreement applies whether you sign up using:</p>
          <ul>
            <li>Email and password</li>
            <li>Google login</li>
          </ul>
          <p>If you do not agree with these Terms, you must not use the Services.</p>

          <h2>3) Who may use Fitbook</h2>
          <p>You may use Fitbook if:</p>
          <ul>
            <li>You are at least 13 years old</li>
            <li>You can legally enter into agreements under applicable law</li>
            <li>You provide accurate and truthful information when registering</li>
          </ul>
          <p>Fitbook may restrict or terminate access if these conditions are not met.</p>

          <h2>4) User roles on Fitbook</h2>
          <p>Fitbook supports different account types:</p>
          <ul>
            <li>Users / clients</li>
            <li>Trainers / coaches</li>
            <li>Gyms / businesses</li>
          </ul>
          <p>Each role may have access to different features. You are responsible for choosing the correct role during registration.</p>

          <h2>5) Account registration and responsibility</h2>
          <p>When creating an account, you agree to:</p>
          <ul>
            <li>Provide accurate and up-to-date information</li>
            <li>Keep your login credentials secure</li>
            <li>Be responsible for all activity under your account</li>
          </ul>
          <p>You must notify us immediately if you believe your account has been compromised.</p>

          <h2>6) Trainer, coach, and gym responsibilities</h2>
          <p>If you register as a trainer, coach, or gym/business, you agree that:</p>
          <ul>
            <li>All information you provide is accurate and lawful</li>
            <li>You are responsible for the services you offer</li>
            <li>You comply with applicable local laws and regulations</li>
            <li>You hold any required qualifications, licenses, or permissions</li>
          </ul>
          <p>Fitbook does not guarantee the quality, legality, or outcomes of services offered by trainers or businesses.</p>

          <h2>7) Verification (optional feature)</h2>
          <p>Fitbook may offer account verification for trainers and gyms. Verification is intended to improve trust but does not constitute certification, endorsement, or professional approval by Fitbook.</p>
          <p>Fitbook may approve, reject, suspend, or revoke verification at its discretion.</p>

          <h2>8) Changes to the Services</h2>
          <p>Fitbook may modify, suspend, or discontinue any part of the Services at any time, with or without notice. We are not liable for changes, interruptions, or feature removals.</p>

          <h2>9) User conduct and prohibited activities</h2>
          <p>When using Fitbook, you agree not to:</p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Provide false, misleading, or fraudulent information</li>
            <li>Impersonate another person or business</li>
            <li>Harass, abuse, threaten, or harm other users</li>
            <li>Upload illegal, offensive, or inappropriate content</li>
            <li>Attempt to gain unauthorized access to the Services or other users' data</li>
            <li>Interfere with the operation, security, or performance of the Services</li>
          </ul>
          <p>Fitbook may suspend or terminate accounts that violate these rules.</p>

          <h2>10) Content you provide</h2>
          <p>You are responsible for any content you submit, upload, or share on Fitbook, including:</p>
          <ul>
            <li>Profile information</li>
            <li>Listings and service descriptions</li>
            <li>Messages and reviews</li>
            <li>Uploaded images or documents</li>
          </ul>
          <p>You confirm that:</p>
          <ul>
            <li>You own the content or have the right to use it</li>
            <li>Your content does not violate laws or third-party rights</li>
          </ul>
          <p>By submitting content, you grant Fitbook a non-exclusive, worldwide, royalty-free license to use, display, and store the content solely to operate and improve the Services.</p>

          <h2>11) Marketplace disclaimer (VERY IMPORTANT)</h2>
          <p><strong>Fitbook is a platform only.</strong></p>
          <ul>
            <li>Fitbook does not provide fitness services</li>
            <li>Fitbook does not employ trainers or gyms</li>
            <li>Fitbook does not supervise or control services offered by users</li>
          </ul>
          <p>All services are provided directly between users and trainers/gyms.</p>
          <p>Fitbook is not responsible for:</p>
          <ul>
            <li>Service quality or results</li>
            <li>Injuries, damages, or losses</li>
            <li>Disputes between users</li>
            <li>Accuracy of listings or profiles</li>
          </ul>
          <p><strong>Users are responsible for their own decisions and interactions.</strong></p>

          <h2>12) Health and fitness disclaimer</h2>
          <p>Fitbook does not provide medical, health, or professional advice. Any fitness activities, training, or recommendations offered through the platform are undertaken at your own risk.</p>
          <p>You should consult a qualified professional before starting any fitness program, especially if you have medical conditions.</p>

          <h2>13) Reviews, ratings, and feedback</h2>
          <p>Users may leave reviews or ratings if this feature is enabled. You agree that:</p>
          <ul>
            <li>Reviews must be honest and lawful</li>
            <li>Fitbook may remove reviews that violate these Terms</li>
            <li>Fitbook does not verify the accuracy of reviews</li>
          </ul>

          <h2>14) Account suspension and termination</h2>
          <p>Fitbook may suspend or terminate your account if:</p>
          <ul>
            <li>You violate these Terms</li>
            <li>You misuse the platform</li>
            <li>Required information is false or misleading</li>
            <li>It is necessary to protect users or the platform</li>
          </ul>
          <p>You may delete your account at any time using the in-app account deletion feature.</p>

          <h2>15) Limitation of liability</h2>
          <p>To the maximum extent permitted by law:</p>
          <ul>
            <li>Fitbook is provided "as is" and "as available"</li>
            <li>Fitbook is not liable for indirect, incidental, or consequential damages</li>
            <li>Fitbook is not responsible for loss of data, income, or business</li>
          </ul>
          <p><strong>Your use of Fitbook is at your own risk.</strong></p>

          <h2>16) Payments and fees (future feature)</h2>
          <p>At this time, Fitbook does not process payments. If payment functionality is introduced in the future:</p>
          <ul>
            <li>Payments may be handled by third-party payment providers</li>
            <li>Fitbook will not store full payment card details</li>
            <li>Additional terms or policies may apply</li>
          </ul>
          <p>Fitbook reserves the right to introduce fees, commissions, or paid features with prior notice.</p>

          <h2>17) Intellectual property</h2>
          <p>All rights, title, and interest in Fitbook — including the app, website, design, branding, logos, and software — are owned by Fitbook or its licensors.</p>
          <p>You may not:</p>
          <ul>
            <li>Copy, modify, or distribute the app or its content</li>
            <li>Use Fitbook branding without permission</li>
            <li>Reverse engineer or attempt to extract source code</li>
          </ul>
          <p>Nothing in these Terms grants you ownership rights in the platform.</p>

          <h2>18) Copyright and content removal</h2>
          <p>If you believe content on Fitbook infringes your intellectual property rights, please contact us at:</p>
          <p>📧 support@fitbook.my</p>
          <p>We may remove content or suspend accounts if infringement is confirmed.</p>

          <h2>19) Changes to these Terms</h2>
          <p>We may update these Terms from time to time to reflect:</p>
          <ul>
            <li>Changes in the Services</li>
            <li>Legal requirements</li>
            <li>Business or operational changes</li>
          </ul>
          <p>When updates are made:</p>
          <ul>
            <li>The "Last updated" date will be revised</li>
            <li>Updated Terms will be published in the app or on our website</li>
          </ul>
          <p>Continued use of Fitbook after updates means you accept the revised Terms.</p>

          <h2>20) Governing law and jurisdiction</h2>
          <p>These Terms are governed by and interpreted under the laws of Georgia. Any disputes arising from these Terms or use of the Services shall be subject to the exclusive jurisdiction of the courts of Tbilisi, Georgia, unless otherwise required by law.</p>

          <h2>21) Severability</h2>
          <p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.</p>

          <h2>22) Entire agreement</h2>
          <p>These Terms, together with the Privacy Policy, constitute the entire agreement between you and Fitbook regarding use of the Services. They supersede any prior agreements or understandings.</p>

          <h2>23) Contact information</h2>
          <p>For questions about these Terms or the Services, contact:</p>
          <p>📧 support@fitbook.my<br />📍 Tbilisi, Georgia</p>
        </div>
      </main>
    </div>
  );
}
