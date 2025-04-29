import React from 'react';
import { cn } from '../../lib/utils';

/**
 * AppFooter component that displays the application footer
 * Extracted from App.tsx for better component separation
 */
interface AppFooterProps {
  // Optional classNames to apply to the footer container
  className?: string;
  // Optional custom links to display
  customLinks?: Array<{
    href: string;
    label: string;
    // Optional target for the link (defaults to _self)
    target?: string;
    // Optional rel attribute for the link
    rel?: string;
  }>;
  // Optional copyright name (defaults to STIZAK)
  copyrightName?: string;
  // Optional additional content to display in the footer
  children?: React.ReactNode;
}

export function AppFooter({ 
  className,
  customLinks,
  copyrightName = "Stizack",
  children
}: AppFooterProps) {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();
  
  // Default links if none provided
  const links = customLinks || [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-of-service", label: "Terms of Service" }
  ];
  
  return (
    <footer 
      className={cn("shadow-inner mt-2", className)} 
      role="contentinfo" 
      aria-label="Footer"
    >
      <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
        <p className="text-center text-tertiary text-xs">
          {copyrightName} &copy;{currentYear}
          
          {links.length > 0 && links.map((link, index) => (
            <React.Fragment key={link.href || index}>
              <span className="mx-1">|</span>
              <a 
                href={link.href} 
                className="text-tertiary hover:text-secondary"
                target={link.target || '_self'}
                rel={link.target === '_blank' ? 'noopener noreferrer' : link.rel}
              >
                {link.label}
              </a>
            </React.Fragment>
          ))}
        </p>
        
        {/* Render any additional content */}
        {children}
      </div>
    </footer>
  );
}

export default AppFooter; 