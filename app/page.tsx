'use client';

import { useEffect, useState } from 'react';
import { insforge } from '../lib/insforge';
import ChatRoom from '../components/ChatRoom';
import Auth from '../components/Auth';
import Landing from '../components/Landing';
import TrendingFeed from '../components/TrendingFeed';

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'landing' | 'auth' | 'chat' | 'trending'>('landing');
  const [isDark, setIsDark] = useState(true);
  const [trendingId, setTrendingId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const savedTheme = localStorage.getItem('chatifyTheme');
    const dark = savedTheme === null ? true : savedTheme === 'true';
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('chatifyTheme', String(next));
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return next;
    });
  };


  useEffect(() => {
    const fetchAndSetSession = async (authSession: any) => {
      if (!authSession?.user) {
        setSession(null);
        setView('landing');
        setLoading(false);
        return;
      }
      
      // CRITICAL: Hydrate the SDK with the restored token!
      if (typeof window !== 'undefined' && (insforge.auth as any).saveSessionFromResponse) {
         (insforge.auth as any).saveSessionFromResponse(authSession);
      } else if (typeof window !== 'undefined' && (insforge.auth as any).http) {
         (insforge.auth as any).http.setAuthToken(authSession.accessToken);
      }

      try {
        const { data: profile } = await insforge.database
          .from('profiles')
          .select('*')
          .eq('id', authSession.user.id)
          .single();
        
        setSession({
          ...authSession,
          user: {
            ...authSession.user,
            profile: profile || null
          }
        });
        setView('chat');
      } catch (err: any) {
        // If the token is rejected (e.g. Invalid token / expired), clear it and force login
        if (err?.message?.includes('Invalid token') || err?.statusCode === 401 || err?.statusCode === 403) {
           localStorage.removeItem('insforge_oauth_backup');
           (insforge.auth as any).tokenManager?.clearSession?.();
           setSession(null);
           setView('landing');
        } else {
           // Network error but token might be valid
           setSession(authSession);
           setView('chat');
        }
      }
      setLoading(false);
    };

    // getCurrentSession handles OAuth callback params automatically
    insforge.auth.getCurrentSession().then(({ data }) => {
      // Check if user specifically requested landing page via URL param
      const url = new URL(window.location.href);
      const forceLanding = url.searchParams.get('view') === 'landing';
      let activeSession = data.session;

      // WORKAROUND: The Insforge SDK sets memory mode on OAuth logins, which
      // drops the token on reload. We manually back it up to localStorage.
      if (activeSession) {
        localStorage.setItem('insforge_oauth_backup', JSON.stringify(activeSession));
      } else {
        const backup = localStorage.getItem('insforge_oauth_backup');
        if (backup) {
          try {
            activeSession = JSON.parse(backup);
          } catch (e) {
            localStorage.removeItem('insforge_oauth_backup');
          }
        }
      }

      if (activeSession && !forceLanding) {
        fetchAndSetSession(activeSession);
      } else {
        const remembered = localStorage.getItem('chatRemember');
        if (remembered && !forceLanding) {
          try {
            const { email, password } = JSON.parse(remembered);
            insforge.auth.signInWithPassword({ email, password }).then((res) => {
              if ((res.data as any)?.session || res.data?.accessToken) {
                const newSession = (res.data as any)?.session || res.data;
                localStorage.setItem('insforge_oauth_backup', JSON.stringify(newSession));
                fetchAndSetSession(newSession);
              } else {
                setView('landing');
                setLoading(false);
              }
            });
          } catch (e) {
            setView('landing');
            setLoading(false);
          }
        } else {
          // Check if we're returning from OAuth (URL may have auth params)
          const hasOAuthParams = url.searchParams.has('access_token') || 
                                  url.searchParams.has('code') || 
                                  url.hash.includes('access_token') ||
                                  url.searchParams.has('insforge_code');
          if (hasOAuthParams && !forceLanding) {
            // Give SDK a moment to process the callback params
            setTimeout(() => {
              insforge.auth.getCurrentSession().then(({ data: retryData }) => {
                let retrySession = retryData.session;
                if (retrySession) {
                  localStorage.setItem('insforge_oauth_backup', JSON.stringify(retrySession));
                  fetchAndSetSession(retrySession);
                } else {
                  setView('landing');
                  setLoading(false);
                }
              });
            }, 500);
          } else {
            setView('landing');
            setLoading(false);
          }
        }
      }
    });
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('insforge_oauth_backup');
    setSession(null);
    setView('landing');
  };

  const handleProfileUpdate = (profileData: any) => {
    setSession((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        user: { ...prev.user, profile: profileData }
      };
    });
  };

  const commonProps = {
    isDark,
    onToggleTheme: toggleTheme
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center transition-all">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#eaff96] flex items-center justify-center animate-pulse shadow-lg shadow-[#eaff96]/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/>
            </svg>
          </div>
          <div className="w-6 h-6 border-2 border-white/20 border-t-[#eaff96] rounded-full animate-spin" />
        </div>
      </div>
    );
  }


  if (view === 'chat' && session) {
    return (
      <div className="h-screen w-full transition-all overflow-hidden">
        <ChatRoom 
          session={session} 
          onSignOut={handleSignOut} 
          onGoToLanding={() => setView('landing')}
          onProfileUpdate={handleProfileUpdate}
          onGoToTrending={(id) => { setView('trending'); setTrendingId(id); }}
          {...commonProps}
        />
      </div>
    );
  }


  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans transition-all">
        <div className="p-6 absolute top-0 left-0 z-10">
          <button
            onClick={() => setView('landing')}
            className="text-white/50 hover:text-white transition-colors text-sm flex items-center font-semibold bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-white/10"
          >
            ← Back to home
          </button>
        </div>
        <div className="flex-1 flex flex-col pt-16">
          <Auth 
            onAuthSuccess={(newSession) => { setSession(newSession); setView('chat'); }} 
            {...commonProps}
          />
        </div>
      </div>
    );
  }


  if (view === 'trending') {
    return (
      <div className="h-[100dvh] w-full bg-background relative flex flex-col items-center justify-center transition-all">
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-50">
          <button
            onClick={() => setView('landing')}
            className="text-white/70 hover:text-white transition-colors text-sm flex items-center font-bold bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 hover:bg-white/20 shadow-xl"
          >
            ← Back to Home
          </button>
        </div>


        {/* If not logged in, show a sign-in nudge banner */}
        {!session && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 hidden md:flex">
            <div className="bg-[#eaff96]/10 border border-[#eaff96]/20 backdrop-blur-xl rounded-full px-5 py-2 flex items-center gap-3">
              <span className="text-white/60 text-[13px]">Sign in to share & bookmark trending content</span>
              <button
                onClick={() => setView('auth')}
                className="px-4 py-1.5 bg-[#eaff96] text-black text-[12px] font-black rounded-full hover:bg-white transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        <div className="w-full h-full max-w-[440px] bg-black relative md:rounded-[2.5rem] md:h-[85vh] md:border-[6px] md:border-white/10 overflow-hidden flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.6)]">
          <TrendingFeed
            currentUser={session?.user || null}
            initialContentId={trendingId}
            {...commonProps}
            onShare={(contentId, targetType, targetData) => {
              if (!session) {
                setView('auth');
                return;
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <Landing
      session={session}
      {...commonProps}
      onGetStarted={() => {

        if (session) {
          setView('chat');
        } else {
          setView('auth');
        }
      }}
      onGoToTrending={() => { setTrendingId(undefined); setView('trending'); }}
      onSignOut={handleSignOut}
      onProfileUpdate={handleProfileUpdate}
    />
  );
}
