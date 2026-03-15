'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Trash2, Eye, Send, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { insforge } from '../lib/insforge';

// Duration each story slide shows (ms)
const STORY_DURATION = 5000;

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  caption?: string;
  created_at: string;
  profiles?: { name: string; username: string; avatar_url?: string };
}

interface StoryGroup {
  userId: string;
  profile: { name: string; username: string; avatar_url?: string };
  stories: Story[];
}

interface Props {
  storyGroups: StoryGroup[];        // All story groups ordered
  initialGroupIndex: number;        // Which user's stories to open first
  currentUser: any;
  onClose: () => void;
  onDeleted: (storyId: string) => void;
}

export default function StoryViewer({ storyGroups, initialGroupIndex, currentUser, onClose, onDeleted }: Props) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);          // 0–100 for current story
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const elapsedRef = useRef<number>(0);

  const group = storyGroups[groupIdx];
  const story = group?.stories[storyIdx];
  const isMyStory = story?.user_id === currentUser?.id;

  // ── Track view ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!story || !currentUser?.id || isMyStory) return;
    insforge.database.from('story_views').upsert([{
      story_id: story.id,
      viewer_id: currentUser.id,
      viewed_at: new Date().toISOString(),
    }], { onConflict: 'story_id,viewer_id' }).then(() => {});
  }, [story?.id]);

  // ── Load viewers (only for own stories) ─────────────────────────────────
  const loadViewers = useCallback(async () => {
    if (!story || !isMyStory) return;
    const { data } = await insforge.database
      .from('story_views')
      .select('viewer_id, viewed_at, profiles:viewer_id(name, username, avatar_url)')
      .eq('story_id', story.id)
      .order('viewed_at', { ascending: false });
    if (data) setViewers(data);
  }, [story?.id, isMyStory]);

  useEffect(() => {
    if (showViewers) loadViewers();
  }, [showViewers, loadViewers]);

  // ── Progress timer ───────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (progressRef.current) clearInterval(progressRef.current);
    startTimeRef.current = Date.now();

    progressRef.current = setInterval(() => {
      if (paused) return;
      const totalElapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
      const pct = Math.min((totalElapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(progressRef.current!);
        goNext();
      }
    }, 50);
  }, [paused]);

  useEffect(() => {
    elapsedRef.current = 0;
    setProgress(0);
    setShowViewers(false);
    setShowMenu(false);
    startTimer();
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [storyIdx, groupIdx]);

  const pauseTimer = () => {
    setPaused(true);
    elapsedRef.current += Date.now() - startTimeRef.current;
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const resumeTimer = () => {
    setPaused(false);
    startTimeRef.current = Date.now();
    startTimer();
  };

  // ── Navigation ───────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    const hasNextStory = storyIdx < (group?.stories.length ?? 0) - 1;
    if (hasNextStory) {
      setStoryIdx(s => s + 1);
    } else if (groupIdx < storyGroups.length - 1) {
      setGroupIdx(g => g + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [storyIdx, groupIdx, group, storyGroups, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(g => g - 1);
      setStoryIdx(storyGroups[groupIdx - 1].stories.length - 1);
    }
  }, [storyIdx, groupIdx, storyGroups]);

  // ── Delete story ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!story) return;
    if (!window.confirm('Delete this story?')) return;
    await insforge.database.from('user_stories').delete().eq('id', story.id);
    onDeleted(story.id);
    if (group.stories.length <= 1) {
      // No more stories in this group
      if (storyGroups.length <= 1) { onClose(); return; }
      const newGroupIdx = groupIdx > 0 ? groupIdx - 1 : 0;
      setGroupIdx(newGroupIdx);
      setStoryIdx(0);
    } else {
      const newIdx = Math.min(storyIdx, group.stories.length - 2);
      setStoryIdx(newIdx);
    }
    setShowMenu(false);
  };

  // ── Reply ────────────────────────────────────────────────────────────────
  const handleReply = async () => {
    if (!replyText.trim() || !story) return;
    const content = `📖 Reply to story: "${replyText.trim()}"`;
    await insforge.database.from('direct_messages').insert([{
      content,
      sender_id: currentUser.id,
      receiver_id: story.user_id,
    }]).select('*, profiles(name, username, avatar_url)').single().then(({ data }) => {
      if (data) insforge.realtime.publish(`chat:${story.user_id}`, 'new_message', data);
    });
    setReplyText('');
    // Brief visual feedback
    alert('Reply sent!');
  };

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, onClose]);

  if (!group || !story) return null;

  const storyAge = (Date.now() - new Date(story.created_at).getTime()) / 1000 / 3600; // hours

  return (
    <div className="fixed inset-0 z-[150] bg-black flex items-center justify-center" onClick={onClose}>

      {/* Side prev/next navigation zones (desktop) */}
      <button
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white z-20 transition-colors"
        onClick={e => { e.stopPropagation(); goPrev(); }}
      >
        <ChevronLeft size={24} />
      </button>
      <button
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white z-20 transition-colors"
        onClick={e => { e.stopPropagation(); goNext(); }}
      >
        <ChevronRight size={24} />
      </button>

      {/* Story Card */}
      <div
        className="relative w-full h-full max-w-[420px] max-h-[100dvh] md:max-h-[90vh] md:rounded-[2.5rem] overflow-hidden bg-[#111] shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
        onMouseDown={() => pauseTimer()}
        onMouseUp={() => resumeTimer()}
        onTouchStart={() => pauseTimer()}
        onTouchEnd={() => resumeTimer()}
      >
        {/* Media */}
        {story.media_url?.match(/\.(mp4|webm|mov)$/i) ? (
          <video
            key={story.id}
            src={story.media_url}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop={false}
            playsInline
          />
        ) : (
          <img
            key={story.id}
            src={story.media_url}
            className="absolute inset-0 w-full h-full object-cover"
            alt="story"
          />
        )}

        {/* Dark gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none" />

        {/* ── TOP: Progress bars + Header ──────────────────────────── */}
        <div className="relative z-10 px-3 pt-4 flex flex-col space-y-3">

          {/* Progress bars: one per story in this group */}
          <div className="flex space-x-1">
            {group.stories.map((s, i) => (
              <div key={s.id} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-none"
                  style={{
                    width: i < storyIdx ? '100%' : i === storyIdx ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full border-2 border-white/60 overflow-hidden bg-[#333] flex items-center justify-center shrink-0">
                {group.profile?.avatar_url
                  ? <img src={group.profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                  : <span className="text-white font-bold text-[15px]">{group.profile?.name?.[0]?.toUpperCase() || '?'}</span>
                }
              </div>
              <div>
                <div className="text-white font-bold text-[14px] leading-tight">
                  {group.profile?.name || (group.profile?.username ? `@${group.profile.username}` : 'User')}
                </div>
                <div className="text-white/60 text-[11px]">
                  {formatStoryAge(story.created_at)}
                  {storyAge >= 24 && <span className="ml-1 text-red-400 font-bold">· Expired</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* My-story options */}
              {isMyStory && (
                <button
                  onClick={() => { setShowMenu(!showMenu); setShowViewers(false); }}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
              )}
              {/* Close */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* My-story drop-down menu */}
        {showMenu && isMyStory && (
          <div className="absolute top-[96px] right-3 z-30 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden w-44 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => { setShowMenu(false); setShowViewers(true); loadViewers(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors text-left"
            >
              <Eye size={15} className="text-[#eaff96]" /> View Viewers
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left border-t border-white/5"
            >
              <Trash2 size={15} /> Delete Story
            </button>
          </div>
        )}

        {/* Tap zones for mobile navigation */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={goPrev} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={goNext} />

        {/* ── Caption ─────────────────────────────────────────────── */}
        {story.caption && (
          <div className="absolute left-4 right-4 bottom-28 z-10">
            <p className="text-white text-[15px] font-medium leading-snug drop-shadow-lg text-center bg-black/30 backdrop-blur-sm rounded-2xl px-4 py-3">
              {story.caption}
            </p>
          </div>
        )}

        {/* ── BOTTOM AREA ──────────────────────────────────────────── */}
        <div className="absolute bottom-0 inset-x-0 z-20 px-4 pb-6 pt-4">

          {/* Viewer count (own story shortcut) */}
          {isMyStory && (
            <button
              onClick={() => { setShowViewers(!showViewers); if (!showViewers) loadViewers(); }}
              className="flex items-center gap-2 mb-3 text-white/70 hover:text-white transition-colors"
            >
              <Eye size={16} />
              <span className="text-[13px] font-semibold">{viewers.length > 0 ? `${viewers.length} viewer${viewers.length > 1 ? 's' : ''}` : 'No views yet'}</span>
            </button>
          )}

          {/* Reply input (other's stories only) */}
          {!isMyStory && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') handleReply(); }}
                onFocus={() => pauseTimer()}
                onBlur={() => resumeTimer()}
                placeholder={`Reply to ${group.profile?.name?.split(' ')[0] || 'story'}...`}
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-full px-5 py-3 text-[14px] focus:outline-none focus:bg-white/15 focus:border-white/30 backdrop-blur-md transition-all"
              />
              {replyText.trim() && (
                <button
                  onClick={handleReply}
                  className="w-12 h-12 rounded-full bg-[#eaff96] text-black flex items-center justify-center shrink-0 hover:scale-105 transition-transform shadow-lg"
                >
                  <Send size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── VIEWERS PANEL (slide up) ──────────────────────────────── */}
        {showViewers && isMyStory && (
          <div
            className="absolute inset-x-0 bottom-0 z-30 bg-[#111]/97 backdrop-blur-2xl border-t border-white/10 rounded-t-[2rem] shadow-[0_-20px_60px_rgba(0,0,0,0.7)] flex flex-col animate-in slide-in-from-bottom duration-200"
            style={{ maxHeight: '60%' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={() => setShowViewers(false)}>
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="px-5 pb-3 pt-1 flex items-center justify-between border-b border-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-[#eaff96]" />
                <span className="font-bold text-white text-[15px]">Viewed by</span>
              </div>
              <span className="text-white/40 text-[13px]">{viewers.length}</span>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-1">
              {viewers.length === 0 ? (
                <div className="text-center text-white/30 text-sm py-8">
                  No one has viewed this story yet
                </div>
              ) : viewers.map((v: any, i: number) => {
                const prof = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5 px-1 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center font-bold text-sm border border-white/5 overflow-hidden shrink-0">
                      {prof?.avatar_url
                        ? <img src={prof.avatar_url} className="w-full h-full object-cover" alt={prof?.name} />
                        : <span>{prof?.name?.[0]?.toUpperCase() || '?'}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white/90 text-[14px] truncate">{prof?.name || (prof?.username ? `@${prof.username}` : 'User')}</div>
                      <div className="text-[11px] text-white/40">{formatStoryAge(v.viewed_at)}</div>
                    </div>
                    <Eye size={14} className="text-white/20 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper
function formatStoryAge(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
