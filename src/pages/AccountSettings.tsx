import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { Button } from '../components/ui';
import { supabase } from '../lib/supabase';
import { checkAuthSettings, verifyPasswordRequirements } from '../utils/authConfigCheck';
import PasswordStrengthMeter from '../components/Auth/PasswordStrengthMeter';
import { EyeIcon, EyeOffIcon, HomeIcon, ArrowLeftIcon } from 'lucide-react';
import useNotificationStore from '../store/useNotificationStore';
import { usePasswordManagement } from '../hooks/auth/usePasswordManagement';
import { AppHeader } from '../components/app';

const AccountSettings = () => {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Use the password management hook
  const passwordManagement = usePasswordManagement({ 
    userEmail: user?.email 
  });
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (data) {
          setUsername(data.username || '');
        }
      } catch (error) {
        console.error('Error in profile fetch:', error);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  // Check Supabase Auth settings on component mount
  useEffect(() => {
    const verifyAuthSettings = async () => {
      try {
        // Only run this in development or when specifically testing security
        if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_CHECK_AUTH_SETTINGS === 'true') {
          const settings = await checkAuthSettings();
          
          if (settings && settings.authSettings) {
            const result = verifyPasswordRequirements(settings.authSettings);
            
            if (!result.meetsRequirements) {
              console.warn('Password Requirement Mismatch:', result.recommendations);
              console.warn('App requirements:', result.appRequirements);
              console.warn('Supabase requirements:', result.supabaseRequirements);
            } else {
              console.log('Password requirements validated successfully');
            }
          }
        }
      } catch (error) {
        console.error('Error verifying auth settings:', error);
      }
    };
    
    verifyAuthSettings();
  }, []);
  
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      const updates = {
        id: user.id,
        username,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updates);
        
      if (error) throw error;
      
      addNotification({
        type: 'success',
        message: 'Profile updated successfully!'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification({
        type: 'error',
        message: 'Error updating profile.'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await passwordManagement.changePassword();
    
    if (success) {
      // Show success notification using global store
      addNotification({
        type: 'success',
        message: 'Password updated successfully!',
        duration: 10000, // Show for 10 seconds to ensure user sees it
        isPersistent: true, // Make this notification persist across page navigations
      });
    } else if (passwordManagement.passwordError) {
      // Show error notification
      addNotification({
        type: 'error',
        message: passwordManagement.passwordError,
        duration: 8000
      });
    }
  };
  
  const handleBackToApp = () => {
    (window as any).navigateTo('/');
  };
  
  return (
    <div className="min-h-screen bg-app text-primary">
      <AppHeader />
      
      <div className="max-w-[800px] mx-auto py-2 px-2 sm:px-3">
        {/* Breadcrumb Navigation */}
        <nav className="mb-2" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-secondary">
            <li>
              <button
                onClick={handleBackToApp}
                className="flex items-center hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-1 rounded-md px-1"
                aria-label="Go to home page"
              >
                <HomeIcon className="h-4 w-4 mr-1" />
                Home
              </button>
            </li>
            <li>/</li>
            <li className="text-primary font-medium">Account Settings</li>
          </ol>
        </nav>

        
        <div className="bg-container rounded-lg shadow-lg p-6 mb-2">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold mb-3">Profile Information</h2>
                        
            <div className="mb-4 max-w-md">
              <label className="block text-sm font-medium text-secondary mb-1">Email</label>
              <input 
                type="text" 
                value={user?.email || ''} 
                disabled 
                className="w-full px-3 py-2 bg-panel border border-app rounded-md text-secondary"
              />
              <p className="mt-1 text-xs text-secondary">Your email address cannot be changed.</p>
            </div>
            
            <form onSubmit={updateProfile}>
              <div className="mb-4 max-w-md">
                <label htmlFor="username" className="block text-sm font-medium text-secondary mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-app rounded-md text-primary 
                  focus:ring-1 focus:ring-brand-primary-500 focus:border-brand-primary-500 outline-none"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isSaving}
                className="mt-2"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>
        </div>
        
        {/* Password Change Section */}
        <div className="bg-container rounded-lg shadow-lg p-6 mb-6">
          
          <h2 className="text-xl font-semibold mb-3">Change Password</h2>
          <p className="text-secondary mb-4">Update your account password.</p>
          
          {passwordManagement.passwordChangeMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
              {passwordManagement.passwordChangeMessage}
            </div>
          )}
          
          <form onSubmit={handlePasswordChange}>
            <div className="mb-4 max-w-md">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-secondary mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={passwordManagement.showCurrentPassword ? 'text' : 'password'}
                  value={passwordManagement.currentPassword}
                  onChange={(e) => passwordManagement.setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-app border border-app rounded-md text-primary 
                  focus:ring-1 focus:ring-brand-primary-500 focus:border-brand-primary-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={passwordManagement.toggleCurrentPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-primary"
                >
                  {passwordManagement.showCurrentPassword ? (
                    <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="mb-2 max-w-md">
              <label htmlFor="newPassword" className="block text-sm font-medium text-secondary mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={passwordManagement.showNewPassword ? 'text' : 'password'}
                  value={passwordManagement.newPassword}
                  onChange={(e) => passwordManagement.setNewPassword(e.target.value)}
                  className={`w-full px-3 py-2 bg-app border rounded-md text-primary 
                  focus:ring-1 focus:outline-none ${
                    passwordManagement.newPassword ? 
                      (passwordManagement.passwordValid ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : 
                      'border-red-500 focus:border-red-500 focus:ring-red-500') : 
                      'border-app focus:border-brand-primary-500 focus:ring-brand-primary-500'
                  }`}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={passwordManagement.toggleNewPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-primary"
                >
                  {passwordManagement.showNewPassword ? (
                    <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              
              {/* Password strength meter */}
              {passwordManagement.newPassword && (
                <PasswordStrengthMeter strength={passwordManagement.passwordStrength} className="mt-2" />
              )}
              
              {/* Password hints button - shows requirements only when clicked */}
              {passwordManagement.newPassword && (
                <div className="mt-1">
                  <button
                    type="button"
                    className="text-xs text-secondary hover:text-primary hover:underline focus:outline-none"
                    onClick={(e) => {
                      e.preventDefault();
                      const requirementsEl = e.currentTarget.nextElementSibling;
                      if (requirementsEl) {
                        requirementsEl.classList.toggle('hidden');
                      }
                    }}
                  >
                    Password requirements
                  </button>
                  
                  {/* Hidden requirements list */}
                  <div className="hidden mt-2 text-xs p-3 bg-panel rounded-md border border-app">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <li className={passwordManagement.requirements.minLength ? "text-green-600" : "text-secondary"}>
                        {passwordManagement.requirements.minLength ? "✓" : "·"} At least 8 characters
                      </li>
                      <li className={passwordManagement.requirements.hasUppercase ? "text-green-600" : "text-secondary"}>
                        {passwordManagement.requirements.hasUppercase ? "✓" : "·"} At least one uppercase letter
                      </li>
                      <li className={passwordManagement.requirements.hasLowercase ? "text-green-600" : "text-secondary"}>
                        {passwordManagement.requirements.hasLowercase ? "✓" : "·"} At least one lowercase letter
                      </li>
                      <li className={passwordManagement.requirements.hasNumber ? "text-green-600" : "text-secondary"}>
                        {passwordManagement.requirements.hasNumber ? "✓" : "·"} At least one number
                      </li>
                      <li className={passwordManagement.requirements.hasSpecial ? "text-green-600" : "text-secondary"}>
                        {passwordManagement.requirements.hasSpecial ? "✓" : "·"} At least one special character
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-4 max-w-md">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={passwordManagement.showConfirmPassword ? 'text' : 'password'}
                  value={passwordManagement.confirmPassword}
                  onChange={(e) => passwordManagement.setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 bg-app border rounded-md text-primary 
                  focus:ring-1 focus:outline-none ${
                    passwordManagement.confirmPassword ? 
                      (passwordManagement.confirmValid ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : 
                      'border-red-500 focus:border-red-500 focus:ring-red-500') : 
                      'border-app focus:border-brand-primary-500 focus:ring-brand-primary-500'
                  }`}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={passwordManagement.toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-primary"
                >
                  {passwordManagement.showConfirmPassword ? (
                    <EyeOffIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {passwordManagement.confirmPassword && !passwordManagement.confirmValid && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={
                passwordManagement.isChangingPassword || 
                !passwordManagement.passwordValid || 
                !passwordManagement.confirmValid || 
                !passwordManagement.newPassword || 
                !passwordManagement.confirmPassword || 
                !passwordManagement.currentPassword
              }
              className={`mt-2 relative ${passwordManagement.isChangingPassword ? 'opacity-80' : ''}`}
            >
              {passwordManagement.isChangingPassword ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Changing Password...
                </span>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <Button
    onClick={handleBackToApp}
    className="w-[170px] inline-flex items-center justify-center p-2 rounded-lg border border-app 
             hover:bg-panel hover:border-brand-primary-300 transition-all duration-200
             focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-2"
  >
    <ArrowLeftIcon className="h-4 w-4 mr-2 text-primary"/>
    <span className="text-sm font-medium text-primary">
    Return to App</span>
  </Button>
  

        
        </div>
      </div>
    </div>
  );
};

export default AccountSettings; 