import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { X, Check, Loader2, UserPlus } from 'lucide-react';

interface Props {
  currentUser: any;
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteMemberModal({ currentUser, groupId, onClose, onSuccess }: Props) {
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [existingMembers, setExistingMembers] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all profiles and existing members
    Promise.all([
      insforge.database.from('profiles').select('*').neq('id', currentUser.id),
      insforge.database.from('chat_group_members').select('user_id').eq('group_id', groupId)
    ]).then(([profilesRes, membersRes]) => {
      if (profilesRes.data) setFriends(profilesRes.data);
      if (membersRes.data) setExistingMembers(membersRes.data.map((m: any) => m.user_id));
    });
  }, [currentUser.id, groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setLoading(true);

    try {
      const members = selectedIds.map(uid => ({
        group_id: groupId,
        user_id: uid,
        is_admin: false
      }));
      await insforge.database.from('chat_group_members').insert(members);
      onSuccess();
    } catch (err: any) {
      alert("Failed to invite members: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inviteableFriends = friends.filter((f: any) => !existingMembers.includes(f.id));
  
  const filteredFriends = inviteableFriends.filter((f: any) => 
     (f.name || '').toLowerCase().includes(search.toLowerCase()) || 
     (f.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center"><UserPlus className="mr-3 text-[#eaff96]" size={24}/> Invite Members</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition">
             <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
           <form id="inviteMemberForm" onSubmit={handleSubmit} className="space-y-6 flex-1">
             <div>
                <div className="bg-[#1a1a1a] border border-white/5 rounded-xl flex flex-col overflow-hidden max-h-[40vh]">
                   <div className="p-3 border-b border-white/5">
                     <input 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-white/30"
                     />
                   </div>
                   <div className="overflow-y-auto p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                     {filteredFriends.map((f: any) => {
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
                       <div className="py-6 text-center text-white/30 text-sm">No new users to invite</div>
                     )}
                   </div>
                </div>
             </div>
           </form>
        </div>

        <div className="p-5 border-t border-white/5 shrink-0 flex justify-end">
           <button 
             form="inviteMemberForm"
             type="submit"
             disabled={loading || selectedIds.length === 0}
             className="px-6 py-3 rounded-full bg-[#eaff96] text-black font-bold text-sm tracking-wide disabled:opacity-50 hover:bg-white transition flex items-center"
           >
             {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
             Invite {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
           </button>
        </div>
      </div>
    </div>
  );
}
