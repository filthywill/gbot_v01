import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <div className="max-w-[800px] mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
        
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Stizack's service, you agree to be bound by these Terms of Service and all applicable laws and regulations.
              If you do not agree with any of these terms, you are prohibited from using or accessing this service.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
            <p className="mb-2">
              Permission is granted to temporarily use our application for personal, non-commercial use only. This license does not include:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Modifying or copying our materials</li>
              <li>Using the material for any commercial purpose</li>
              <li>Attempting to decompile or reverse engineer any software contained in our application</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirror" the materials on any other server</li>
            </ul>
            <p className="mt-2">
              This license shall automatically terminate if you violate any of these restrictions and may be terminated by Stizack at any time.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Content</h2>
            <p>
              Our service allows you to create and generate graffiti-style text. You retain all rights to the content you create,
              but you grant us a non-exclusive, royalty-free license to use, reproduce, and display such content in connection with
              the service and our business operations.
            </p>
            <p className="mt-2">
              You are solely responsible for the content you create and ensure that it does not infringe upon any third-party rights
              or violate any applicable laws or regulations.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">4. Disclaimer</h2>
            <p>
              The materials on Stizack's application are provided on an 'as is' basis. Stizack makes no warranties, expressed or implied,
              and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability,
              fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">5. Limitations</h2>
            <p>
              In no event shall Stizack or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit,
              or due to business interruption) arising out of the use or inability to use the materials on Stizack's application,
              even if Stizack or a Stizack authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">6. Account Terms</h2>
            <p>
              You are responsible for maintaining the security of your account and password. Stizack cannot and will not be liable
              for any loss or damage from your failure to comply with this security obligation.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">7. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the United States,
              and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">8. Changes to Terms</h2>
            <p>
              Stizack reserves the right, at its sole discretion, to modify or replace these Terms at any time.
              If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
              What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at: terms@stizack.com
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

export default TermsOfService; 