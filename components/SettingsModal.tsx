import React, { useState, useRef, useEffect } from 'react';
import { X, Shield, Eye, Lock, Bell, CheckCircle2, User, Loader2, Save } from 'lucide-react';
import { insforge } from '@/lib/insforge';

interface Props {
  onClose: () => void;
  currentUser?: any;
}

const DEFAULT_SETTINGS = {
  lastSeen: 'Everyone',
  profilePhoto: 'My Contacts',
  readReceipts: true,
  addedToGroups: 'Everyone',
  pushNotifications: true,
  emailAlerts: false,
};

export default function SettingsModal({ onClose, currentUser }: Props) {
  const [activeTab, setActiveTab] = useState('privacy');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedBadge, setSavedBadge] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [privacySettings, setPrivacySettings] = useState(DEFAULT_SETTINGS);

  // Load existing settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser?.id) { setIsLoading(false); return; }
      try {
        const { data } = await insforge.database
          .from('user_settings')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        if (data?.settings) {
          setPrivacySettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
      } catch {
        // Table may not exist or row doesn't exist yet — use defaults
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [currentUser?.id]);

  const handleSave = async () => {
    if (!currentUser?.id) { onClose(); return; }
    setIsSaving(true);
    try {
      // Upsert into user_settings table
      await insforge.database
        .from('user_settings')
        .upsert([{ user_id: currentUser.id, settings: privacySettings, updated_at: new Date().toISOString() }], { onConflict: 'user_id' });

      // Apply push notification setting
      if (privacySettings.pushNotifications && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }

      setSavedBadge(true);
      setTimeout(() => { setSavedBadge(false); onClose(); }, 900);
    } catch (err: any) {
      // Graceful fallback: save to localStorage if DB table doesn't exist
      try {
        localStorage.setItem(`chatify_settings_${currentUser.id}`, JSON.stringify(privacySettings));
      } catch {}
      setSavedBadge(true);
      setTimeout(() => { setSavedBadge(false); onClose(); }, 900);
    } finally {
      setIsSaving(false);
    }
  };

  // Also load from localStorage as fallback
  useEffect(() => {
    if (!isLoading || !currentUser?.id) return;
    try {
      const local = localStorage.getItem(`chatify_settings_${currentUser.id}`);
      if (local) {
        const parsed = JSON.parse(local);
        setPrivacySettings(prev => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, [currentUser?.id, isLoading]);

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;
    setIsUploading(true);
    try {
      const { data, error } = await insforge.storage.from('chat-attachments').uploadAuto(file);
      if (error) throw error;
      if (data?.url) {
        await insforge.database.from('profiles').update({ avatar_url: data.url }).eq('id', currentUser.id);
        alert('Profile picture updated! Reload the page to see changes everywhere.');
      }
    } catch (err: any) {
      alert('Failed to update profile picture: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl flex overflow-hidden shadow-2xl h-[600px] max-h-[90vh]">
        
        {/* Left Sidebar Menu */}
        <div className="w-64 bg-[#161616] border-r border-white/5 flex flex-col pt-6 pb-4 shrink-0">
          <h2 className="text-xl font-bold text-white px-6 mb-8">Settings</h2>
          <div className="flex-1 space-y-1 px-3">
            {[
              { id: 'privacy', icon: <Shield size={18}/>, label: 'Privacy & Security' },
              { id: 'notifications', icon: <Bell size={18}/>, label: 'Notifications' },
              { id: 'account', icon: <Lock size={18}/>, label: 'Account' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium text-[15px] ${
                  activeTab === tab.id ? 'bg-[#eaff96] text-black shadow-md shadow-[#eaff96]/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto relative flex flex-col bg-[#0a0a0a]">
          <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition z-10">
            <X size={18} />
          </button>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin text-white/30" />
            </div>
          ) : (
            <div className="p-10 flex-1">
              {activeTab === 'privacy' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in">
                  <div className="flex items-center space-x-3 text-[#eaff96] mb-2">
                    <Eye size={24} />
                    <h3 className="text-2xl font-black tracking-tight text-white">Privacy</h3>
                  </div>
                  <p className="text-white/40 text-sm">Control who can see your activity and interact with you.</p>
                  
                  <div className="space-y-6 mt-8">
                    {/* Last Seen */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div>
                        <div className="font-bold text-white mb-1">Last Seen & Online</div>
                        <div className="text-sm text-white/40">Who can see when you were last active</div>
                      </div>
                      <select
                        value={privacySettings.lastSeen}
                        onChange={(e) => setPrivacySettings({...privacySettings, lastSeen: e.target.value})}
                        className="bg-[#1a1a1a] border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#eaff96] cursor-pointer"
                      >
                        <option>Everyone</option>
                        <option>My Contacts</option>
                        <option>Nobody</option>
                      </select>
                    </div>

                    {/* Profile Photo */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div>
                        <div className="font-bold text-white mb-1">Profile Photo</div>
                        <div className="text-sm text-white/40">Who can view your profile picture</div>
                      </div>
                      <select
                        value={privacySettings.profilePhoto}
                        onChange={(e) => setPrivacySettings({...privacySettings, profilePhoto: e.target.value})}
                        className="bg-[#1a1a1a] border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#eaff96] cursor-pointer"
                      >
                        <option>Everyone</option>
                        <option>My Contacts</option>
                        <option>Nobody</option>
                      </select>
                    </div>

                    {/* Read Receipts */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div>
                        <div className="font-bold text-white mb-1">Read Receipts</div>
                        <div className="text-sm text-white/40">If turned off, you won't send or receive read receipts</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={privacySettings.readReceipts} onChange={(e) => setPrivacySettings({...privacySettings, readReceipts: e.target.checked})} />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#eaff96]"></div>
                      </label>
                    </div>

                    {/* Added to Groups */}
                    <div className="flex items-center justify-between pb-2">
                      <div>
                        <div className="font-bold text-white mb-1">Added to Groups</div>
                        <div className="text-sm text-white/40">Who can add you to group conversations</div>
                      </div>
                      <select
                        value={privacySettings.addedToGroups}
                        onChange={(e) => setPrivacySettings({...privacySettings, addedToGroups: e.target.value})}
                        className="bg-[#1a1a1a] border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#eaff96] cursor-pointer"
                      >
                        <option>Everyone</option>
                        <option>My Contacts</option>
                        <option>Nobody</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in">
                  <div className="flex items-center space-x-3 text-[#eaff96] mb-2">
                    <Bell size={24} />
                    <h3 className="text-2xl font-black tracking-tight text-white">Notifications</h3>
                  </div>
                  <p className="text-white/40 text-sm">Manage how and when you want to receive alerts.</p>
                  
                  <div className="space-y-6 mt-8">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div>
                        <div className="font-bold text-white mb-1">Push Notifications</div>
                        <div className="text-sm text-white/40">Receive browser alerts for new messages</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={privacySettings.pushNotifications} onChange={(e) => setPrivacySettings({...privacySettings, pushNotifications: e.target.checked})} />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#eaff96]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div>
                        <div className="font-bold text-white mb-1">Email Alerts</div>
                        <div className="text-sm text-white/40">Get missed messages sent to your email</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={privacySettings.emailAlerts} onChange={(e) => setPrivacySettings({...privacySettings, emailAlerts: e.target.checked})} />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#eaff96]"></div>
                      </label>
                    </div>

                    <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/5 text-sm text-white/50 leading-relaxed">
                      <span className="text-[#eaff96] font-bold">Support:</span> For help with notifications, contact us at{' '}
                      <a href="mailto:supportatchatify@gmail.com" className="text-blue-400 hover:underline">
                        supportatchatify@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'account' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in">
                  <div className="flex items-center space-x-3 text-[#eaff96] mb-2">
                    <Lock size={24} />
                    <h3 className="text-2xl font-black tracking-tight text-white">Account</h3>
                  </div>
                  <p className="text-white/40 text-sm">Manage your security and identity verification.</p>
                  
                  <div className="space-y-6 mt-8">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div>
                        <div className="font-bold text-white mb-1">Profile Picture</div>
                        <div className="text-sm text-white/40">Upload a custom profile avatar</div>
                      </div>
                      <div className="flex items-center">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfileUpload} />
                        <button disabled={isUploading} onClick={() => fileInputRef.current?.click()} className="px-5 py-2 rounded-xl bg-[#1a1a1a] text-white/80 hover:text-white hover:bg-white/10 border border-white/10 transition-colors text-sm font-semibold flex items-center">
                          {isUploading ? <Loader2 size={16} className="animate-spin mr-2"/> : <User size={16} className="mr-2"/>}
                          {isUploading ? 'Uploading...' : 'Set Picture'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div>
                        <div className="font-bold text-white mb-1">Two-Step Verification</div>
                        <div className="text-sm text-white/40">Add an extra layer of security to your account</div>
                      </div>
                      <button className="px-5 py-2 rounded-xl bg-[#1a1a1a] text-white/80 hover:text-white hover:bg-white/10 border border-white/10 transition-colors text-sm font-semibold">Enable</button>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                      <div>
                        <div className="font-bold text-white mb-1">Account Verification</div>
                        <div className="text-sm text-white/40">Get the verified checkmark next to your name</div>
                      </div>
                      <button className="px-5 py-2 rounded-xl bg-[#eaff96] text-black hover:bg-white transition-colors text-sm font-bold shadow-md">Get Verified</button>
                    </div>

                    <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/5">
                      <div className="text-white/50 text-sm">
                        <span className="font-bold text-white/70">Email (Private):</span>{' '}
                        {currentUser?.email || '—'}
                      </div>
                      <div className="text-white/30 text-xs mt-2">
                        Need help? Contact{' '}
                        <a href="mailto:supportatchatify@gmail.com" className="text-blue-400 hover:underline">
                          supportatchatify@gmail.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-6 border-t border-white/5 bg-[#0d0d0d] flex justify-between items-center shrink-0">
            <span className={`text-sm font-semibold transition-all ${savedBadge ? 'text-[#eaff96] opacity-100' : 'opacity-0'}`}>
              ✓ Preferences saved!
            </span>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-8 py-3 bg-[#eaff96] hover:bg-white text-black font-bold rounded-full transition-colors flex items-center shadow-lg shadow-[#eaff96]/10 disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
