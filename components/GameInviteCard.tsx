'use client';

import { Gamepad2, Trophy, ArrowRight } from 'lucide-react';
import { GAME_TYPES } from './GameOverlay';

interface GameInviteCardProps {
  gameType: string;
  roomId: string;
  launcherName: string;
  onJoin: () => void;
  invitedIds?: string[];
  currentUserId: string;
  isFinished?: boolean;
  isDark: boolean;
}

export default function GameInviteCard({ 
  gameType, 
  roomId, 
  launcherName, 
  onJoin, 
  invitedIds, 
  currentUserId, 
  isFinished, 
  isDark 
}: GameInviteCardProps) {
  const isInvited = !invitedIds || invitedIds.length === 0 || invitedIds.includes(currentUserId);
  if (!isInvited) return null;
  
  return (
    <div className={`mt-2 border rounded-3xl p-6 w-full max-w-[280px] shadow-xl overflow-hidden relative group ${isDark ? 'bg-[#141414] border-accent/20' : 'bg-white border-black/5'}`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#eaff96] to-transparent animate-pulse" />
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg shadow-accent/20 rotate-3 group-hover:rotate-0 transition-transform">
           <Gamepad2 size={24} />
        </div>
        <div>
          <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isDark ? 'text-accent' : 'text-lime-700'}`}>Game Invite</div>
          <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{GAME_TYPES[gameType as keyof typeof GAME_TYPES]?.name || 'New Game'}</div>
        </div>
      </div>
      <p className={`text-xs mb-5 font-medium leading-relaxed ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Challenge from <span className={isDark ? 'text-white font-bold' : 'text-gray-900 font-bold'}>{launcherName}</span>. {isFinished ? 'This game has ended.' : 'Ready to show your skills?'}</p>
      {isFinished ? (
        <div className="w-full py-3 bg-white/5 text-white/30 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-white/10">
          <Trophy size={12} /> Game Ended
        </div>
      ) : (
        <button 
          onClick={onJoin}
          className="w-full py-3 bg-[#eaff96] text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#eaff96]/10 flex items-center justify-center gap-2"
        >
          Join Game Now <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}
