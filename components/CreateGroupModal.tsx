import React, { useState, useEffect, useRef } from 'react';
import { insforge } from '../lib/insforge';
import { X, Upload, Check, Loader2, Users } from 'lucide-react';

interface Props {
  currentUser: any;
  onClose: () => void;
  onSuccess: (newGroup: any) => void;
}

export default function CreateGroupModal({ currentUser, onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch all profiles for simplicity
    insforge.database.from('profiles').select('*').neq('id', currentUser.id).then(({data}) => {
       if (data) setFriends(data);
    });
  }, [currentUser.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      let avatarUrl = '';
      if (avatarFile) {
        const { data: uploadData } = await insforge.storage.from('group-avatars').uploadAuto(avatarFile);
        if (uploadData) avatarUrl = uploadData.url;
      }

      // Create group
      const { data: groupData, error } = await insforge.database.from('chat_groups').insert([{
        name: name.trim(),
        description: description.trim(),
        avatar_url: avatarUrl || null,
        creator_id: currentUser.id
      }]).select().single();

      if (error) throw error;
      if (groupData) {
        // Add members + creator
        const members = [
          { group_id: groupData.id, user_id: currentUser.id, is_admin: true },
          ...selectedIds.map(uid => ({
            group_id: groupData.id,
            user_id: uid,
            is_admin: false
          }))
        ];
        await insforge.database.from('chat_group_members').insert(members);
        onSuccess(groupData);
      }
    } catch (err: any) {
      alert("Failed to create group: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(f => 
     (f.name || '').toLowerCase().includes(search.toLowerCase()) || 
     (f.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center"><Users className="mr-3 text-[#eaff96]" size={24}/> New Group</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition">
             <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
           <form id="createGroupForm" onSubmit={handleSubmit} className="space-y-6 flex-1">
             
             {/* Avatar Box */}
             <div className="flex flex-col items-center">
               <div 
                 onClick={() => fileRef.current?.click()}
                 className={`w-24 h-24 rounded-full border-2 border-dashed ${avatarPreview ? 'border-transparent' : 'border-white/20'} flex items-center justify-center bg-[#1a1a1a] cursor-pointer hover:bg-[#222] transition relative overflow-hidden group`}
               >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload size={24} className="text-white/30 group-hover:text-white/60 transition" />
                  )}
                  <div className="absolute inset-0 bg-black/50 items-center justify-center hidden group-hover:flex">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Upload</span>
                  </div>
               </div>
               <input type="file" ref={fileRef} accept="image/*" onChange={handleFileChange} className="hidden" />
             </div>

             {/* Name */}
             <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">Group Name *</label>
                <input 
                  autoFocus
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-white/20 focus:outline-none placeholder:text-white/20"
                  placeholder="E.g. Squad Goals"
                />
             </div>

             {/* Description */}
             <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">Description</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-white focus:border-white/20 focus:outline-none placeholder:text-white/20 resize-none h-20"
                  placeholder="What's this group about?"
                />
             </div>

             {/* Add Members */}
             <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 flex justify-between">
                   <span>Add Members</span>
                   <span className="text-[#eaff96]">{selectedIds.length} Selected</span>
                </label>
                <div className="bg-[#1a1a1a] border border-white/5 rounded-xl flex flex-col overflow-hidden max-h-60">
                   <div className="p-3 border-b border-white/5">
                     <input 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search friends..."
                        className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-white/30"
                     />
                   </div>
                   <div className="overflow-y-auto p-2 scrollbar-hide">
                     {filteredFriends.map(f => {
                       const isSelected = selectedIds.includes(f.id);
                       return (
                         <div 
                           key={f.id} 
                           onClick={() => {
                             if (isSelected) setSelectedIds(selectedIds.filter(id => id !== f.id));
                             else setSelectedIds([...selectedIds, f.id]);
                           }}
                           className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition"
                         >
                            <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center font-bold text-xs text-white border border-white/5 shrink-0">
                               {f.name?.[0]?.toUpperCase() || f.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="font-semibold text-white/90 text-sm truncate">{f.name || `@${f.username}`}</div>
                               <div className="text-[11px] text-white/40 truncate">@{f.username}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#eaff96] border-[#eaff96]' : 'border-white/20'}`}>
                               {isSelected && <Check size={12} className="text-black" />}
                            </div>
                         </div>
                       )
                     })}
                     {filteredFriends.length === 0 && (
                       <div className="py-6 text-center text-white/30 text-sm">No users found</div>
                     )}
                   </div>
                </div>
             </div>
           </form>
        </div>

        <div className="p-5 border-t border-white/5 shrink-0 flex justify-end">
           <button 
             form="createGroupForm"
             type="submit"
             disabled={loading || !name.trim()}
             className="px-6 py-3 rounded-full bg-[#eaff96] text-black font-bold text-sm tracking-wide disabled:opacity-50 hover:bg-white transition flex items-center"
           >
             {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
             Create Group
           </button>
        </div>
      </div>
    </div>
  );
}
