'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Check, Loader2, LogOut, User, AtSign, FileText, Mail, Shield, Edit3, ChevronRight, MessageSquare } from 'lucide-react';
import { insforge } from '../lib/insforge';
import ZoomedImageModal from './ZoomedImageModal';

interface ProfilePanelProps {
  session: any;
  onClose: () => void;
  onSignOut: () => void;
  onGoToChat: () => void;
  onProfileUpdate?: (profileData: any) => void;
}

export default function ProfilePanel({ session, onClose, onSignOut, onGoToChat, onProfileUpdate }: ProfilePanelProps) {
  const user = session?.user;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    insforge.database
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setName(data.name || '');
          setUsername(data.username || '');
          setBio(data.bio || '');
        }
        setLoading(false);
      });
  }, [user?.id]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      errs.username = 'Username: 3–20 chars, only letters, numbers, underscores';
    }
    if (bio && bio.length > 160) errs.bio = 'Bio must be under 160 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user?.id) return;
    setSaving(true);
    try {
      const updatedProfile = { name: name.trim(), username: username.trim() || null, bio: bio.trim() || null };
      await insforge.database
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);
      
      const newProfileState = { ...profile, ...updatedProfile };
      setProfile(newProfileState);
      onProfileUpdate?.(newProfileState);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploadingAvatar(true);
    try {
      const { data, error } = await insforge.storage.from('avatars').uploadAuto(file);
      if (error) throw error;
      if (data?.url) {
        await insforge.database.from('profiles').update({ avatar_url: data.url }).eq('id', user.id);
        const newProfileState = { ...profile, avatar_url: data.url };
        setProfile(newProfileState);
        onProfileUpdate?.(newProfileState);
      }
    } catch (err: any) {
      alert('Avatar upload failed: ' + err.message);
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSignOut = async () => {
    await insforge.auth.signOut();
    localStorage.removeItem('chatRemember');
    onSignOut();
  };

  const initials = (name || profile?.username || '?')[0]?.toUpperCase();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl w-full max-w-md shadow-2xl shadow-black/60 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-[#eaff96]/20 via-[#111] to-[#0a0a0a] flex items-end px-6 pb-0">
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          </div>
          {/* Avatar */}
          <div className="relative -mb-10">
            <div className="w-20 h-20 rounded-full border-4 border-[#0f0f0f] bg-[#1e1e1e] overflow-hidden flex items-center justify-center text-2xl font-black text-white shadow-xl">
              {profile?.avatar_url
                ? <img 
                    src={profile.avatar_url} 
                    className="w-full h-full object-cover cursor-zoom-in" 
                    alt="avatar" 
                    onClick={() => setZoomedImage(profile.avatar_url)}
                  />
                : initials
              }
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#eaff96] flex items-center justify-center text-black shadow-lg hover:bg-white transition-colors border-2 border-[#0f0f0f]"
            >
              {uploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-14 pb-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-white/30" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Email (read-only) */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                <Mail size={16} className="text-white/30 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-0.5">Email (Private)</div>
                  <div className="text-[14px] text-white/50 truncate">{user?.email}</div>
                </div>
                <Shield size={14} className="text-white/20 shrink-0" />
              </div>

              {/* Name */}
              <div>
                <div className="relative">
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your display name"
                    maxLength={40}
                    className={`w-full bg-[#1a1a1a] border rounded-2xl pl-10 pr-4 py-3 text-white text-[14px] focus:outline-none placeholder:text-white/25 transition-colors ${
                      errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#eaff96]/50'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-red-400 text-[11px] mt-1 pl-2">{errors.name}</p>}
              </div>

              {/* Username */}
              <div>
                <div className="relative">
                  <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    maxLength={20}
                    className={`w-full bg-[#1a1a1a] border rounded-2xl pl-10 pr-4 py-3 text-white text-[14px] focus:outline-none placeholder:text-white/25 transition-colors ${
                      errors.username ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#eaff96]/50'
                    }`}
                  />
                </div>
                {errors.username && <p className="text-red-400 text-[11px] mt-1 pl-2">{errors.username}</p>}
              </div>

              {/* Bio */}
              <div>
                <div className="relative">
                  <FileText size={15} className="absolute left-4 top-3.5 text-white/30" />
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="About you... (optional)"
                    maxLength={160}
                    rows={3}
                    className={`w-full bg-[#1a1a1a] border rounded-2xl pl-10 pr-4 py-3 text-white text-[14px] focus:outline-none placeholder:text-white/25 transition-colors resize-none ${
                      errors.bio ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-[#eaff96]/50'
                    }`}
                  />
                </div>
                <div className="text-right text-[10px] text-white/20 mt-0.5 pr-1">{bio.length}/160</div>
                {errors.bio && <p className="text-red-400 text-[11px] mt-0.5 pl-2">{errors.bio}</p>}
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-[#eaff96] text-black font-bold text-[15px] hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[#eaff96]/10"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : saveSuccess ? <Check size={16} /> : <Edit3 size={16} />}
                {saving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save Profile'}
              </button>

              {/* Divider */}
              <div className="border-t border-white/5 pt-3 space-y-2">
                {/* Go to Chat */}
                <button
                  onClick={() => { onClose(); onGoToChat(); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3 text-white/70 group-hover:text-white transition-colors">
                    <MessageSquare size={16} />
                    <span className="text-[14px] font-semibold">Go to Messages</span>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </button>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="text-[14px] font-semibold">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {zoomedImage && (
        <ZoomedImageModal 
          imageUrl={zoomedImage} 
          onClose={() => setZoomedImage(null)} 
        />
      )}
    </div>
  );
}
