import React, { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import AuthModal from './AuthModal';

const AuthHeader: React.FC = () => {
  const { user, isAuthenticated, signOut } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <div className="flex items-center">
      {isAuthenticated ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm hidden md:inline">
            {user?.email}
          </span>
          <button
            onClick={() => signOut()}
            className="px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
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