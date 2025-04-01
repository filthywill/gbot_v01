import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import AuthModal from './AuthModal';
import { cn } from '../../lib/utils';

const AuthHeader: React.FC = () => {
  const { user, isAuthenticated, signOut } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div className="flex items-center">
      {isAuthenticated ? (
        <div className="flex items-center space-x-3">
          <span className="text-sm text-zinc-400 hidden md:inline">
            {user?.email}
          </span>
          <button
            onClick={() => signOut()}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md",
              "bg-zinc-800 text-zinc-300 border border-zinc-700",
              "hover:bg-zinc-700 hover:border-zinc-600",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            )}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-md",
              "bg-indigo-600 text-white",
              "hover:bg-indigo-700",
              "transition-all duration-200 ease-in-out",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
            )}
          >
            Sign In
          </button>
          <AuthModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
          />
        </div>
      )}
    </div>
  );
};

export default AuthHeader; 