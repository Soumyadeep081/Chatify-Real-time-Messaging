'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { insforge } from '../lib/insforge';
import { Send, LogOut, Search, Settings, Plus, Phone, Video, Pin, Users, MoreVertical, Paperclip, Smile, Image as ImageIcon, Link as LinkIcon, Home, MessageSquare, ArrowLeft, User, Loader2, File, PlaySquare, Radio, Heart, X, Gamepad2, Trophy, Crown, Flame, Archive, Trash2, DoorOpen, Bookmark, ChevronRight, Eye, PhoneMissed, ArrowUpRight, ArrowDownLeft, Sun, Moon, Check, ArrowRight, Mic, MicOff, VideoOff, ZoomIn } from 'lucide-react';
import GameOverlay, { GAME_TYPES } from './GameOverlay';
import TrendingFeed from './TrendingFeed';
import CreateGroupModal from './CreateGroupModal';
import SettingsModal from './SettingsModal';
import StoryViewer from './StoryViewer';
import ZoomedImageModal from './ZoomedImageModal';
import InviteMemberModal from './InviteMemberModal';
import TrendingPreviewCard from './TrendingPreviewCard';
import GameInviteCard from './GameInviteCard';
import CallOverlay from './CallOverlay';


type TargetType = 'user' | 'group' | null;


export default function ChatRoom({ session, onSignOut, onGoToLanding, onProfileUpdate, isDark, onToggleTheme, onGoToTrending }: {
  session: any;
  onSignOut: () => void;
  onGoToLanding: () => void;
  onProfileUpdate?: (profileData: any) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onGoToTrending?: (id?: string) => void;
}) {

  const currentUser = session?.user;
  const [activeTab, setActiveTab] = useState<'chats' | 'groups' | 'calls' | 'trending' | 'broadcasts' | 'hearted'>('chats');

  // Hearted / Bookmarked trending items
  const [heartedItems, setHeartedItems] = useState<any[]>([]);

  // Archive state
  const [archivedChatIds, setArchivedChatIds] = useState<Set<string>>(new Set());
  const [pinnedChatIds, setPinnedChatIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [chatContextMenu, setChatContextMenu] = useState<{ id: string; type: 'user' | 'group'; data: any } | null>(null);

  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[] | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<{ type: TargetType, data: any }>({ type: null, data: null });
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeCall, setActiveCall] = useState<{ type: 'video' | 'audio', room: string, title: string, callId?: string } | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callingStatus, setCallingStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [callSession, setCallSession] = useState<any>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [activeGame, setActiveGame] = useState<{ type: string, roomId: string, isInviter: boolean } | null>(null);
  const [showGameCenter, setShowGameCenter] = useState(false);
  const [groupGameStats, setGroupGameStats] = useState<any[]>([]);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [callFilter, setCallFilter] = useState<'All' | 'Missed' | 'Incoming' | 'Outgoing'>('All');
  const callStartTimeRef = useRef<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyViewerGroupIndex, setStoryViewerGroupIndex] = useState(0);
  const [pendingStoryFile, setPendingStoryFile] = useState<File | null>(null);
  const [storyCaption, setStoryCaption] = useState('');
  const [uploadingStory, setUploadingStory] = useState(false);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  const [showGameSelector, setShowGameSelector] = useState<{ groupId: string } | null>(null);
  const [selectedGameMembers, setSelectedGameMembers] = useState<string[]>([]);
  
  const mountedRef = useRef(true);
  const realtimeCleanupRef = useRef<() => void>(() => {});
  const groupsRef = useRef<any[]>([]);


  // Media Extractions
  const [sharedImages, setSharedImages] = useState<any[]>([]);
  const [sharedDocs, setSharedDocs] = useState<any[]>([]);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  const [sharedLinks, setSharedLinks] = useState<string[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const callSessionRef = useRef<any>(null);
  useEffect(() => {
    callSessionRef.current = callSession;
  }, [callSession]);

  // --- Fetching Functions ---

  const fetchRecentChats = async () => {
    const { data } = await insforge.database.rpc('get_recent_chats');
    const recents = data ? (data as any[]) : [];
    setRecentChats(recents);

    if (currentUser?.id) {
       const recentIds = recents.map(r => r.id);
       const { data: suggestions } = await insforge.database
         .from('profiles')
         .select('*')
         .neq('id', currentUser.id)
         .limit(30);

       if (suggestions) {
          setSuggestedUsers(suggestions.filter(s => !recentIds.includes(s.id)).slice(0, 10));
       }
    }
  };

  const fetchGroups = async () => {
    const { data } = await insforge.database
      .from('chat_groups')
      .select('*, chat_group_members(user_id, is_admin, profiles(name, username, avatar_url))')
      .order('created_at', { ascending: false });
    if (data) setGroups(data);
  };

  const fetchStories = async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await insforge.database
      .from('user_stories')
      .select('*, profiles(name, username, avatar_url), story_views(viewer_id)')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });
    if (data) setStories(data);
  };

  const handleStoryUpload = async () => {
    if (!pendingStoryFile || !currentUser?.id) return;
    setUploadingStory(true);
    try {
      const fileName = `${currentUser.id}_${Date.now()}_${pendingStoryFile.name}`;
      const { data: uploadData } = await insforge.storage
        .from('stories')
        .upload(fileName, pendingStoryFile);
        
      if (uploadData?.url) {
        await insforge.database.from('user_stories').insert([{
          user_id: currentUser.id,
          media_url: uploadData.url,
          caption: storyCaption
        }]);
        setPendingStoryFile(null);
        setStoryCaption('');
        fetchStories();
        alert('Story posted successfully!');
      }
    } catch (e: any) {
      alert('Failed to post story: ' + e.message);
    } finally {
      setUploadingStory(false);
    }
  };

  const fetchCallHistory = async () => {
    if (!currentUser?.id) return;
    const { data } = await insforge.database
      .from('call_history')
      .select('*, caller:profiles!call_history_caller_id_fkey(name, username, avatar_url), receiver:profiles!call_history_receiver_id_fkey(name, username, avatar_url)')
      .or(`caller_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('started_at', { ascending: false })
      .limit(50);
    if (data) setCallHistory(data);
  };

  const fetchBroadcasts = async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await insforge.database
      .from('broadcasts')
      .select('*, profiles(name, avatar_url)')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false });
    if (data) setBroadcasts(data);
  };

  const fetchArchivedChats = async () => {
    if (!currentUser?.id) return;
    const { data } = await insforge.database
      .from('archived_chats')
      .select('partner_id, group_id')
      .eq('user_id', currentUser.id);
    if (data) {
      const ids = new Set<string>();
      data.forEach((r: any) => {
        if (r.partner_id) ids.add(r.partner_id);
        if (r.group_id) ids.add(r.group_id);
      });
      setArchivedChatIds(ids);
    }
  };

  const fetchPinnedChats = async () => {
    if (!currentUser?.id) return;
    const { data } = await insforge.database
      .from('pinned_chats')
      .select('partner_id, group_id')
      .eq('user_id', currentUser.id);
    if (data) {
      const ids = new Set<string>();
      data.forEach((r: any) => {
        if (r.partner_id) ids.add(r.partner_id);
        if (r.group_id) ids.add(r.group_id);
      });
      setPinnedChatIds(ids);
    }
  };



  const handleStoryDeleted = () => { fetchStories(); };

  const fetchHeartedTrendingItems = async () => {
    if (!currentUser?.id) return;
    const { data: bookmarks } = await insforge.database
      .from('trending_bookmarks')
      .select('content_id')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (bookmarks && bookmarks.length > 0) {
      const ids = bookmarks.map((b: any) => b.content_id);
      const { data: contents } = await insforge.database
        .from('trending_content')
        .select('*')
        .in('id', ids);
      if (contents) setHeartedItems(contents);
    } else {
      setHeartedItems([]);
    }
  };

  // --- Realtime & Effects ---

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    fetchRecentChats();
    fetchGroups();
    fetchCallHistory();
    fetchStories();
    fetchArchivedChats();
    fetchPinnedChats();
    fetchHeartedTrendingItems();
    fetchBroadcasts();

    const setupRealtime = async () => {
      try {
        await insforge.realtime.connect();
        if (!mountedRef.current) return;

        // Subscriptions
        insforge.realtime.subscribe(`chat:${currentUser.id}`);
        insforge.realtime.subscribe(`group_events`);
        insforge.realtime.subscribe('presence:global');
        insforge.realtime.subscribe('broadcasts:global');

        // Handlers
        const onNewMessage = (payload: any) => {
          if (!mountedRef.current) return;
          const isCurrentChat = selectedTargetRef.current.type === 'user' && 
            (payload.sender_id === selectedTargetRef.current.data?.id || payload.receiver_id === selectedTargetRef.current.data?.id);
          
          if (isCurrentChat) {
            setMessages((prev) => {
              if (prev.find(m => m.id === payload.id)) return prev;
              return [...prev, payload].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });
            scrollToBottom();
          } else if (payload.sender_id !== currentUser.id) {
            if (typeof window !== 'undefined' && Notification.permission === 'granted') {
              new Notification('New message on Chatify', { body: payload.content || 'Sent a file', icon: '/favicon.ico' });
            }
          }
          fetchRecentChats();
        };

        const onNewGroupMessage = (payload: any) => {
          if (!mountedRef.current) return;
          if (selectedTargetRef.current.type === 'group' && payload.group_id === selectedTargetRef.current.data?.id) {
            setMessages((prev) => {
              if (prev.find(m => m.id === payload.id)) return prev;
              return [...prev, payload].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });
            scrollToBottom();
          }
        };

        const onPresence = (payload: any) => {
          if (!mountedRef.current) return;
          setOnlineUsers(prev => ({ ...prev, [payload.userId]: Date.now() }));
        };

        const onIncomingCall = (payload: any) => setIncomingCall(payload);
        const onIncomingGroupCall = (payload: any) => {
           if (groupsRef.current.some(g => g.id === payload.group_id)) setIncomingCall(payload);
        };
        const onBroadcastReceived = (payload: any) => {
          setBroadcasts(prev => {
            if (prev.find(b => b.id === payload.id)) return prev;
            return [payload, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          });
          if (typeof window !== 'undefined' && Notification.permission === 'granted') {
            new Notification('Global Broadcast', { body: payload.content || 'Announcement', icon: '/favicon.ico' });
          }
          fetchBroadcasts();
        };
        const onCallEnded = (payload: any) => {
           setActiveCall(null);
           setIncomingCall(null);
           fetchCallHistory();
        };

        insforge.realtime.on('new_message', onNewMessage);
        insforge.realtime.on('new_group_message', onNewGroupMessage);
        insforge.realtime.on('presence', onPresence);
        insforge.realtime.on('incoming_call', onIncomingCall);
        insforge.realtime.on('incoming_group_call', onIncomingGroupCall);
        insforge.realtime.on('broadcast_received', onBroadcastReceived);
        insforge.realtime.on('call_ended', onCallEnded);
        insforge.realtime.on('call_accepted', (payload: any) => {
          if (callSessionRef.current && payload.room === callSessionRef.current.room) {
            setCallingStatus('connected');
            setActiveCall({ ...callSessionRef.current });
          }
        });
        insforge.realtime.on('call_rejected', (payload: any) => {
          if (callSessionRef.current && payload.room === callSessionRef.current.room) {
            setCallingStatus('idle');
            setCallSession(null);
          }
        });

        const pingInterval = setInterval(() => {
          if (!mountedRef.current) return;
          try {
            // Check if client exists and is actually ready to publish
            const isReady = (insforge.realtime as any).isReady || (insforge.realtime as any).isConnected;
            const readyStatus = typeof isReady === 'function' ? isReady() : isReady;
            
            if (currentUser && readyStatus !== false) {
              insforge.realtime.publish('presence:global', 'presence', { userId: currentUser.id });
            }
          } catch (e) {
            // Silently ignore synchronous connection errors
          }
        }, 10000);

        // Store cleanup
        realtimeCleanupRef.current = () => {
          clearInterval(pingInterval);
          insforge.realtime.off('new_message', onNewMessage);
          insforge.realtime.off('new_group_message', onNewGroupMessage);
          insforge.realtime.off('presence', onPresence);
          insforge.realtime.off('incoming_call', onIncomingCall);
          insforge.realtime.off('incoming_group_call', onIncomingGroupCall);
          insforge.realtime.off('broadcast_received', onBroadcastReceived);
          insforge.realtime.off('call_ended', onCallEnded);
          insforge.realtime.unsubscribe(`chat:${currentUser.id}`);
          insforge.realtime.unsubscribe(`group_events`);
          insforge.realtime.unsubscribe('presence:global');
          insforge.realtime.unsubscribe('broadcasts:global');
        };
      } catch (err) {
        console.error('Realtime setup error:', err);
      }
    };

    setupRealtime();

    return () => {
      mountedRef.current = false;
      if (realtimeCleanupRef.current) realtimeCleanupRef.current();
    };
  }, [currentUser]); 

  // New Effect to handle selectedTarget changes without re-setup
  const selectedTargetRef = useRef(selectedTarget);
  useEffect(() => {
    selectedTargetRef.current = selectedTarget;
  }, [selectedTarget]);


  // Cleanup stale online users
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setOnlineUsers((prev) => {
        const now = Date.now();
        const next = { ...prev };
        let changed = false;
        for (const [id, lastSeen] of Object.entries(next)) {
          if (now - (lastSeen as number) > 25000) { delete next[id]; changed = true; }
        }
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(cleanupInterval);
  }, []);

  // Fetch thread
  useEffect(() => {
    if (!selectedTarget.data) {
      setMessages([]);
      return;
    }
    
    // Clear messages for the new target to avoid showing old ones
    setMessages([]);
    
    const fetchThread = async () => {
      try {
        if (selectedTarget.type === 'user') {
          const { data, error } = await insforge.database
            .from('direct_messages')
            .select('*, sender:profiles!sender_id(name, username, avatar_url)')
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedTarget.data.id}),and(sender_id.eq.${selectedTarget.data.id},receiver_id.eq.${currentUser.id})`)
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (error) {
            console.error('Error fetching direct messages:', error);
            return;
          }
          
          if (data) { 
            setMessages(data.reverse()); 
            scrollToBottom(); 
          }
        } else if (selectedTarget.type === 'group') {
          const { data, error } = await insforge.database
            .from('chat_group_messages')
            .select('*, sender:profiles!sender_id(name, username, avatar_url)')
            .eq('group_id', selectedTarget.data.id)
            .order('created_at', { ascending: false })
            .limit(100);
          
          if (error) {
            console.error('Error fetching group messages:', error);
            return;
          }
          
          if (data) { 
            setMessages(data.reverse()); 
            scrollToBottom(); 
          }
          
          // Fetch group game stats separately as before
          insforge.database.from('chat_group_game_stats')
            .select('user_id, wins')
            .eq('group_id', selectedTarget.data.id)
            .order('wins', { ascending: false })
            .then(({ data: st }) => setGroupGameStats(st || []));
        }
      } catch (err) {
        console.error('Exception in fetchThread:', err);
      }
    };
    
    fetchThread();
  }, [selectedTarget.data?.id, selectedTarget.type, currentUser.id, activeGame]);

  // Extract shared media
  useEffect(() => {
    const _imgs = messages.filter(m => m.attachment_type?.startsWith('image/'));
    const _docs = messages.filter(m => m.attachment_url && !m.attachment_type?.startsWith('image/'));
    const _links: string[] = [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    messages.forEach(m => { if (m.content) { const matched = m.content.match(urlRegex); if (matched) _links.push(...matched); } });

    setSharedImages(_imgs);
    setSharedDocs(_docs);
    setSharedLinks([...new Set(_links)]);
  }, [messages]);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      insforge.database.from('profiles').select('id, name, username, avatar_url, bio').ilike('username', `%${searchQuery}%`).neq('id', currentUser.id).limit(10).then(({ data }) => { if (data) setSearchResults(data); });
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, currentUser.id]);

  // --- Handlers ---

  const handleTrendingShare = async (contentId: string, targetType: 'user' | 'group', targetData: any) => {
    const content = `[TRENDING:${contentId}]`;
    if (targetType === 'user') {
      const targetChannel = `chat:${targetData.id}`;
      const { data } = await insforge.database.from('direct_messages').insert([{ content, sender_id: currentUser.id, receiver_id: targetData.id }]).select('*, profiles:profiles!sender_id(name, username, avatar_url)').single();
      if (data) {
        await insforge.realtime.subscribe(targetChannel);
        insforge.realtime.publish(targetChannel, 'new_message', data);
      }
    } else {
      const { data } = await insforge.database.from('chat_group_messages').insert([{ content, sender_id: currentUser.id, group_id: targetData.id }]).select('*, profiles:profiles!sender_id(name, username, avatar_url)').single();
      if (data) {
        await insforge.realtime.subscribe(`group_events`);
        insforge.realtime.publish(`group_events`, 'new_group_message', data);
      }
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || !currentUser?.id) return;
    try {
      const { data, error } = await insforge.database.from('broadcasts').insert([{
        sender_id: currentUser.id,
        content: broadcastMessage
      }]).select('*, profiles(name, avatar_url)').single();
      if (error) throw error;
      setBroadcastMessage('');
      fetchBroadcasts();
      // Notify all subscribers via realtime channel
      if (data) {
        insforge.realtime.publish('broadcasts:global', 'broadcast_received', data);
      }
    } catch (e: any) {
      alert('Broadcast failed: ' + e.message);
    }
  };

  const handleCall = async (type: 'audio' | 'video') => {
    if (!selectedTarget.data) return;
    
    // Check if we are already in a call
    if (activeCall || callingStatus !== 'idle') return;

    // Use Jitsi-compatible room ID (letters and numbers only)
    const roomId = `chatify_${currentUser.id.replace(/-/g, '').slice(0, 8)}_${Date.now()}`;
    const title = selectedTarget.data.name || selectedTarget.data.username || 'Conversation';
    
    setCallingStatus('calling');
    setCallSession({ type, room: roomId, title, target: selectedTarget.data });

    // Create call record in DB
    const { data: callRecord } = await insforge.database.from('call_history').insert([{
       caller_id: currentUser.id,
       receiver_id: selectedTarget.type === 'user' ? selectedTarget.data.id : null,
       group_id: selectedTarget.type === 'group' ? selectedTarget.data.id : null,
       call_type: type,
       status: 'initiated'
    }]).select().single();

    // Notify other person/group via realtime
    const callData = {
      type, room: roomId, title,
      caller_name: currentUser.profile?.name || currentUser.name || currentUser.username || 'Someone',
      caller_avatar: currentUser.profile?.avatar_url,
      caller_id: currentUser.id,
      call_id: callRecord?.id
    };

    if (selectedTarget.type === 'user') {
       const targetChannel = `chat:${selectedTarget.data.id}`;
       await insforge.realtime.subscribe(targetChannel);
       insforge.realtime.publish(targetChannel, 'incoming_call', callData);
    } else {
       const targetChannel = `group_events`;
       await insforge.realtime.subscribe(targetChannel); // Already subscribed in setupRealtime, but safe to call again
       insforge.realtime.publish(targetChannel, 'incoming_group_call', { ...callData, group_id: selectedTarget.data.id });
    }

    callStartTimeRef.current = Date.now();

    
    // We stay in 'calling' state until they answer (status_update) or we timeout
    // In this premium version, answering happens via 'call_accepted' event
    
    // Auto-timeout if no answer in 45 seconds
    setTimeout(() => {
       setCallingStatus(prev => {
          if (prev === 'calling' || prev === 'ringing') {
             handleEndCall();
             return 'idle';
          }
          return prev;
       });
    }, 45000);

    fetchCallHistory();
  };

  const handleEndCall = async () => {
    const activeId = activeCall?.callId || callSession?.callId;
    
    // Update call record with end time
    if (activeId) {
      await insforge.database.from('call_history').update({
        ended_at: new Date().toISOString(),
        status: activeCall ? 'completed' : 'missed'
      }).eq('id', activeId);
    }

    // Notify other party that call ended
    const targetId = selectedTarget.data?.id || callSession?.target?.id;
    if (targetId) {
       const targetChannel = (selectedTarget.type === 'user' || callSession?.target) ? `chat:${targetId}` : 'group_events';
       await insforge.realtime.subscribe(targetChannel);
       insforge.realtime.publish(targetChannel, 'call_ended', { group_id: selectedTarget.type === 'group' ? targetId : undefined });
    }

    setActiveCall(null);
    setCallSession(null);
    setCallingStatus('idle');
    setIncomingCall(null);
    fetchCallHistory();
  };

  const handleLaunchGame = async (gameType: string, targetUserIds?: string[]) => {
    if (!selectedTarget.data) return;
    const roomId = `game_${Date.now()}`;
    const launcherName = currentUser.profile?.name || currentUser.profile?.username || currentUser.name || currentUser.username || 'Friend';
    
    const inviteContent = `[GAME_INVITE:${gameType}:${roomId}:${launcherName}${targetUserIds ? `:${targetUserIds.join(',')}` : ''}]`;
    
    // Pre-create game session in DB so joiners can fetch it as ground truth
    try {
      await insforge.database.rpc('upsert_game_session', {
        p_room_id: roomId,
        p_game_type: gameType,
        p_host_id: currentUser.id
      });
    } catch (_) { /* non-fatal */ }

    if (selectedTarget.type === 'user') {
       const targetChannel = `chat:${selectedTarget.data.id}`;
       const { data: msg } = await insforge.database.from('direct_messages').insert([{
         content: inviteContent,
         sender_id: currentUser.id,
         receiver_id: selectedTarget.data.id
       }]).select().single();
       if (msg) {
         await insforge.realtime.subscribe(targetChannel);
         insforge.realtime.publish(targetChannel, 'new_message', msg);
       }
    } else {
       const { data: msg } = await insforge.database.from('chat_group_messages').insert([{
         content: inviteContent,
         sender_id: currentUser.id,
         group_id: selectedTarget.data.id
       }]).select().single();
       if (msg) {
         await insforge.realtime.subscribe(`group_events`);
         insforge.realtime.publish(`group_events`, 'new_group_message', msg);
       }
    }
    
    setShowGameCenter(false);
    setShowGameSelector(null);
    setSelectedGameMembers([]);
    // Inviter is the one who launched the game - they go first
    setActiveGame({ type: gameType, roomId, isInviter: true });
  };



  const archiveChat = async (type: 'user' | 'group', id: string) => {
    const isArchived = archivedChatIds.has(id);
    if (isArchived) {
      await insforge.database.from('archived_chats').delete().eq('user_id', currentUser.id).eq(type === 'user' ? 'partner_id' : 'group_id', id);
      setArchivedChatIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      const row: any = { user_id: currentUser.id };
      if (type === 'user') row.partner_id = id; else row.group_id = id;
      await insforge.database.from('archived_chats').insert([row]);
      setArchivedChatIds(prev => new Set([...prev, id]));
      if (selectedTarget.data?.id === id) setSelectedTarget({ type: null, data: null });
    }
    setChatContextMenu(null);
  };

  const togglePinChat = async (type: 'user' | 'group', id: string) => {
    const isPinned = pinnedChatIds.has(id);
    if (isPinned) {
      await insforge.database.from('pinned_chats').delete().eq('user_id', currentUser.id).eq(type === 'user' ? 'partner_id' : 'group_id', id);
      setPinnedChatIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      const row: any = { user_id: currentUser.id };
      if (type === 'user') row.partner_id = id; else row.group_id = id;
      await insforge.database.from('pinned_chats').insert([row]);
      setPinnedChatIds(prev => new Set([...prev, id]));
    }
    setChatContextMenu(null);
  };

  const deleteDirectChat = async (partnerId: string) => {
    if (!window.confirm('Delete all messages with this person?')) return;
    await insforge.database.from('direct_messages').delete().or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUser.id})`);
    if (selectedTarget.data?.id === partnerId) setSelectedTarget({ type: null, data: null });
    fetchRecentChats();
    setChatContextMenu(null);
  };

  const leaveGroup = async (groupId: string) => {
    if (!window.confirm('Leave this group?')) return;
    await insforge.database.from('chat_group_members').delete().eq('group_id', groupId).eq('user_id', currentUser.id);
    if (selectedTarget.data?.id === groupId) setSelectedTarget({ type: null, data: null });
    fetchGroups();
    setChatContextMenu(null);
  };

  const toggleAdminStatus = async (groupId: string, userId: string, currentIsAdmin: boolean) => {
    const { error } = await insforge.database.from('chat_group_members').update({ is_admin: !currentIsAdmin }).eq('group_id', groupId).eq('user_id', userId);
    if (error) alert(error.message); else fetchGroups();
  };

  const kickGroupMember = async (groupId: string, userId: string) => {
    if (!window.confirm('Remove this member?')) return;
    const { error } = await insforge.database.from('chat_group_members').delete().eq('group_id', groupId).eq('user_id', userId);
    if (error) alert(error.message); else fetchGroups();
  };

  const handleGroupAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, groupId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUpdatingGroup(true);
    try {
      const { data, error } = await insforge.storage.from('group-avatars').uploadAuto(file);
      if (error) throw error;
      if (data) {
        await insforge.database.from('chat_groups').update({ avatar_url: data.url }).eq('id', groupId);
        fetchGroups();
        if (selectedTarget.data?.id === groupId) setSelectedTarget(prev => ({ ...prev, data: { ...prev.data, avatar_url: data.url } }));
        // Update recently active chats state for immediate sidebar feedback
        setRecentChats(prev => prev.map(c => c.id === groupId ? { ...c, avatar_url: data.url } : c));
      }
    } catch (err: any) { alert("Upload failed: " + err.message); } finally { setIsUpdatingGroup(false); }
  };

  const updateGroupMetadata = async (groupId: string, updates: { name?: string, description?: string }) => {
    const { error } = await insforge.database.from('chat_groups').update(updates).eq('id', groupId);
    if (error) alert(error.message);
    else { fetchGroups(); if (selectedTarget.data?.id === groupId) setSelectedTarget(prev => ({ ...prev, data: { ...prev.data, ...updates } })); }
  };

  const scrollToBottom = () => { setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !selectedTarget.data) return;
    const content = newMessage.trim();
    setNewMessage('');
    if (selectedTarget.type === 'user') {
      const targetChannel = `chat:${selectedTarget.data.id}`;
      const { data } = await insforge.database.from('direct_messages').insert([{ content, sender_id: currentUser.id, receiver_id: selectedTarget.data.id }]).select('*, sender:profiles!sender_id(name, username, avatar_url)').single();
      if (data) {
        await insforge.realtime.subscribe(targetChannel);
        insforge.realtime.publish(targetChannel, 'new_message', data);
      }
    } else {
      const { data } = await insforge.database.from('chat_group_messages').insert([{ content, sender_id: currentUser.id, group_id: selectedTarget.data.id }]).select('*, sender:profiles!sender_id(name, username, avatar_url)').single();
      if (data) {
        await insforge.realtime.subscribe(`group_events`);
        insforge.realtime.publish(`group_events`, 'new_group_message', data);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTarget.data) return;
    setIsUploadingFile(true);
    try {
      const { data, error } = await insforge.storage.from('chat-attachments').uploadAuto(file);
      if (error) throw error;
      if (data?.url) {
        const msgData: any = { attachment_url: data.url, attachment_type: file.type, sender_id: currentUser.id };
        if (selectedTarget.type === 'user') {
          const targetChannel = `chat:${selectedTarget.data.id}`;
          msgData.receiver_id = selectedTarget.data.id;
          const { data: res } = await insforge.database.from('direct_messages').insert([msgData]).select('*, sender:profiles!sender_id(name, username, avatar_url)').single();
          if (res) {
            await insforge.realtime.subscribe(targetChannel);
            insforge.realtime.publish(targetChannel, 'new_message', res);
          }
        } else {
          msgData.group_id = selectedTarget.data.id;
          const { data: res } = await insforge.database.from('chat_group_messages').insert([msgData]).select('*, sender:profiles!sender_id(name, username, avatar_url)').single();
          if (res) {
            await insforge.realtime.subscribe(`group_events`);
            insforge.realtime.publish(`group_events`, 'new_group_message', res);
          }
        }
      }
    } catch (err: any) { alert('Upload failed: ' + err.message); } finally { setIsUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };


  const isOnline = (uid: string) => {
    const lastSeen = onlineUsers[uid];
    if (!lastSeen) return false;
    return Date.now() - (lastSeen as number) < 30000;
  };

  const getRelativeTime = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatDatePill = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  // --- Render ---

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-[#0a0a0a] text-white/90' : 'bg-[#f5f5f7] text-gray-900'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Sidebar Navigation */}
      <div className={`hidden md:flex w-20 flex-col items-center py-8 border-r shrink-0 ${isDark ? 'border-white/5 bg-[#0f0f0f]/50 backdrop-blur-xl' : 'border-gray-200 bg-white shadow-sm'}`}>
        <div 
          onClick={onGoToLanding}
          className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-black shadow-lg shadow-accent/20 cursor-pointer hover:scale-105 transition-transform mb-10"
        >
          <Flame size={28} />
        </div>
        
        <div className="flex-1 flex flex-col space-y-3">
          {[
            { id: 'chats', icon: <MessageSquare size={22} />, label: 'CHATS' },
            { id: 'groups', icon: <Users size={22} />, label: 'GROUPS' },
            { id: 'trending', icon: <Flame size={22} />, label: 'TRENDS' },
            { id: 'broadcasts', icon: <Radio size={22} />, label: 'BROADCAST' },
            { id: 'calls', icon: <Phone size={22} />, label: 'CALLS' },
            { id: 'hearted', icon: <Heart size={22} />, label: 'SAVED' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all relative group shadow-sm
                ${activeTab === item.id ? 'bg-accent text-black shadow-accent/20' : isDark ? 'text-white/30 hover:text-white/60 hover:bg-white/5' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100'}`}
            >
              {item.icon}
              <div className="absolute left-full ml-4 px-2 py-1 bg-[#eaff96] text-black text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap tracking-widest shadow-xl">
                {item.label}
              </div>
              {activeTab === item.id && <div className="absolute -left-4 w-1.5 h-6 bg-accent rounded-r-full shadow-accent" />}
            </button>
          ))}
        </div>

        <button 
           onClick={() => setShowSettings(true)}
           className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDark ? 'text-white/30 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100'}`}
        >
          <Settings size={22} />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* List Section (Left) */}
        <div className={`w-full md:w-[400px] flex flex-col border-r shrink-0 ${isDark ? 'border-white/5 bg-[#111111]/30 backdrop-blur-3xl' : 'border-gray-200 bg-white'} ${selectedTarget.data ? 'hidden md:flex' : 'flex'}`}>
          
          {/* List Header */}
          <div className={`p-6 pb-2 ${isDark ? '' : 'border-b border-gray-100'}`}>
            <div className="flex items-center justify-between mb-6">
              <h1 className={`text-2xl font-black tracking-tight flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                 {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <div className="flex items-center space-x-2">
                 {activeTab === 'groups' && (
                    <button 
                      onClick={() => setShowCreateGroup(true)}
                      className="w-10 h-10 rounded-full bg-accent text-black flex items-center justify-center shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                 )}
                 <button 
                    onClick={onToggleTheme}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-white/60 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                 >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                 </button>
              </div>
            </div>

            <div className="relative group">
              <div className={`absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors ${isDark ? 'text-white/20 group-focus-within:text-[#eaff96]' : 'text-gray-400 group-focus-within:text-gray-700'}`}>
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages, users..."
                className={`w-full border rounded-[1.25rem] pl-12 pr-4 py-3.5 text-[15px] focus:outline-none transition-all ${isDark ? 'bg-white/5 border-white/5 text-white focus:bg-white/10 focus:border-[#eaff96]/20 focus:ring-1 focus:ring-[#eaff96]/20 placeholder:text-white/20' : 'bg-gray-100 border-gray-200 text-gray-900 focus:bg-white focus:border-gray-400 placeholder:text-gray-400'}`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            
            {activeTab === 'chats' && (
              <>
                {/* Stories Section */}
                {!searchQuery && (
                  <div className="mb-6">
                     <div className="text-[11px] uppercase tracking-wider text-white/40 font-semibold px-3 mb-3">Stories</div>
                     <div className="flex items-center space-x-4 px-3 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {/* My Add Story */}
                        <div className="flex flex-col items-center shrink-0">
                           <div 
                              onClick={() => storyInputRef.current?.click()}
                              className="w-16 h-16 rounded-[1.75rem] border-2 border-dashed border-white/10 flex items-center justify-center text-white/30 hover:border-[#eaff96]/40 hover:text-white transition-all cursor-pointer group mb-2"
                           >
                              <Plus size={24} className="group-hover:scale-110 transition-transform" />
                           </div>
                           <span className={`text-[11px] font-bold ${isDark ? 'text-white/60' : 'text-gray-500'}`}>New Story</span>
                           <input type="file" ref={storyInputRef} accept="image/*,video/*" className="hidden" onChange={(e: any) => { if (e.target.files?.[0]) { setPendingStoryFile(e.target.files[0]); setStoryViewerOpen(false); } }} />
                        </div>

                        {/* Story Groups */}
                        {Array.from(new Set(stories.map(s => s.user_id))).map((uid, idx) => {
                          const userStories = stories.filter(s => s.user_id === uid);
                          const user = userStories[0]?.profiles;
                          const hasUnseen = userStories.some(s => !s.story_views?.some((v: any) => v.viewer_id === currentUser.id));
                          
                          return (
                            <div key={uid} className="flex flex-col items-center shrink-0">
                               <div 
                                  onClick={() => { setStoryViewerGroupIndex(idx); setStoryViewerOpen(true); }}
                                  className={`w-16 h-16 rounded-[1.75rem] border-2 ${hasUnseen ? 'border-accent' : (isDark ? 'border-white/10' : 'border-gray-200')} p-0.5 cursor-pointer hover:scale-105 transition-transform mb-2 relative`}
                               >
                                  <div className={`w-full h-full rounded-[1.5rem] overflow-hidden ${!hasUnseen && 'opacity-60'} ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
                                     {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center text-lg font-bold ${isDark ? 'text-white/20' : 'text-gray-300'}`}>{user?.name?.[0]?.toUpperCase()}</div>}
                                  </div>
                               </div>
                               <span className={`text-[11px] font-bold truncate w-16 text-center ${hasUnseen ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-white/40' : 'text-gray-400')}`}>{user?.id === currentUser?.id ? 'You' : user?.name || 'User'}</span>
                            </div>
                          )
                        })}
                     </div>
                  </div>
                )}

                {searchQuery ? (
                   <div className="mb-4">
                      <div className="text-[11px] uppercase tracking-wider text-white/40 font-semibold px-3 mb-2 mt-2">Search results</div>
                      {searchResults.map(u => (
                        <button key={u.id} onClick={() => { setSelectedTarget({ type: 'user', data: u }); setSearchQuery(''); }} className={`w-full text-left flex items-center p-3 rounded-2xl transition-colors group ${isDark ? 'hover:bg-[#1e1e1e]' : 'hover:bg-gray-100'}`}>
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 font-semibold border overflow-hidden shrink-0 ${isDark ? 'bg-[#2a2a2a] border-white/5' : 'bg-gray-200 border-gray-300'}`}>
                              {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : (u.name?.[0]?.toUpperCase() || '?')}
                           </div>
                           <div className="flex-1 min-w-0 pr-1">
                              <div className={`font-medium text-[15px] truncate ${isDark ? 'text-white/90' : 'text-gray-900'}`}>{u.name || `@${u.username}`}</div>
                              <div className={`text-[13px] truncate ${isDark ? 'text-white/40' : 'text-gray-500'}`}>@{u.username}</div>
                           </div>
                        </button>
                      ))}
                   </div>
                ) : (
                  <>
                    <button onClick={() => setShowArchived(!showArchived)} className={`w-full flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-widest font-bold transition-colors mb-1 ${isDark ? 'text-white/30 hover:text-white/50' : 'text-gray-400 hover:text-gray-600'}`}>
                      <span>{showArchived ? 'ALL CHATS' : `${archivedChatIds.size > 0 ? `ARCHIVED (${archivedChatIds.size})` : 'CHATS'}`}</span>
                      {archivedChatIds.size > 0 && <Archive size={12} />}
                    </button>
                    {recentChats
                      .filter(chat => showArchived ? archivedChatIds.has(chat.id) : !archivedChatIds.has(chat.id))
                      .sort((a, b) => {
                        const aPinned = pinnedChatIds.has(a.id);
                        const bPinned = pinnedChatIds.has(b.id);
                        if (aPinned && !bPinned) return -1;
                        if (!aPinned && bPinned) return 1;
                        return 0;
                      })
                      .map(chat => {
                        const type = chat.type || 'user';
                        const isSelected = selectedTarget.type === type && selectedTarget.data?.id === chat.id;
                        const isPinned = pinnedChatIds.has(chat.id);
                        return (
                          <div key={chat.id} className="relative group/row">
                            <button
                              onClick={() => setSelectedTarget({ type: type as any, data: chat })}
                              className={`w-full text-left flex flex-col p-3 rounded-2xl transition-colors ${isSelected ? (isDark ? 'bg-[#222222]' : 'bg-white shadow-md border border-black/5') : (isDark ? 'hover:bg-[#1c1c1c]' : 'hover:bg-gray-100/50')}`}
                            >
                              <div className="flex items-center w-full">
                                <div className="shrink-0 relative">
                                   <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 font-semibold border text-[15px] overflow-hidden ${isSelected && type === 'group' ? 'bg-accent text-black border-accent' : isDark ? 'bg-[#2a2a2a] border-white/5' : 'bg-gray-200 border-gray-300 text-gray-700'}`}>
                                      {chat.avatar_url ? <img src={chat.avatar_url} className="w-full h-full object-cover" /> : (chat.name?.[0]?.toUpperCase() || '?')}
                                   </div>
                                   {isPinned && <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border shadow-lg ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/10'}`}><Pin size={10} className="text-accent rotate-45" /></div>}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                   <div className="flex items-center justify-between">
                                      <div className={`font-semibold text-[15px] truncate flex items-center ${isDark ? 'text-white/95' : 'text-gray-900'}`}>
                                         {type === 'group' && <Users size={12} className="mr-1.5 text-accent" />}
                                         {chat.name || `@${chat.username}`}
                                      </div>
                                      <div className={`text-[11px] ml-2 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{getRelativeTime(chat.last_message_at)}</div>
                                   </div>
                                   <div className={`text-[13px] truncate ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{chat.last_message_content || 'No messages yet'}</div>
                                </div>
                              </div>
                            </button>
                            <button
                               onClick={(e) => { e.stopPropagation(); setChatContextMenu({ id: chat.id, type: type as any, data: chat }); }}
                               className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all ${isDark ? 'bg-black/40 border-white/10 text-white/50 hover:text-white' : 'bg-white border-black/10 text-gray-400 hover:text-black'}`}
                            >
                               <MoreVertical size={14} />
                            </button>
                          </div>
                        )
                      })}

                    {suggestedUsers.length > 0 && !showArchived && (
                      <div className="mt-8 mb-4">
                        <div className={`text-[11px] uppercase tracking-widest font-bold px-3 mb-4 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Suggested People</div>
                         <div className="flex space-x-3 px-3 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                          {suggestedUsers.map(u => (
                             <div key={u.id} onClick={() => setSelectedTarget({ type: 'user', data: u })} className={`flex flex-col items-center shrink-0 w-24 p-3 rounded-3xl border transition-all cursor-pointer group ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-black/5 hover:shadow-xl'}`}>
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 overflow-hidden border group-hover:scale-110 transition-transform ${isDark ? 'bg-[#2a2a2a] border-white/10' : 'bg-gray-50 border-black/5'}`}>
                                   {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <div className={`${isDark ? 'text-white/20' : 'text-gray-300'} font-bold`}>{u.name?.[0]?.toUpperCase()}</div>}
                                </div>
                                <div className={`text-[11px] font-bold truncate w-full text-center ${isDark ? 'text-white/90' : 'text-gray-900'}`}>{u.name || `@${u.username}`}</div>
                                <div className={`text-[9px] mt-1 uppercase tracking-widest font-black ${isDark ? 'text-accent' : 'text-accent/80'}`}>View</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {activeTab === 'groups' && (
              <>
                {groups
                  .filter(g => g.chat_group_members?.some((m: any) => m.user_id === currentUser.id))
                  .map(g => {
                    const isSelected = selectedTarget.type === 'group' && selectedTarget.data?.id === g.id;
                    return (
                       <div key={g.id} className="relative group/row">
                         <button
                            onClick={() => setSelectedTarget({ type: 'group', data: g })}
                            className={`w-full text-left flex flex-col p-3 rounded-2xl transition-all ${isSelected ? (isDark ? 'bg-white/10 shadow-lg' : 'bg-white shadow-xl border border-black/5') : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100/50')}`}
                         >
                            <div className="flex items-center w-full">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-3 font-semibold border overflow-hidden shrink-0 ${isDark ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                                  {g.avatar_url ? <img src={g.avatar_url} className="w-full h-full object-cover" /> : <span>{g.name?.[0]?.toUpperCase()}</span>}
                               </div>
                               <div className="flex-1 min-w-0 pr-1 flex flex-col">
                                  <div className="flex items-center justify-between">
                                     <div className={`font-semibold text-[15px] flex items-center truncate ${isDark ? 'text-white/95' : 'text-gray-900'}`}>
                                        {g.name}
                                     </div>
                                  </div>
                                  <div className={`text-[13px] truncate ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{g.description || `${g.chat_group_members?.length || 1} members`}</div>
                               </div>
                            </div>
                         </button>
                         <button
                            onClick={(e) => { e.stopPropagation(); setChatContextMenu({ id: g.id, type: 'group', data: g }); }}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all ${isDark ? 'bg-black/40 border-white/10 text-white/50 hover:text-white' : 'bg-white border-black/10 text-gray-400 hover:text-black'}`}
                         >
                            <MoreVertical size={14} />
                         </button>
                       </div>
                    )
                  })}
              </>
            )}

            {activeTab === 'calls' && (
              <div className="space-y-4 px-2">
                <div className={`text-[11px] uppercase tracking-widest font-black px-3 mb-2 flex items-center justify-between ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                   <span>Call History</span>
                   <button onClick={fetchCallHistory} className={`hover:text-accent transition-colors`} title="Refresh"><Phone size={12} /></button>
                </div>
                <div className={`flex space-x-1 p-1 rounded-2xl mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                  {['All', 'Incoming', 'Outgoing', 'Missed'].map(f => (
                    <button key={f} onClick={() => setCallFilter(f as any)} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${callFilter === f ? 'bg-accent text-black shadow-lg' : isDark ? 'text-white/40 hover:text-white/60' : 'text-gray-500 hover:text-gray-700'}`}>{f}</button>
                  ))}
                </div>
                {callHistory.length === 0 ? (
                   <div className={`py-20 flex flex-col items-center justify-center text-center ${isDark ? 'opacity-20' : 'opacity-40'}`}>
                      <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center mb-4"><Phone size={32} /></div>
                      <div className="text-xs font-black uppercase tracking-[0.2em]">No Call History</div>
                      <div className="text-xs mt-2 font-medium">Calls you make will appear here</div>
                   </div>
                ) : callHistory
                    .filter(c => {
                      if (callFilter === 'All') return true;
                      if (callFilter === 'Missed') return c.status === 'missed' || (!c.ended_at && c.caller_id !== currentUser.id);
                      if (callFilter === 'Incoming') return c.receiver_id === currentUser.id;
                      if (callFilter === 'Outgoing') return c.caller_id === currentUser.id;
                      return true;
                    })
                    .map(call => {
                      const isOutgoing = call.caller_id === currentUser.id;
                      const isMissed = !call.ended_at && !isOutgoing;
                      const otherParty = isOutgoing ? call.receiver : call.caller;
                      const durationSec = call.started_at && call.ended_at
                        ? Math.round((new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000)
                        : null;
                      const durStr = durationSec ? (durationSec >= 60 ? `${Math.floor(durationSec/60)}m ${durationSec%60}s` : `${durationSec}s`) : null;
                      return (
                        <div key={call.id} className={`flex items-center p-3 rounded-2xl transition-colors group cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                          onClick={() => {
                            // Re-call this person
                            if (otherParty) setSelectedTarget({ type: 'user', data: { id: isOutgoing ? call.receiver_id : call.caller_id, name: otherParty.name, avatar_url: otherParty.avatar_url } });
                          }}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-3 border shrink-0 overflow-hidden group-hover:scale-105 transition-transform ${isDark ? 'bg-[#2a2a2a] border-white/5' : 'bg-gray-200 border-gray-200'}`}>
                            {otherParty?.avatar_url ? <img src={otherParty.avatar_url} className="w-full h-full object-cover" /> : <User size={20} className={isDark ? 'text-white/20' : 'text-gray-400'} />}
                          </div>
                          <div className="flex-1 min-w-0 pr-1">
                            <div className="flex items-center justify-between">
                              <div className={`font-bold text-[15px] truncate ${isMissed ? 'text-red-400' : isDark ? 'text-white/95' : 'text-gray-900'}`}>
                                {otherParty?.name || otherParty?.username || (isOutgoing ? 'Outgoing Call' : 'Incoming Call')}
                              </div>
                              <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-white/20' : 'text-gray-400'}`}>{getRelativeTime(call.started_at)}</div>
                            </div>
                            <div className={`flex items-center text-[11px] font-bold mt-0.5 uppercase tracking-wider ${isMissed ? 'text-red-400' : isDark ? 'text-white/30' : 'text-gray-500'}`}>
                              {isOutgoing ? <ArrowUpRight size={10} className={`mr-1 ${isDark ? 'text-accent' : 'text-green-600'}`} /> : <ArrowDownLeft size={10} className={`mr-1 ${isMissed ? 'text-red-400' : 'text-green-400'}`} />}
                              {call.call_type} · {isMissed ? 'Missed' : isOutgoing ? 'Outgoing' : 'Incoming'}
                              {durStr && <span className={`ml-2 ${isDark ? 'text-white/20' : 'text-gray-400'}`}>· {durStr}</span>}
                            </div>
                          </div>
                          <Phone size={14} className={`shrink-0 opacity-0 group-hover:opacity-100 ${isDark ? 'text-accent' : 'text-black'}`} />
                        </div>
                      );
                    })
                }
              </div>
            )}

              {activeTab === 'broadcasts' && (
              <div className="space-y-6 px-3 h-full flex flex-col">
                 <div className={`text-[11px] uppercase tracking-widest font-black px-2 ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Broadcast Center</div>
                 
                 <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-20 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {broadcasts.length === 0 ? (
                       <div className={`py-20 text-center ${isDark ? 'opacity-20' : 'opacity-40'}`}>
                          <Radio size={48} className="mx-auto mb-4" />
                          <div className="text-xs font-black uppercase tracking-widest">No Broadcasts Yet</div>
                       </div>
                    ) : broadcasts.map(b => (
                       <div key={b.id} className={`p-5 rounded-3xl border space-y-3 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                          <div className="flex items-center space-x-3">
                             <div className={`w-8 h-8 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                {b.profiles?.avatar_url ? <img src={b.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${isDark ? 'text-white' : 'text-gray-700'}`}>{b.profiles?.name?.[0]}</div>}
                             </div>
                             <div>
                                <div className={`text-xs font-bold ${isDark ? 'text-white/80' : 'text-gray-800'}`}>{b.profiles?.name || 'Admin'}</div>
                                <div className={`text-[9px] font-bold uppercase ${isDark ? 'text-white/20' : 'text-gray-400'}`}>{new Date(b.created_at).toLocaleDateString()}</div>
                             </div>
                          </div>
                          <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-gray-700'}`}>{b.content}</p>
                       </div>
                    ))}
                 </div>

                 <div className={`p-6 rounded-[2.5rem] border shadow-xl mt-auto shrink-0 mb-4 ${isDark ? 'bg-gradient-to-tr from-accent/10 to-transparent border-accent/10' : 'bg-gradient-to-tr from-yellow-50 to-white border-yellow-200'}`}>
                    <div className="flex items-center space-x-3 mb-4">
                       <div className="w-10 h-10 rounded-xl bg-accent text-black flex items-center justify-center shadow-lg shadow-accent/20"><Radio size={20} /></div>
                       <h3 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-gray-900'}`}>Global Broadcast</h3>
                    </div>
                    <textarea 
                       value={broadcastMessage}
                       onChange={e => setBroadcastMessage(e.target.value)}
                       placeholder="Enter announcement contents..."
                       className={`w-full border rounded-3xl p-4 text-sm focus:outline-none mb-4 resize-none h-24 ${isDark ? 'bg-black/40 border-white/5 text-white focus:border-accent/30' : 'bg-white border-gray-200 text-gray-900 focus:border-yellow-400'}`}
                    />
                    <button 
                       onClick={handleBroadcast}
                       disabled={!broadcastMessage.trim()}
                       className="w-full py-4 rounded-2xl bg-accent text-black font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 shadow-lg shadow-accent/20"
                    >
                       Launch Now
                    </button>
                 </div>
              </div>
            )}

            {activeTab === 'hearted' && (
              <div className="space-y-4 px-2">
                <div className="text-[11px] uppercase tracking-widest font-bold text-white/30 px-3 mb-2">Saved Content</div>
                {heartedItems.map(item => (
                  <div key={item.id} className="bg-[#1a1a1a] border border-white/5 rounded-3xl overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => onGoToTrending?.(item.id)}>
                    <div className="h-32 w-full relative bg-black">
                       {item.media_type === 'video' ? <video src={item.media_url} className="w-full h-full object-cover opacity-60" /> : <img src={item.media_url} className="w-full h-full object-cover opacity-60" />}
                    </div>
                    <div className="p-4">
                       <div className="font-bold text-white text-xs line-clamp-2">{item.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'trending' && <TrendingFeed onShare={handleTrendingShare} currentUser={currentUser} recentChats={recentChats} groups={groups} />}
          </div>

          {/* Mobile Bottom Navigation */}
          <div className={`md:hidden shrink-0 h-[70px] border-t flex items-center justify-around px-1 z-50 ${isDark ? 'border-white/10 bg-[#111]' : 'border-gray-200 bg-white'}`}>
            {[
              { id: 'chats', icon: <MessageSquare size={20} />, label: 'Chats' },
              { id: 'groups', icon: <Users size={20} />, label: 'Groups' },
              { id: 'trending', icon: <Flame size={20} />, label: 'Feeds' },
              { id: 'calls', icon: <Phone size={20} />, label: 'Calls' },
            ].map(item => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id as any)}
                 className={`flex flex-col flex-1 items-center justify-center h-full space-y-1 ${activeTab === item.id ? 'text-accent' : isDark ? 'text-white/40' : 'text-gray-400'}`}
               >
                 {item.icon}
                 <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
               </button>
            ))}
            <button onClick={() => setShowSettings(true)} className={`flex flex-col flex-1 items-center justify-center h-full space-y-1 py-1 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
               <Settings size={20} />
               <span className="text-[9px] font-bold uppercase tracking-wider">Settings</span>
            </button>
          </div>
        </div>

        {/* Chat Section (Right) */}
        {!selectedTarget.data ? (
           <div className="hidden md:flex flex-1 flex-col items-center justify-center p-20 text-center animate-in fade-in duration-700">
              <div className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 animate-bounce transition-all duration-1000 ${isDark ? 'bg-accent/10 text-accent' : 'bg-black/5 text-black/40'}`}>
                 <MessageSquare size={40} />
              </div>
              <h2 className={`text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Select a Conversation</h2>
              <p className={`max-w-sm leading-relaxed ${isDark ? 'text-white/30' : 'text-gray-500'}`}>Pick a target from the left menu or search for a user to start chatting.</p>
           </div>
        ) : (
          <div className={`flex-1 flex flex-col relative shadow-2xl ${isDark ? 'bg-[#0d0d0d]' : 'bg-white'}`}>
              {/* Header */}
              <div className={`h-20 shrink-0 flex items-center justify-between px-4 md:px-6 border-b z-10 ${isDark ? 'border-white/5 bg-black/40 backdrop-blur-xl' : 'border-gray-200 bg-white/80 backdrop-blur-xl'}`}>
                 <div className="flex items-center flex-1 min-w-0">
                    <button onClick={() => setSelectedTarget({ type: null, data: null })} className={`md:hidden mr-3 p-2.5 rounded-full ${isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-black'}`}><ArrowLeft size={20} /></button>
                     <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 font-semibold border overflow-hidden shrink-0 cursor-zoom-in ${isDark ? 'bg-[#2a2a2a] border-white/5' : 'bg-gray-200 border-gray-300'}`}
                        onClick={() => { if (selectedTarget.data?.avatar_url) setZoomedImage(selectedTarget.data.avatar_url); }}
                     >
                        {selectedTarget.data?.avatar_url
                          ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" />
                          : <span className={isDark ? 'text-white/40' : 'text-gray-500'}>{selectedTarget.data?.name?.[0]?.toUpperCase() || '?'}</span>
                        }
                     </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { if (selectedTarget.type === 'group') setShowMembers(true); }}>
                       <div className={`font-bold text-[16px] truncate ${isDark ? 'text-white/95' : 'text-gray-900'}`}>{selectedTarget.data.name || `@${selectedTarget.data.username}`}</div>
                       <div className={`text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-gray-400'}`}>{selectedTarget.type === 'user' ? (isOnline(selectedTarget.data.id) ? 'ONLINE' : 'OFFLINE') : `${selectedTarget.data.chat_group_members?.length || 1} MEMBERS`}</div>
                    </div>
                 </div>
                 <div className="flex items-center space-x-2">
                    <button onClick={() => handleCall('audio')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'text-white/30 hover:text-accent hover:bg-white/5' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}><Phone size={18} /></button>
                    <button onClick={() => handleCall('video')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'text-white/30 hover:text-accent hover:bg-white/5' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}><Video size={18} /></button>
                    <button onClick={() => setShowMembers(true)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isDark ? 'text-white/30 hover:text-accent hover:bg-white/5' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}><MoreVertical size={18} /></button>
                 </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                 {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                       <MessageSquare size={64} className="mb-4" />
                       <div className="text-sm font-bold uppercase tracking-[0.2em]">Start a secure conversation</div>
                    </div>
                 )}
                  {messages.map((m: any, idx: number) => {
                    const isMe = m.sender_id === currentUser?.id;
                    const showTime = idx === 0 || new Date(m.created_at).getTime() - new Date(messages[idx-1].created_at).getTime() > 300000;
                    
                    // Unified profile lookup for the sender
                    const senderProfile = m.sender || (selectedTarget.type === 'group' 
                      ? selectedTarget.data.chat_group_members?.find((mb: any) => mb.user_id === m.sender_id)?.profiles
                      : (isMe ? (currentUser?.profile || currentUser) : selectedTarget.data));

                    return (
                       <div key={m.id} className="space-y-2">
                          {showTime && <div className="text-center py-4"><span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${isDark ? 'text-white/20 bg-white/5' : 'text-gray-400 bg-gray-200'}`}>{formatDatePill(m.created_at)}</span></div>}
                          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-3 group/msg`}>
                              {!isMe && (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden border ${isDark ? 'bg-[#2a2a2a] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                                  {senderProfile?.avatar_url ? (
                                    <img src={senderProfile.avatar_url} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-[10px] font-bold text-white/40">{(senderProfile?.name || senderProfile?.username || '?')[0].toUpperCase()}</span>
                                  )}
                                </div>
                              )}
                              <div className={`max-w-[80%] lg:max-w-[60%] px-4 py-3 rounded-[1.5rem] shadow-sm relative ${isMe ? 'bg-accent text-black rounded-tr-none' : (isDark ? 'bg-[#1e1e1e] text-white rounded-tl-none border border-white/5' : 'bg-white text-gray-900 rounded-tl-none border border-gray-100')}`}>
                              {/* Group sender name badge */}
                              {selectedTarget.type === 'group' && !isMe && (
                                <div className={`text-[10px] font-black mb-1 uppercase tracking-wider ${isDark ? 'text-accent' : 'text-accent/80'}`}>{senderProfile?.name || `@${senderProfile?.username}`}</div>
                              )}
                                {m.content && (() => {
                                    const trendingMatch = m.content.match(/\[TRENDING:(.+)\]/);
                                     if (trendingMatch) return (
                                       <div onClick={() => { onGoToTrending?.(trendingMatch[1]); }} className="cursor-pointer">
                                         <TrendingPreviewCard contentId={trendingMatch[1]} onGoToTrending={onGoToTrending} isDark={isDark} />
                                       </div>
                                     );
                                     
                                     const gameMatch = m.content.match(/\[GAME_INVITE:(.+):(.+):(.+)(?::(.+))?\]/);
                                     // The person who SENT this message is the host/inviter.
                                     // If the current user sent it, they are the host (isInviter=true).
                                     // If they are clicking Join, they are a guest (isInviter=false).
                                     const currentUserIsHost = m.sender_id === currentUser.id;
                                     if (gameMatch) return <GameInviteCard gameType={gameMatch[1]} roomId={gameMatch[2]} launcherName={gameMatch[3]} invitedIds={gameMatch[4] ? gameMatch[4].split(',') : []} currentUserId={currentUser.id} isFinished={false} onJoin={() => setActiveGame({ type: gameMatch[1], roomId: gameMatch[2], isInviter: currentUserIsHost })} isDark={isDark} />;
 
                                     // Mention highlighting
                                     const parts = m.content.split(/(@\w+)/g);
                                     return (
                                       <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                                         {(parts as string[]).map((part: string, i: number) => {
                                           if (part.startsWith('@')) {
                                             return <span key={i} className={`font-bold ${isMe ? 'text-black underline' : 'text-accent'}`}>{part}</span>;
                                           }
                                           return part;
                                         })}
                                       </p>
                                     );
                                  })()}
                                {m.attachment_url && (
                                   m.attachment_type?.startsWith('image/') ? (
                                      <img src={m.attachment_url} className="rounded-xl max-w-full cursor-zoom-in mt-1 hover:opacity-90 transition-opacity" onClick={() => setZoomedImage(m.attachment_url)} />
                                   ) : (
                                      <a href={m.attachment_url} target="_blank" className={`flex items-center p-3 rounded-xl mt-1 transition-colors border ${isDark ? 'bg-black/20 hover:bg-black/30 border-white/5' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'}`}>
                                         <File size={20} className="mr-3 opacity-60" />
                                         <span className="text-xs font-semibold truncate">Download File</span>
                                      </a>
                                   )
                                )}
                                <div className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider ${isMe ? 'text-black/40' : isDark ? 'text-white/20' : 'text-gray-400'}`}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                             </div>
                          </div>
                       </div>
                    )
                 })}
                 <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className={`p-6 shrink-0 border-t ${isDark ? 'bg-black/20 backdrop-blur-md border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                 <form onSubmit={handleSend} className="flex items-end space-x-3 max-w-5xl mx-auto">
                    <div className="flex items-center space-x-2 mb-0.5">
                       <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-white/30 hover:text-white hover:bg-white/10' : 'bg-gray-200 text-gray-500 hover:bg-gray-300 hover:text-gray-800'}`}><Paperclip size={20} /></button>
                        <button 
                           type="button" 
                           onClick={() => selectedTarget.type === 'group' ? setShowGameSelector({ groupId: selectedTarget.data.id }) : setShowGameCenter(true)} 
                           className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDark ? 'bg-accent/10 text-accent hover:bg-accent/20' : 'bg-lime-500/20 text-lime-700 hover:bg-lime-500/30'}`}
                        >
                           <Gamepad2 size={20} />
                        </button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <div className="flex-1 relative">
                       <textarea 
                           value={newMessage}
                           onChange={e => {
                             const val = e.target.value;
                             setNewMessage(val);
                             const lastAt = val.lastIndexOf('@');
                             if (lastAt !== -1 && selectedTarget.type === 'group') {
                               const query = val.slice(lastAt + 1).split(/\s/)[0];
                               setMentionQuery(query);
                               const members = groups.find((g: any) => g.id === selectedTarget.data.id)?.chat_group_members || [];
                               const matches = members.filter((m: any) => m.profiles?.username?.toLowerCase().includes(query.toLowerCase()) || m.profiles?.name?.toLowerCase().includes(query.toLowerCase()));
                               setMentionSuggestions(matches.length > 0 ? matches : null);
                             } else {
                               setMentionSuggestions(null);
                             }
                           }}
                           onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                           placeholder={`Message ${selectedTarget.data.name || 'group'}...`}
                           className={`w-full border rounded-[1.5rem] pl-6 pr-14 py-4 text-[15px] focus:outline-none transition-all resize-none max-h-40 h-[56px] ${isDark ? 'bg-white/5 border-white/5 text-white focus:border-accent/30 placeholder:text-white/20' : 'bg-white border-gray-200 text-gray-900 focus:border-gray-400 placeholder:text-gray-400 shadow-sm'}`}
                        />
                        {mentionSuggestions && (
                          <div className={`absolute bottom-full left-0 mb-2 w-64 border rounded-2xl shadow-2xl overflow-hidden z-[100] ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`}>
                            {mentionSuggestions.slice(0, 5).map((m: any) => (
                              <button
                                key={m.user_id}
                                onClick={() => {
                                  const base = newMessage.slice(0, newMessage.lastIndexOf('@'));
                                  setNewMessage(`${base}@${m.profiles?.username || m.profiles?.name} `);
                                  setMentionSuggestions(null);
                                }}
                                className={`w-full flex items-center p-3 text-left transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                              >
                                <div className="w-8 h-8 rounded-full overflow-hidden mr-3 bg-accent/20 flex items-center justify-center text-xs">
                                  {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover" /> : m.profiles?.name?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.profiles?.name}</div>
                                  <div className={`text-[10px] truncate ${isDark ? 'text-white/40' : 'text-gray-500'}`}>@{m.profiles?.username}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                       <button type="button" className={`absolute right-4 top-4 transition-colors ${isDark ? 'text-white/20 hover:text-[#eaff96]' : 'text-gray-400 hover:text-gray-700'}`}><Smile size={20} /></button>
                    </div>
                    <button 
                       type="submit"
                       disabled={!newMessage.trim() && !isUploadingFile}
                       className="w-12 h-12 rounded-2xl bg-[#eaff96] text-black shadow-lg shadow-[#eaff96]/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all mb-0.5 disabled:opacity-50"
                    >
                       {isUploadingFile ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                 </form>
              </div>
          </div>
        )}

        {/* Info Panel (Rightmost) */}
        {selectedTarget.data && showMembers && (
          <div className="hidden lg:flex w-[350px] flex-col border-l border-white/5 bg-black/40 backdrop-blur-3xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Details</h3>
              <button onClick={() => setShowMembers(false)} className="w-8 h-8 rounded-full bg-white/5 text-white/60 flex items-center justify-center hover:bg-white/10 transition-all"><X size={16} /></button>
            </div>

            <div className="flex flex-col items-center mb-10">
              <div
                className="w-32 h-32 rounded-[2.5rem] bg-[#222] border-4 border-white/5 shadow-2xl overflow-hidden mb-6 group relative cursor-zoom-in"
                onClick={() => { if (selectedTarget.data?.avatar_url) setZoomedImage(selectedTarget.data.avatar_url); }}
              >
                {selectedTarget.data.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : (selectedTarget.type === 'user' ? <User size={48} className="text-white/10" /> : <Users size={48} className="text-white/10" />)}
                {selectedTarget.data?.avatar_url && <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ZoomIn size={24} className="text-white" /></div>}
              </div>
              <h4 className={`text-xl font-black text-center pb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedTarget.data.name || `@${selectedTarget.data.username}`}</h4>
              <p className={`text-sm text-center max-w-[200px] leading-relaxed ${isDark ? 'text-white/30' : 'text-gray-500'}`}>{selectedTarget.data.description || selectedTarget.data.bio || 'Encrypted connection'}</p>
            </div>

            <div className="space-y-8">
              {/* Shared Media */}
              <div className="space-y-3">
                <div className={`flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                  <span>Media</span>
                  <span>{sharedImages.length}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                   {sharedImages.slice(0, 6).map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-white/5 overflow-hidden cursor-zoom-in hover:brightness-125 transition-all" onClick={() => setZoomedImage(img.attachment_url)}>
                         <img src={img.attachment_url} className="w-full h-full object-cover" />
                      </div>
                   ))}
                </div>
              </div>

              {/* Shared Links */}
              <div className="space-y-3">
                <div className={`flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
                  <span>Links</span>
                  <span>{sharedLinks.length}</span>
                </div>
                <div className="space-y-3">
                   {sharedLinks.slice(0, 3).map((link, i) => (
                      <a key={i} href={link} target="_blank" className="flex items-center group">
                         <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform"><LinkIcon size={16} /></div>
                         <div className="flex-1 min-w-0"><div className="text-xs font-bold text-white/80 truncate group-hover:text-white transition-colors">{link}</div></div>
                      </a>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Overlays / Modals Omitted for brevity: StoryViewer, InviteModal, CreateGroup, etc. */}
      {showMembers && selectedTarget.type === 'group' && (() => {
        const activeGroup = groups.find((g: any) => g.id === selectedTarget.data.id);
        const isAdmin = activeGroup?.chat_group_members?.find((m: any) => m.user_id === currentUser.id)?.is_admin || activeGroup?.creator_id === currentUser.id;
        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowMembers(false)}>
            <div className="bg-[#141414] border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
               <div className="h-32 bg-gradient-to-tr from-[#eaff96]/20 to-indigo-500/10 shrink-0 relative flex items-center justify-center">
                  <button onClick={() => setShowMembers(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition-colors z-20"><X size={20} /></button>
                  <div className="relative -mb-16">
                     <div className="w-24 h-24 rounded-3xl bg-[#1e1e1e] border-4 border-[#141414] overflow-hidden flex items-center justify-center">
                        {activeGroup?.avatar_url ? <img src={activeGroup.avatar_url} className="w-full h-full object-cover" /> : <Users size={40} className="text-white/10" />}
                        {isUpdatingGroup && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-[#eaff96]" /></div>}
                     </div>
                     {isAdmin && (
                        <button onClick={() => groupAvatarInputRef.current?.click()} className="absolute bottom-[-8px] right-[-8px] w-8 h-8 rounded-xl bg-[#eaff96] text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform"><ImageIcon size={14} /></button>
                     )}
                     <input type="file" ref={groupAvatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleGroupAvatarUpload(e, activeGroup.id)} />
                  </div>
               </div>
               <div className="px-8 pt-20 pb-8 overflow-y-auto">
                  <div className="text-center mb-8">
                     <h3 className="text-2xl font-black text-white">{activeGroup?.name}</h3>
                     <p className="text-sm text-white/40 mt-1">{activeGroup?.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                     <div className={`text-[11px] uppercase tracking-widest font-bold ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Members · {activeGroup?.chat_group_members?.length}</div>
                     {isAdmin && <button onClick={() => setShowInviteModal(true)} className="text-[11px] uppercase tracking-widest font-black text-accent hover:brightness-125">+ Add Members</button>}
                  </div>

                  <div className="space-y-1">
                     {activeGroup?.chat_group_members?.map((m: any, idx: number) => {
                       const isMe = m.user_id === currentUser.id;
                       const isMemberAdmin = m.is_admin || activeGroup.creator_id === m.user_id;
                       return (
                         <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl transition-colors group/m ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
                            <div className="flex items-center space-x-3 shrink-0">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border ${isDark ? 'bg-[#2a2a2a] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                                  {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className={`font-bold text-xs ${isDark ? '' : 'text-gray-400'}`}>{m.profiles?.name?.[0]?.toUpperCase()}</div>}
                               </div>
                               <div>
                                  <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.profiles?.name || `@${m.profiles?.username}`} {isMe && '(You)'}</div>
                                  <div className={`text-[11px] ${isDark ? 'text-white/30' : 'text-gray-500'}`}>@{m.profiles?.username}</div>
                               </div>
                            </div>
                            <div className="flex items-center space-x-2">
                               {isMemberAdmin && <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Admin</span>}
                               {isAdmin && !isMe && (
                                  <div className="flex space-x-1 opacity-0 group-hover/m:opacity-100 transition-opacity">
                                     <button onClick={() => toggleAdminStatus(activeGroup.id, m.user_id, m.is_admin)} className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-gray-100 text-gray-400 hover:text-black'}`}><Crown size={14} /></button>
                                     <button onClick={() => kickGroupMember(activeGroup.id, m.user_id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2 size={14} /></button>
                                  </div>
                               )}
                            </div>
                         </div>
                       )
                     })}
                  </div>
               </div>
            </div>
          </div>
        )
      })()}

      {chatContextMenu && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center" onClick={() => setChatContextMenu(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className={`relative border rounded-3xl p-2 w-full max-w-sm shadow-2xl mx-4 mb-6 md:mb-0 animate-in slide-in-from-bottom-4 ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-4 py-3 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
               <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{chatContextMenu.data?.name || 'Options'}</div>
            </div>

            <button onClick={() => archiveChat(chatContextMenu.type, chatContextMenu.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors text-left ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
               <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><Archive size={16} className="text-blue-400" /></div>
               <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{archivedChatIds.has(chatContextMenu.id) ? 'Unarchive' : 'Archive'}</div>
            </button>
            <button onClick={() => togglePinChat(chatContextMenu.type, chatContextMenu.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors text-left ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center"><Pin size={16} className="text-accent" /></div>
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{pinnedChatIds.has(chatContextMenu.id) ? 'Unpin' : 'Pin'}</div>
             </button>
            {chatContextMenu.type === 'user' ? (
              <button onClick={() => deleteDirectChat(chatContextMenu.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors text-left ${isDark ? 'hover:bg-red-500/5' : 'hover:bg-gray-100'}`}>
                 <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center"><Trash2 size={16} className="text-red-400" /></div>
                 <div className={`font-semibold ${isDark ? 'text-red-400' : 'text-gray-900'}`}>Delete Chat</div>
              </button>
            ) : (
              <button onClick={() => leaveGroup(chatContextMenu.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-colors text-left ${isDark ? 'hover:bg-orange-500/5' : 'hover:bg-gray-100'}`}>
                 <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center"><DoorOpen size={16} className="text-orange-400" /></div>
                 <div className={`font-semibold ${isDark ? 'text-orange-400' : 'text-gray-900'}`}>Leave Group</div>
              </button>
            )}
          </div>
        </div>
      )}

      {showInviteModal && selectedTarget.type === 'group' && (
        <InviteMemberModal currentUser={currentUser} groupId={selectedTarget.data.id} onClose={() => setShowInviteModal(false)} onSuccess={() => { setShowInviteModal(false); fetchGroups(); }} />
      )}

      {showCreateGroup && (
        <CreateGroupModal currentUser={currentUser} onClose={() => setShowCreateGroup(false)} onSuccess={(g) => { setShowCreateGroup(false); fetchGroups(); setSelectedTarget({ type: 'group', data: g }); }} />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} currentUser={currentUser} />}

      {zoomedImage && <ZoomedImageModal imageUrl={zoomedImage} onClose={() => setZoomedImage(null)} />}
      {storyViewerOpen && stories.length > 0 && (
         <StoryViewer 
            storyGroups={Array.from(new Set(stories.map(s => s.user_id))).map(uid => {
              const userStories = stories.filter(s => s.user_id === uid);
              const user = userStories[0]?.profiles;
              return {
                userId: uid,
                profile: { 
                  name: user?.name || 'User', 
                  username: user?.username || 'user', 
                  avatar_url: user?.avatar_url 
                },
                stories: userStories.map(s => ({
                  id: s.id,
                  user_id: s.user_id,
                  media_url: s.media_url,
                  caption: s.caption,
                  created_at: s.created_at,
                  profiles: user
                }))
              };
            })} 
            initialGroupIndex={storyViewerGroupIndex}
            currentUser={currentUser}
            onClose={() => setStoryViewerOpen(false)} 
            onDeleted={handleStoryDeleted} 
         />
      )}

      {pendingStoryFile && (
         <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className={`w-full max-w-sm ${isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/10'} border rounded-3xl p-6 relative`}>
               <button onClick={() => setPendingStoryFile(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 text-gray-400 hover:text-white flex items-center justify-center transition-all"><X size={18} /></button>
               <h2 className={`text-xl font-black mb-4 ${isDark ? 'text-white' : 'text-black'}`}>New Story</h2>
               <div className="w-full aspect-[9/16] rounded-2xl bg-black mb-4 overflow-hidden relative">
                  {pendingStoryFile.type.startsWith('video/') ? (
                    <video src={URL.createObjectURL(pendingStoryFile)} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={URL.createObjectURL(pendingStoryFile)} className="w-full h-full object-cover" />
                  )}
               </div>
               <input 
                 value={storyCaption}
                 onChange={e => setStoryCaption(e.target.value)}
                 placeholder="Add a caption..."
                 className={`w-full bg-black/5 border border-black/10 rounded-xl px-4 py-3 mb-4 focus:outline-none placeholder:text-gray-400 ${isDark ? 'text-white bg-white/5 border-white/10 placeholder:text-white/40' : 'text-black'}`}
               />
               <button 
                 onClick={handleStoryUpload}
                 disabled={uploadingStory}
                 className="w-full py-4 bg-[#eaff96] text-black rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {uploadingStory ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                 {uploadingStory ? 'Posting...' : 'Post Story'}
               </button>
            </div>
         </div>
      )}

      {showGameSelector && (
         <div className="fixed inset-0 z-[160] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#eaff96] to-transparent animate-pulse" />
               <button onClick={() => setShowGameSelector(null)} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 text-white/40 hover:text-white flex items-center justify-center"><X size={24} /></button>
               
               <h2 className="text-3xl font-black text-white mb-2">Invite Players</h2>
               <p className="text-white/30 font-bold uppercase tracking-widest text-[10px] mb-8">Select members to challenge in {selectedTarget.data?.name}</p>
               
               <div className="space-y-2 max-h-[300px] overflow-y-auto mb-8 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {selectedTarget.data?.chat_group_members?.filter((m: any) => m.user_id !== currentUser.id).map((member: any) => (
                     <button 
                        key={member.user_id}
                        onClick={() => setSelectedGameMembers(prev => prev.includes(member.user_id) ? prev.filter(id => id !== member.user_id) : [...prev, member.user_id])}
                        className={`w-full flex items-center p-4 rounded-2xl transition-all border ${selectedGameMembers.includes(member.user_id) ? 'bg-[#eaff96]/10 border-[#eaff96]/50' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                     >
                        <div className="w-10 h-10 rounded-full bg-white/10 mr-4 overflow-hidden">
                           {member.profiles?.avatar_url ? <img src={member.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">{member.profiles?.name?.[0]}</div>}
                        </div>
                        <div className="flex-1 text-left">
                           <div className="font-bold text-white mb-0.5">{member.profiles?.name || 'Member'}</div>
                           <div className="text-[10px] text-white/30 font-bold uppercase">@{member.profiles?.username || 'user'}</div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedGameMembers.includes(member.user_id) ? 'bg-[#eaff96] border-[#eaff96]' : 'border-white/20'}`}>
                           {selectedGameMembers.includes(member.user_id) && <Check size={14} className="text-black" />}
                        </div>
                     </button>
                  ))}
               </div>

               <button 
                  onClick={() => setShowGameCenter(true)}
                  disabled={selectedGameMembers.length === 0}
                  className="w-full py-5 bg-[#eaff96] text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#eaff96]/10 disabled:opacity-20 flex items-center justify-center gap-2"
               >
                  Next: Select Game <ArrowRight size={18} />
               </button>
            </div>
         </div>
      )}

      {showGameCenter && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-500">
           <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 relative">
              <button onClick={() => setShowGameCenter(false)} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 text-white/40 hover:text-white flex items-center justify-center transition-all"><X size={24} /></button>
              <div className="mb-12 text-center">
                 <div className="w-16 h-16 rounded-2xl bg-[#eaff96] text-black flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(234,255,150,0.3)] rotate-12"><Gamepad2 size={32} /></div>
                 <h2 className="text-4xl font-black text-white mb-2">Arcade Center</h2>
                 <p className="text-white/30 font-bold uppercase tracking-widest text-[11px]">Choose a game {selectedTarget.type === 'group' ? `for ${selectedGameMembers.length} selected players` : `to challenge ${selectedTarget.data.name}`}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {Object.entries(GAME_TYPES).map(([id, g]) => (
                    <div key={id} className="group relative bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 hover:bg-[#1a1a1a] hover:border-[#eaff96]/20 hover:-translate-y-2 transition-all cursor-pointer overflow-hidden" onClick={() => handleLaunchGame(id, selectedGameMembers)}>
                       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#eaff96]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">{g.icon}</div>
                       <h3 className="text-xl font-black text-white mb-2">{g.name}</h3>
                       <p className="text-sm text-white/40 leading-relaxed">{g.desc}</p>
                       <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#eaff96]">Quick Start</span>
                          <ChevronRight size={16} className="text-[#eaff96]" />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeCall && (
        <CallOverlay
          callType={activeCall.type}
          roomId={activeCall.room}
          isCaller={callingStatus === 'calling' || currentUser.id === callSession?.caller_id}
          targetName={activeCall.title}
          currentUser={currentUser}
          onEnd={handleEndCall}
        />
      )}

      {activeGame && (
        <GameOverlay 
          gameType={activeGame.type}
          roomId={activeGame.roomId}
          currentUser={currentUser} 
          targetType={selectedTarget.type}
          targetData={selectedTarget.data}
          isInviter={activeGame.isInviter}
          onClose={() => setActiveGame(null)} 
        />
      )}

       {incomingCall && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] w-full max-w-md bg-[#141414]/95 backdrop-blur-3xl border border-[#eaff96]/30 rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-top-10 duration-500">
           <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                 <div className="w-14 h-14 rounded-2xl bg-[#eaff96] text-black flex items-center justify-center animate-bounce shadow-lg shadow-[#eaff96]/20 overflow-hidden">
                    {incomingCall.caller_avatar ? <img src={incomingCall.caller_avatar} className="w-full h-full object-cover" /> : (incomingCall.type === 'video' ? <Video size={24} /> : <Phone size={24} />)}
                 </div>
                 <div>
                    <div className="text-[10px] font-black text-[#eaff96] uppercase tracking-widest mb-0.5">Incoming {incomingCall.type} call</div>
                    <div className="text-lg font-black text-white">{incomingCall.caller_name || 'Someone'}</div>
                 </div>
              </div>
              <div className="flex items-center space-x-2">
                 <button
                   onClick={async () => {
                     const callerChannel = `chat:${incomingCall.caller_id}`;
                     // Notify rejection
                     await insforge.realtime.subscribe(callerChannel);
                     insforge.realtime.publish(callerChannel, 'call_rejected', { room: incomingCall.room });
                     if (incomingCall.call_id) {
                       await insforge.database.from('call_history').update({ status: 'missed', ended_at: new Date().toISOString() }).eq('id', incomingCall.call_id);
                     }
                     setIncomingCall(null);
                     fetchCallHistory();
                   }}
                   className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                 ><X size={20} /></button>
                 <button
                   onClick={async () => {
                     const callerChannel = `chat:${incomingCall.caller_id}`;
                     // Notify acceptance
                     await insforge.realtime.subscribe(callerChannel);
                     insforge.realtime.publish(callerChannel, 'call_accepted', { room: incomingCall.room });
                     if (incomingCall.call_id) {
                       await insforge.database.from('call_history').update({ status: 'completed' }).eq('id', incomingCall.call_id);
                     }
                     callStartTimeRef.current = Date.now();
                     setActiveCall({ type: incomingCall.type, room: incomingCall.room, title: incomingCall.caller_name || 'Call', callId: incomingCall.call_id });
                     setIncomingCall(null);
                   }}
                   className="w-10 h-10 rounded-xl bg-[#eaff96] text-black flex items-center justify-center hover:scale-110 transition-all shadow-lg"
                 ><Phone size={20} /></button>
              </div>
           </div>
        </div>
      )}

      {(callingStatus === 'calling' || callingStatus === 'ringing') && callSession && (
        <div className="fixed inset-0 z-[400] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-6">
           <div className="relative mb-8">
              <div className="w-32 h-32 rounded-[3rem] bg-[#1a1a1a] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                 {callSession.target?.avatar_url ? <img src={callSession.target.avatar_url} className="w-full h-full object-cover" /> : <User size={48} className="text-white/10" />}
              </div>
              <div className="absolute inset-0 rounded-[3rem] border-2 border-accent animate-ping opacity-30" />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-accent text-black flex items-center justify-center">
                 {callSession.type === 'video' ? <Video size={18} /> : <Phone size={18} />}
              </div>
           </div>
           <h2 className="text-3xl font-black text-white mb-2">{callSession.target?.name || callSession.target?.username || 'User'}</h2>
           <p className="text-[#eaff96] font-black uppercase tracking-[0.3em] text-xs animate-pulse">{callingStatus}...</p>
           
           <div className="mt-16">
              <button 
                onClick={handleEndCall}
                className="w-16 h-16 rounded-3xl bg-red-500 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-red-500/20"
              >
                <X size={32} />
              </button>
           </div>
        </div>
      )}

    </div>
  );
}
