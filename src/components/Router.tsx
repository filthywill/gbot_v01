import React, { useState, useEffect } from 'react';
import App from '../App';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfService from '../pages/TermsOfService';

const Router: React.FC = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePathChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePathChange);

    return () => {
      window.removeEventListener('popstate', handlePathChange);
    };
  }, []);

  // Function to navigate without page reload
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Add navigate function to window for global access
  React.useEffect(() => {
    (window as any).navigateTo = navigate;
    
    // Override link clicks to use our router
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.getAttribute('href')?.startsWith('/') && !anchor.getAttribute('target')) {
        e.preventDefault();
        navigate(anchor.getAttribute('href') || '/');
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    
    return () => {
      document.removeEventListener('click', handleLinkClick);
      delete (window as any).navigateTo;
    };
  }, []);

  // Render the appropriate component based on the current path
  switch (currentPath) {
    case '/privacy-policy':
      return <PrivacyPolicy />;
    case '/terms-of-service':
      return <TermsOfService />;
    default:
      return <App />;
  }
};

export default Router; 