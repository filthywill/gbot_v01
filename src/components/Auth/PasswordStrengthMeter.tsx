import React from 'react';
import { cn } from '../../lib/utils';

export interface PasswordStrength {
  score: number;         // 0-4 where 4 is strongest
  feedback: string[];    // Array of suggestions to improve password
}

interface PasswordStrengthMeterProps {
  strength: PasswordStrength;
  className?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ 
  strength, 
  className = "" 
}) => {
  const { score, feedback } = strength;
  
  // Get the color based on password strength score
  const getStrengthColor = () => {
    switch (score) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-orange-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-lime-500';
      case 4: return 'bg-green-500';
      default: return 'bg-panel-light';
    }
  };
  
  // Get label text based on password strength score
  const getStrengthLabel = () => {
    switch (score) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return 'N/A';
    }
  };
  
  // Determine text color based on score
  const getTextColor = () => {
    switch (score) {
      case 0: 
      case 1: return 'text-red-700';
      case 2: return 'text-yellow-700';
      case 3: 
      case 4: return 'text-green-700';
      default: return 'text-primary';
    }
  };
  
  return (
    <div className={cn("mt-1 w-full", className)}>
      {/* Strength meter visualization */}
      <div className="h-1.5 w-full bg-panel-light rounded-full overflow-hidden transition-all duration-300">
        <div 
          className={cn("h-full transition-all duration-300", getStrengthColor())}
          style={{ width: `${(score + 1) * 20}%` }}
        />
      </div>
      
      {/* Strength label and score */}
      <div className="flex justify-between items-center mt-1">
        <p className={cn("text-xs font-medium", getTextColor())}>
          {getStrengthLabel()}
        </p>
        
        {/* Only show the tips toggle if we have feedback */}
        {feedback.length > 0 && (
          <button 
            type="button"
            className="text-xs text-secondary hover:text-primary hover:underline focus:outline-none"
            title="View password tips"
            aria-label="View password strength tips"
            onClick={(e) => {
              e.preventDefault();
              const tipsEl = e.currentTarget.parentElement?.nextElementSibling;
              if (tipsEl) {
                tipsEl.classList.toggle('hidden');
              }
            }}
          >
            Tips
          </button>
        )}
      </div>
      
      {/* Feedback suggestions (hidden by default) */}
      {feedback.length > 0 && (
        <div className="mt-2 hidden">
          <ul className="text-xs text-secondary space-y-1 pl-4 list-disc">
            {feedback.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter; 