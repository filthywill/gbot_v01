import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { Button } from '../components/ui';
import { supabase } from '../lib/supabase';

const AccountSettings = () => {
  const { user } = useAuthStore();
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, website')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          return;
        }
        
        if (data) {
          setUsername(data.username || '');
          setWebsite(data.website || '');
        }
      } catch (error) {
        console.error('Error in profile fetch:', error);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      const updates = {
        id: user.id,
        username,
        website,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .upsert(updates);
        
      if (error) throw error;
      
      setSaveMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage('Error updating profile.');
    } finally {
      setIsSaving(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        if (setSaveMessage) setSaveMessage('');
      }, 3000);
    }
  };
  
  return (
    <div className="container mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Profile Information</h2>
          <p className="text-gray-600 mb-4">Update your account profile information.</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="text" 
              value={user?.email || ''} 
              disabled 
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600"
            />
            <p className="mt-1 text-sm text-gray-500">Your email address cannot be changed.</p>
          </div>
          
          <form onSubmit={updateProfile}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://example.com"
              />
            </div>
            
            {saveMessage && (
              <div className={`mb-4 p-3 rounded-md ${saveMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {saveMessage}
              </div>
            )}
            
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings; 