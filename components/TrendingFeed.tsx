'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bookmark, Share2, Bot, ExternalLink, ChevronUp, ChevronDown, RefreshCw, X, Send, Check, MessageSquare, Users } from 'lucide-react';
import { insforge } from '@/lib/insforge';

export const CATEGORIES = [
  'All', 'Sports', 'Movies', 'News', 'Geopolitics', 'Web Series',
  'Technology', 'Finance', 'Gaming', 'Entertainment', 'Others'
];

interface TrendingContent {
  id: string;
  title: string;
  description: string;
  category: string;
  media_url: string;
  media_type: string;
  source_name: string;
  source_url: string;
  created_at: string;
  popularity_score: number;
}

export default function TrendingFeed({ 
  currentUser, 
  onShare, 
  recentChats,
  groups,
  initialContentId
}: { 
  currentUser: any; 
  onShare: (contentId: string, targetType: 'user' | 'group', targetData: any) => void;
  recentChats?: any[];
  groups?: any[];
  initialContentId?: string;
}) {
  const [items, setItems] = useState<TrendingContent[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Bookmarks state
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);

  // Share panel state
  const [shareItemId, setShareItemId] = useState<string | null>(null);
  const [shareTab, setShareTab] = useState<'chats' | 'groups'>('chats');
  const [shareSentTo, setShareSentTo] = useState<string | null>(null);
  
  // Chatbot State
  const [activeChatbotId, setActiveChatbotId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{role: string, text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current.forEach((v, idx) => {
       if (!v) return;
       if (idx === activeIndex) {
          v.play().catch(() => {});
       } else {
          v.pause();
          v.currentTime = 0;
       }
    });
  }, [activeIndex, items]);

  useEffect(() => {
    fetchFeed();
    fetchBookmarks();
  }, [activeCategory]);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/trending/feed', window.location.origin);
      if (currentUser?.id) url.searchParams.set('userId', currentUser.id);
      if (activeCategory !== 'All') url.searchParams.set('category', activeCategory);
      
      const res = await fetch(url.toString());
      const data = await res.json();
      const feed = data.feed || [];
      setItems(feed);

      // Handle deep-linking
      if (initialContentId) {
         const idx = feed.findIndex((item: any) => item.id === initialContentId);
         if (idx !== -1) {
            setActiveIndex(idx);
            setTimeout(() => {
               itemRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
         } else {
            setActiveIndex(0);
         }
      } else {
         setActiveIndex(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBookmarks = async () => {
    if (!currentUser?.id) return;
    const { data } = await insforge.database
      .from('trending_bookmarks')
      .select('content_id')
      .eq('user_id', currentUser.id);
    if (data) {
      setBookmarkedIds(new Set(data.map((b: any) => b.content_id)));
    }
  };

  const syncTrending = async () => {
    setSyncing(true);
    try {
      await fetch('/api/trending/sync', { method: 'POST' });
      await fetchFeed();
    } catch (e) { }
    setSyncing(false);
  };

  // Setup Intersection Observer for scroll tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveIndex(index);
          }
        });
      },
      { threshold: 0.6 }
    );

    itemRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [items]);

  // Track viewing time and views
  useEffect(() => {
    if (!items.length || !currentUser?.id) return;
    
    const startTime = Date.now();
    const activeItem = items[activeIndex];

    return () => {
      const watchTime = (Date.now() - startTime) / 1000;
      if (watchTime > 2) {
        fetch('/api/trending/track', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
             userId: currentUser.id,
             contentId: activeItem.id,
             actionType: 'view',
             watchTime,
             category: activeItem.category
          })
        });
      }
    };
  }, [activeIndex, items, currentUser?.id]);

  const handleBookmark = async (content: TrendingContent) => {
    if (!currentUser?.id || bookmarkingId === content.id) return;
    setBookmarkingId(content.id);
    
    const isBookmarked = bookmarkedIds.has(content.id);
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        await insforge.database
          .from('trending_bookmarks')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('content_id', content.id);
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.delete(content.id);
          return next;
        });
      } else {
        // Add bookmark
        await insforge.database
          .from('trending_bookmarks')
          .insert([{ user_id: currentUser.id, content_id: content.id }]);
        setBookmarkedIds(prev => new Set([...prev, content.id]));
      }

      // Track action
      if (currentUser?.id) {
        await fetch('/api/trending/track', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
             userId: currentUser.id,
             contentId: content.id,
             actionType: 'bookmark',
             category: content.category
          })
        });
      }
    } catch (e) {
      console.error('Bookmark error', e);
    }
    setBookmarkingId(null);
  };

  const handleShareToTarget = (contentId: string, type: 'user' | 'group', targetData: any) => {
    onShare(contentId, type, targetData);
    setShareSentTo(targetData.id);
    setTimeout(() => {
      setShareSentTo(null);
      setShareItemId(null);
    }, 1500);
  };

  const handleChatbotSubmit = async (e: React.FormEvent, content: TrendingContent, forceMessage?: string) => {
    e.preventDefault();
    const userMsg = (forceMessage || chatInput).trim();
    if (!userMsg) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsBotTyping(true);

    try {
       const res = await fetch('/api/trending/chatbot', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ message: userMsg, content })
       });
       const data = await res.json();
       setChatMessages(prev => [...prev, { role: 'bot', text: data.reply || 'Sorry, I could not generate an answer.' }]);
    } catch {
       setChatMessages(prev => [...prev, { role: 'bot', text: 'Error connecting to AI assistant.' }]);
    }
    setIsBotTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white w-full rounded-3xl overflow-hidden relative border border-white/10 shadow-lg">
      
      {/* Top Header - Categories */}
      <div className="absolute top-0 inset-x-0 z-20 bg-gradient-to-b from-black/80 to-transparent pt-6 pb-12 px-6 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">TRENDING LIVE</h2>
           <button onClick={syncTrending} disabled={syncing} className={`w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/5 hover:bg-white/20 transition-all ${syncing ? 'animate-spin' : ''}`}>
              <RefreshCw size={16} />
           </button>
        </div>
        
        {/* Category Scroll */}
        <div className="flex space-x-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
           {CATEGORIES.map(cat => (
             <button
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={`px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-colors relative tracking-wide ${
                  activeCategory === cat ? 'bg-white text-black' : 'bg-black/40 border border-white/20 text-white/70 hover:bg-white/10'
               }`}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      {/* Main Feed Container */}
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full overflow-y-scroll snap-y snap-mandatory relative z-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollBehavior: 'smooth' }}
      >
         {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
               <div className="w-12 h-12 border-4 border-[#eaff96]/30 border-t-[#eaff96] rounded-full animate-spin"></div>
               <p className="text-white/40 font-medium">Curating your customized feed...</p>
            </div>
         ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center px-10">
               <p className="text-white/60 text-lg">No content currently in {activeCategory.toLowerCase()}.</p>
               <button onClick={syncTrending} className="text-[#eaff96] bg-[#eaff96]/10 px-6 py-2 rounded-full font-bold hover:bg-[#eaff96]/20 transition-colors">Find Sources</button>
            </div>
         ) : (
            items.map((item, index) => (
                <div 
                  key={item.id} 
                  ref={(el) => { itemRefs.current[index] = el; }}
                  data-index={index}
                  className="w-full h-full snap-start snap-always relative flex items-center justify-center bg-black shrink-0"
                >
                   {/* Background Media */}
                   {item.media_type === 'video' ? (
                      <video 
                        ref={(el) => { videoRefs.current[index] = el; }}
                        src={item.media_url} 
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                        autoPlay={activeIndex === index}
                        loop
                        muted
                        playsInline
                      />
                   ) : (
                      <img 
                        src={item.media_url} 
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                        alt={item.title}
                      />
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10"></div>
                   
                   {/* Content Bottom Info */}
                   <div className="absolute bottom-6 left-6 right-20 flex flex-col items-start min-w-0 pr-4 drop-shadow-2xl">
                       <span className="px-3 py-1 bg-[#eaff96] text-black text-[10px] font-black uppercase tracking-widest rounded-sm mb-3 shadow-[4px_4px_0_0_#FFF]">
                          {item.category}
                       </span>
                       <h3 className="text-2xl font-black text-white leading-[1.1] mb-2 drop-shadow-md">
                          {item.title}
                       </h3>
                       <p className="text-sm text-white/80 line-clamp-3 leading-relaxed drop-shadow-sm font-medium pr-10 mb-3">
                          {item.description}
                       </p>
                       <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                          <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px]">🌍</span>
                          <span className="text-[11px] text-white/60 font-medium">via {item.source_name}</span>
                          <span className="text-white/30 text-[10px]">&bull;</span>
                          <span className="text-[11px] text-white/60">{new Date(item.created_at).toLocaleDateString()}</span>
                       </div>
                   </div>

                   {/* Right Side Actions */}
                   <div className="absolute bottom-10 right-4 flex flex-col space-y-6 items-center z-30">
                       {/* Bookmark */}
                       <button
                         onClick={() => {
                           if (!currentUser?.id) { onShare(item.id, 'user', null); return; }
                           handleBookmark(item);
                         }}
                         className="flex flex-col items-center group"
                         disabled={bookmarkingId === item.id}
                       >
                         <div className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center border transition-all mb-1 shadow-xl group-active:scale-95 ${
                           bookmarkedIds.has(item.id)
                             ? 'bg-[#eaff96] text-black border-[#eaff96]/50'
                             : 'bg-black/40 text-white border-white/10 group-hover:bg-white/20'
                         }`}>
                           <Bookmark size={26} fill={bookmarkedIds.has(item.id) ? 'currentColor' : 'none'} />
                         </div>
                         <span className="text-[11px] font-bold text-white drop-shadow-md tracking-wide">
                           {bookmarkedIds.has(item.id) ? 'Saved' : 'Save'}
                         </span>
                       </button>

                       {/* Share to Chat */}
                       <button
                         onClick={() => {
                           if (!currentUser?.id) { onShare(item.id, 'user', null); return; }
                           setShareItemId(item.id); setShareTab('chats'); setShareSentTo(null);
                         }}
                         className="flex flex-col items-center group"
                       >
                         <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all mb-1 text-white shadow-xl group-active:scale-95">
                           <Share2 size={26} />
                         </div>
                         <span className="text-[11px] font-bold text-white drop-shadow-md tracking-wide">Share</span>
                       </button>

                       {/* Ask AI */}
                       <ActionIcon 
                          icon={<Bot size={26} />} 
                          label="Ask AI" 
                          onClick={() => { setActiveChatbotId(item.id); setChatMessages([]); }} 
                       />
                       
                       <a href={item.source_url} target="_blank" rel="noreferrer" className="flex flex-col items-center group">
                          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/5 group-hover:bg-[#eaff96] group-hover:text-black transition-colors mb-1 text-white shadow-lg">
                            <ExternalLink size={24} />
                          </div>
                          <span className="text-[11px] font-bold text-white drop-shadow-md">Read</span>
                       </a>
                   </div>

                   {/* Share to Chat/Group Panel */}
                   {shareItemId === item.id && (
                     <div className="absolute inset-x-0 bottom-0 top-1/3 bg-[#111]/97 backdrop-blur-2xl z-50 rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-bottom">
                       <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setShareItemId(null)}>
                         <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
                       </div>
                       
                       <div className="px-5 pb-3 border-b border-white/10 flex items-center justify-between shrink-0">
                         <div>
                           <h4 className="font-bold text-white text-[16px]">Share to Chat</h4>
                           <span className="text-[11px] text-white/40">Send this story to a friend or group</span>
                         </div>
                         <button onClick={() => setShareItemId(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 transition-colors">
                           <X size={18} />
                         </button>
                       </div>

                       {/* Tabs */}
                       <div className="flex px-5 pt-3 pb-2 gap-2 shrink-0">
                         <button
                           onClick={() => setShareTab('chats')}
                           className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold transition-colors ${shareTab === 'chats' ? 'bg-[#eaff96] text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                         >
                           <MessageSquare size={13} /> Chats
                         </button>
                         <button
                           onClick={() => setShareTab('groups')}
                           className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold transition-colors ${shareTab === 'groups' ? 'bg-[#eaff96] text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                         >
                           <Users size={13} /> Groups
                         </button>
                       </div>

                       <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                         {shareTab === 'chats' && (
                           <>
                             {(!recentChats || recentChats.length === 0) ? (
                               <div className="text-center text-white/30 text-sm mt-8">No recent chats</div>
                             ) : recentChats.map(chat => (
                               <button
                                 key={chat.id}
                                 onClick={() => handleShareToTarget(item.id, 'user', chat)}
                                 className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left group"
                               >
                                 <div className="w-11 h-11 rounded-full bg-[#2a2a2a] flex items-center justify-center font-bold text-[14px] border border-white/5 shrink-0 overflow-hidden">
                                   {chat.avatar_url ? <img src={chat.avatar_url} className="w-full h-full object-cover" /> : (chat.name?.[0]?.toUpperCase() || chat.username?.[0]?.toUpperCase() || '?')}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <div className="font-semibold text-white/90 text-[14px] truncate">{chat.name || (chat.username ? `@${chat.username}` : 'User')}</div>
                                   <div className="text-[11px] text-white/40 truncate">{chat.username ? `@${chat.username}` : ''}</div>
                                 </div>
                                 {shareSentTo === chat.id ? (
                                   <div className="w-8 h-8 rounded-full bg-[#eaff96] flex items-center justify-center shrink-0">
                                     <Check size={14} className="text-black" />
                                   </div>
                                 ) : (
                                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:bg-[#eaff96]/20 group-hover:text-[#eaff96] transition-colors shrink-0">
                                     <Send size={14} />
                                   </div>
                                 )}
                               </button>
                             ))}
                           </>
                         )}
                         {shareTab === 'groups' && (
                           <>
                             {(!groups || groups.length === 0) ? (
                               <div className="text-center text-white/30 text-sm mt-8">No groups yet</div>
                             ) : groups.map(g => (
                               <button
                                 key={g.id}
                                 onClick={() => handleShareToTarget(item.id, 'group', g)}
                                 className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors text-left group"
                               >
                                 <div className="w-11 h-11 rounded-2xl bg-[#eaff96]/10 text-[#eaff96] flex items-center justify-center font-bold text-[14px] border border-[#eaff96]/20 shrink-0">
                                   {g.name?.[0]?.toUpperCase() || '?'}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <div className="font-semibold text-white/90 text-[14px] truncate">{g.name}</div>
                                   <div className="text-[11px] text-white/40">{g.chat_group_members?.length || 1} members</div>
                                 </div>
                                 {shareSentTo === g.id ? (
                                   <div className="w-8 h-8 rounded-full bg-[#eaff96] flex items-center justify-center shrink-0">
                                     <Check size={14} className="text-black" />
                                   </div>
                                 ) : (
                                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:bg-[#eaff96]/20 group-hover:text-[#eaff96] transition-colors shrink-0">
                                     <Send size={14} />
                                   </div>
                                 )}
                               </button>
                             ))}
                           </>
                         )}
                       </div>
                     </div>
                   )}

                   {/* AI Chatbot Drawer Overlay for this item */}
                   {activeChatbotId === item.id && (
                       <div className="absolute inset-x-0 bottom-0 top-1/3 bg-[#111]/95 backdrop-blur-2xl z-50 rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-bottom flex">
                          <div className="w-full flex justify-center pt-3 pb-2 cursor-pointer" onClick={() => setActiveChatbotId(null)}>
                             <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
                          </div>
                          
                          <div className="px-6 pb-4 border-b border-white/10 flex items-center justify-between shrink-0">
                             <div className="flex items-center space-x-3">
                               <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                                 AI
                               </div>
                               <div>
                                 <h4 className="font-bold text-white leading-tight">Trending Insight</h4>
                                 <span className="text-[11px] text-white/40">Ask anything about this story</span>
                               </div>
                             </div>
                             <button onClick={() => setActiveChatbotId(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 transition-colors">
                                <X size={18} />
                             </button>
                          </div>

                          <div className="flex-1 overflow-y-auto p-6 space-y-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                             {chatMessages.length === 0 && (
                                <div className="text-center text-white/40 text-sm mt-4 px-8">
                                   "Hey there! What would you like to know about this story?" <br/><br/>
                                   <div className="flex flex-wrap gap-2 justify-center mt-4">
                                      <button onClick={(e) => {handleChatbotSubmit(e, item, "Summarize this for me")}} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[12px] text-white/70 border border-white/5 transition-colors">Summarize this for me</button>
                                      <button onClick={(e) => {handleChatbotSubmit(e, item, "Why is this trending right now?")}} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[12px] text-white/70 border border-white/5 transition-colors">Why is this trending?</button>
                                   </div>
                                </div>
                             )}
                             {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-[14px] leading-relaxed ${
                                      msg.role === 'user' ? 'bg-[#eaff96] text-black rounded-br-sm font-medium' : 'bg-[#1e1e1e] text-white/90 rounded-bl-sm border border-white/5'
                                   }`}>
                                      {msg.text}
                                   </div>
                                </div>
                             ))}
                             {isBotTyping && (
                                <div className="flex w-full justify-start">
                                   <div className="px-5 py-4 bg-[#1e1e1e] rounded-[1.5rem] rounded-bl-sm flex items-center space-x-1.5 flex shrink-0 border border-white/5">
                                      <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce"></div>
                                      <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                      <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                   </div>
                                </div>
                             )}
                          </div>

                          <div className="p-4 shrink-0 bg-[#0a0a0a]">
                             <form onSubmit={(e) => handleChatbotSubmit(e, item)} className="relative flex items-center">
                                <input 
                                  value={chatInput}
                                  onChange={e => setChatInput(e.target.value)}
                                  placeholder="Ask a question..."
                                  className="w-full bg-[#1e1e1e] text-white px-5 py-4 rounded-full pr-14 text-[15px] focus:outline-none focus:ring-2 ring-white/10 border border-white/5 placeholder:text-white/30"
                                />
                                <button type="submit" disabled={!chatInput.trim() || isBotTyping} className="absolute right-2.5 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50">
                                   <Send size={16} />
                                </button>
                             </form>
                          </div>
                       </div>
                   )}
                </div>
            ))
         )}
      </div>
      
      {/* Scroll Hint overlay for desktop */}
      <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 flex-col space-y-2 text-white/20 pointer-events-none z-0 mix-blend-difference">
         <ChevronUp size={24} className="animate-pulse" />
         <ChevronDown size={24} className="animate-pulse" />
      </div>
    </div>
  );
}

// Subcomponent for vertical actions
function ActionIcon({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center group">
       <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all mb-1 text-white shadow-xl group-active:scale-95">
          {icon}
       </div>
       <span className="text-[11px] font-bold text-white drop-shadow-md tracking-wide">{label}</span>
    </button>
  );
}
