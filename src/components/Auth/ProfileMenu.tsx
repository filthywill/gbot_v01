import React, { useState, useRef, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { cn } from '../../lib/utils';
import { LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import Avatar from './Avatar';

interface ProfileMenuProps {
  user: User;
  onSignOut: () => Promise<void>;
}

const ProfileMenu: React.FC<ProfileMenuProps> = React.memo(({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside of the menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Add event listener when menu is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSignOut = async () => {
    await onSignOut();
    setIsOpen(false);
  };

  const handleAccountSettings = () => {
    (window as any).navigateTo('/account-settings');
    setIsOpen(false);
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Email Display - Username only */}
      <span className="text-sm text-zinc-300 max-w-[100px] truncate">
        {user.email?.split('@')[0] || 'User'}
      </span>

      {/* Profile Menu */}
      <div className="relative" ref={menuRef}>
        {/* Avatar Menu Button - Using Avatar component as the button */}
        <Avatar 
          user={user} 
          size="sm" 
          isClickable={true}
          onClick={toggleMenu}
          aria-label="Open user menu"
          aria-expanded={isOpen}
        />

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className={cn(
              "absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md",
              "bg-zinc-800 border border-zinc-700 shadow-lg",
              "divide-y divide-zinc-700"
            )}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu"
          >
            {/* User Info Section */}
            <div className="px-4 py-3 flex items-center space-x-3">
              <Avatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-400">Signed in as</p>
                <p className="text-sm font-medium text-zinc-200 truncate">{user.email}</p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={handleAccountSettings}
                className={cn(
                  "w-full flex items-center px-4 py-2 text-sm text-zinc-300",
                  "hover:bg-zinc-700 hover:text-white transition-colors duration-150 text-left"
                )}
                role="menuitem"
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Account Settings
              </button>
            </div>

            {/* Sign Out Option */}
            <div className="py-1">
              <button
                onClick={handleSignOut}
                className={cn(
                  "w-full flex items-center px-4 py-2 text-sm text-zinc-300",
                  "hover:bg-zinc-700 hover:text-white transition-colors duration-150 text-left"
                )}
                role="menuitem"
              >
                <LogOutIcon className="h-4 w-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ProfileMenu.displayName = 'ProfileMenu';

export default ProfileMenu; 