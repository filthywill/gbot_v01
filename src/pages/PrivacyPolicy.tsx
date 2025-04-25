import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-[800px] mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p>
              This Privacy Policy explains how Stizack ("we", "our", or "us") collects, uses, and shares your information when you use our service.
              This Privacy Policy applies to all users of our application.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect the following types of information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Information you provide to us directly, such as account information and graffiti text inputs</li>
              <li>Usage information and analytics data about how you interact with our service</li>
              <li>Information automatically collected from your device, such as IP address and browser information</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and fulfill your requests</li>
              <li>Send you technical notices and support messages</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Protect the security and integrity of our service</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">4. How We Share Your Information</h2>
            <p className="mb-2">We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Service providers who perform services on our behalf</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a sale, merger, or acquisition of all or a portion of our company</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect the security of your personal information.
              However, please be aware that no security system is impenetrable and we cannot guarantee the absolute security of your data.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <p className="mb-2">Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate information</li>
              <li>The right to delete your information</li>
              <li>The right to restrict or object to processing</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page
              and updating the "Last Updated" date.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: privacy@stizack.com
            </p>
          </section>
          
          <div className="mt-8 text-sm text-zinc-400">
            <p>Last Updated: March 31, 2024</p>
          </div>
        </div>
        
        <div className="mt-8">
          <a href="/" className="text-blue-400 hover:text-blue-300">← Back to Home</a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 