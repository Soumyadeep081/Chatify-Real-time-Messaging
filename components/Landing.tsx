'use client';

import { MessageSquare, Zap, Shield, Users, ArrowRight, CheckCircle2, Star, Globe, Smartphone, Lock, Gamepad2, Flame, Sun, Moon, User, LogOut, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import ProfilePanel from './ProfilePanel';
import ZoomedImageModal from './ZoomedImageModal';

export default function Landing({ session, onGetStarted, onGoToTrending, onSignOut, onProfileUpdate, isDark, onToggleTheme }: {
  session?: any;
  onGetStarted: () => void;
  onGoToTrending?: () => void;
  onSignOut?: () => void;
  onProfileUpdate?: (profileData: any) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);


  useEffect(() => {
    setIsVisible(true);
  }, []);

  const user = session?.user;
  const profileName = user?.profile?.name || (user?.profile?.username ? `@${user.profile.username}` : 'My Profile');
  const profileAvatar = user?.profile?.avatar_url;
  const initials = profileName[0]?.toUpperCase();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);


  return (
    <div className="min-h-screen bg-background text-foreground transition-all selection:bg-accent/30 font-sans flex flex-col overflow-x-hidden">
      
      {/* Profile Panel overlay */}
      {showProfile && session && (
        <ProfilePanel
          session={session}
          onClose={() => setShowProfile(false)}
          onSignOut={() => { setShowProfile(false); onSignOut?.(); }}
          onGoToChat={onGetStarted}
          onProfileUpdate={onProfileUpdate}
        />
      )}

      {/* 1. Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-[#eaff96]' : 'bg-accent'} flex items-center justify-center shadow-lg shadow-accent/10`}>
            <MessageSquare size={20} className="text-black" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-foreground">Chatify</span>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onToggleTheme} 
            className={`p-2 rounded-full transition-all duration-300 ${isDark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-black/40 hover:text-black hover:bg-black/5'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={onGoToTrending}
            className="hidden text-[13px] font-bold text-foreground/50 hover:text-foreground transition-colors md:flex items-center space-x-1.5 bg-foreground/5 px-4 py-2 rounded-full border border-foreground/10 hover:bg-foreground/10"
          >
            <Flame size={14} className="text-accent" />
            <span>Trending Live</span>
          </button>

          {session ? (
            /* Logged-in: avatar button */
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 hover:border-foreground/20 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 overflow-hidden flex items-center justify-center text-sm font-black text-accent-foreground">
                {profileAvatar
                  ? <img 
                      src={profileAvatar} 
                      className="w-full h-full object-cover cursor-zoom-in" 
                      alt={profileName} 
                      onClick={(e) => { e.stopPropagation(); setZoomedImage(profileAvatar); }}
                    />
                  : initials
                }
              </div>
              <span className="text-foreground/70 group-hover:text-foreground text-[13px] font-semibold transition-colors hidden sm:block">{profileName}</span>
            </button>
          ) : (
            <button
              onClick={onGetStarted}
              className="text-sm font-bold px-6 py-2.5 rounded-full bg-white text-black hover:bg-[#eaff96] transition-all shadow-md transform hover:-translate-y-0.5"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-4 pt-32 pb-24 relative overflow-hidden bg-background">
        {/* Glow Effects */}
        <div className={`absolute top-[-10%] left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-gradient-to-b ${isDark ? 'from-[#eaff96]/20' : 'from-[#eaff96]/40'} to-transparent -z-10 rounded-full blur-[120px] opacity-80 animate-pulse`}></div>
        <div className={`absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-bl ${isDark ? 'from-indigo-500/20' : 'from-indigo-400/30'} to-transparent -z-10 rounded-full blur-[100px] opacity-60`}></div>

        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} w-full max-w-5xl relative z-10`}>
          
          <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter mb-8 leading-[1.05] max-w-5xl text-foreground">
            {session ? (
              <>Welcome back, <br /><span className={`text-transparent bg-clip-text bg-gradient-to-r ${isDark ? 'from-accent to-white' : 'from-accent to-black'}`}>{profileName}.</span></>
            ) : (
              <>Connect instantly, <br /><span className={`text-transparent bg-clip-text bg-gradient-to-r ${isDark ? 'from-accent via-yellow-200 to-white' : 'from-accent via-yellow-600 to-black'}`}>without boundaries.</span></>
            )}
          </h1>
          
          <p className="text-lg md:text-2xl text-foreground/60 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            Ultra-fast messaging, encrypted native <strong className="text-foreground">WebRTC calls</strong>, integrated <strong>Arcade Games</strong>, and global trending feeds—synced perfectly over edge-network websockets.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={onGetStarted}
              className={`group relative inline-flex items-center justify-center px-10 py-5 font-black text-black transition-all rounded-full hover:scale-105 shadow-[0_0_40px_rgba(234,255,150,0.4)] w-full sm:w-auto text-lg ${isDark ? 'bg-[#eaff96] hover:bg-white' : 'bg-[#eaff96] hover:bg-[#d4e687]'}`}
            >
              <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
              {session ? 'Go to your Messages' : 'Start Chatting Now'}
              <ArrowRight className="w-5 h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              onClick={onGoToTrending}
              className="inline-flex items-center justify-center px-10 py-5 font-bold text-foreground bg-foreground/5 border border-foreground/10 transition-all rounded-full hover:bg-foreground/10 hover:border-foreground/20 w-full sm:w-auto overflow-hidden group text-lg backdrop-blur-md"
            >
              <Flame size={20} className="mr-3 text-orange-500 group-hover:animate-bounce" />
              Explore Trending Live
            </button>
          </div>
          
          {/* Trust badges */}
          <div className="mt-16 pt-8 border-t border-foreground/5 flex flex-wrap items-center justify-center gap-8 text-foreground/40 font-bold uppercase tracking-widest text-xs">
             <div className="flex items-center gap-2"><Globe size={16} /> Edge Network</div>
             <div className="flex items-center gap-2"><Lock size={16} /> E2E Encrypted</div>
             <div className="flex items-center gap-2"><Zap size={16} /> 50ms Latency</div>
          </div>
        </div>
      </main>

      {/* 3. Explaining the App (How it Works) */}
      <section className="py-24 bg-card relative border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4 tracking-tight">Features you'll actually use</h2>
            <p className="text-foreground/50 max-w-2xl mx-auto text-lg">Send messages natively, challenge your friends to games, and browse the global trending feed anonymously.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Mockup UI */}
            <div className={`rounded-[2rem] shadow-2xl border overflow-hidden transform transition-transform hover:-translate-y-2 duration-500 flex flex-col h-[420px] ${isDark ? 'bg-[#111] border-white/10' : 'bg-white border-black/5 shadow-xl'}`}>
              <div className={`px-4 py-3 flex items-center space-x-2 shrink-0 z-20 relative border-b ${isDark ? 'bg-[#1a1a1a]/80 backdrop-blur-md border-white/5' : 'bg-gray-50 border-black/5'}`}>
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <div className={`absolute left-1/2 -translate-x-1/2 text-xs font-bold ${isDark ? 'text-white/40' : 'text-black/40'}`}>Chatify Engine</div>
              </div>
              <div className={`flex-1 overflow-hidden relative ${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-50/50'}`}>
                <div className={`absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-${isDark ? '[#0a0a0a]' : 'white'} to-transparent z-10 pointer-events-none`} />
                <div className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-${isDark ? '[#0a0a0a]' : 'white'} to-transparent z-10 pointer-events-none`} />
                <style>{`
                  @keyframes chat-scroll {
                    0%, 15% { transform: translateY(0); }
                    25%, 35% { transform: translateY(-70px); }
                    45%, 55% { transform: translateY(-160px); }
                    65%, 75% { transform: translateY(-290px); }
                    85%, 100% { transform: translateY(-380px); }
                  }
                  .animate-chat {
                    animation: chat-scroll 24s ease-in-out infinite alternate;
                  }
                `}</style>
                <div className="p-5 space-y-5 animate-chat absolute w-full top-0 left-0 pt-8 pb-16">
                  <div className="flex space-x-3 justify-end">
                    <div className="flex-1 space-y-1 flex flex-col items-end">
                      <div className="bg-[#eaff96] text-black font-medium rounded-2xl rounded-tr-sm p-3 shadow-sm inline-block max-w-[90%] text-sm">
                        Did you see what's trending right now? 🔥
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-xs border ${isDark ? 'bg-[#1e1e1e] border-white/5 text-white/50' : 'bg-gray-200 border-black/5 text-gray-500'}`}>Y</div>
                    <div className="flex-1 space-y-2">
                      <div className={`border text-sm rounded-2xl rounded-tl-sm p-3 shadow-sm inline-block max-w-[90%] ${isDark ? 'bg-[#1e1e1e] border-white/5 text-white/90' : 'bg-white border-black/5 text-gray-800'}`}>
                        No what happened? Wait, did you try the AI bot?
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3 justify-end">
                    <div className="flex-1 space-y-1 flex flex-col items-end">
                      <div className="bg-accent text-black font-medium rounded-2xl rounded-tr-sm p-3 shadow-sm inline-block max-w-[90%] text-sm">
                        Yeah! I shared it to the group chat. Next JS released turbopack updates!
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3 justify-end">
                    <div className="flex-1 space-y-1 flex flex-col items-end">
                      <div className={`border rounded-2xl p-3 shadow-sm inline-block max-w-[90%] text-sm text-center w-48 ${isDark ? 'bg-[#111] border-accent/20 text-white' : 'bg-white border-accent/40 text-black'}`}>
                        <Gamepad2 size={24} className="mx-auto text-accent mb-2" />
                        <div className="font-bold">Tic Tac Toe</div>
                        <div className={`text-xs mb-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Game Invite</div>
                        <button className="w-full bg-accent text-black rounded font-bold py-1 text-xs">Play Now</button>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 text-xs border ${isDark ? 'bg-[#1e1e1e] border-white/5 text-white/50' : 'bg-gray-200 border-black/5 text-gray-500'}`}>Y</div>
                    <div className="flex-1 space-y-2">
                      <div className={`border text-sm rounded-2xl rounded-tl-sm p-3 shadow-sm inline-block max-w-[90%] ${isDark ? 'bg-[#1e1e1e] border-white/5 text-white/90' : 'bg-white border-black/5 text-gray-800'}`}>
                        Oh you are ON! Let's go! 🕹️
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`p-3 flex items-center space-x-2 shrink-0 z-20 relative border-t ${isDark ? 'border-white/5 bg-[#0a0a0a]' : 'border-black/5 bg-gray-50'}`}>
                <div className={`flex-1 rounded-full h-10 flex items-center px-4 overflow-hidden border shadow-inner ${isDark ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-black/5'}`}>
                  <div className={`w-full text-sm ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Message...</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-black shadow-md border border-accent shrink-0">
                  <span className="transform rotate-45 mb-0.5 mr-0.5">
                    <Zap size={18} fill="currentColor" strokeWidth={0} />
                  </span>
                </div>
              </div>
            </div>

            {/* Text benefits */}
            <div className="space-y-8 pl-0 md:pl-10">
              <div className="flex gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-black transition-colors text-foreground">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Instant Websockets</h3>
                  <p className="text-foreground/50">Everything happens in real-time. Typing indicators, read receipts, calls, and direct messages.</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-black transition-colors text-foreground">
                  <Gamepad2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Arcade Center</h3>
                  <p className="text-foreground/50">Challenge anyone to 10+ native multiplayer games directly without leaving your chat window.</p>
                </div>
              </div>
              <div className="flex gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-black transition-colors text-foreground">
                  <Flame size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Trending Content</h3>
                  <p className="text-foreground/50">Browse a global immersive feed of current events, filter categories, and share them directly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Grid */}
      <section id="features" className="px-6 py-32 bg-background border-t border-border relative">
        <div className={`absolute top-1/2 left-1/4 w-[600px] h-[600px] ${isDark ? 'bg-indigo-500/5' : 'bg-indigo-500/10'} rounded-full blur-[120px] -translate-y-1/2 pointer-events-none`}></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 tracking-tight">Everything you need</h2>
            <p className="text-foreground/50 max-w-2xl mx-auto text-xl">A truly native messaging experience powered by edge networks.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Zap className="text-black" size={24} />, title: "Instant Delivery", desc: "Powered by deep web-socket integration, delivering payloads in sub-milliseconds." },
              { icon: <Shield className="text-black" size={24} />, title: "End-to-End Secure", desc: "Strict Row-Level Security policies ensure your direct messages are yours and yours alone." },
              { icon: <Users className="text-black" size={24} />, title: "Global Presence", desc: "See who's online immediately. Our presence engine tracks active users globally." },
              { icon: <Lock className="text-black" size={24} />, title: "Persistent Auth", desc: "Enjoy simple 'Remember Me' flows that seamlessly logs you in without typing a password." },
              { icon: <Video className="text-black" size={24} />, title: "Native Video Calling", desc: "Crystal clear, low-latency P2P WebRTC calls with a premium WhatsApp-like interface." },
              { icon: <Gamepad2 className="text-black" size={24} />, title: "Arcade Games", desc: "Challenge your friends to real-time multiplayer games right inside the chat window." }
            ].map((feature, i) => (
              <div key={i} className={`p-8 rounded-[2.5rem] border backdrop-blur-md transition-all duration-500 hover:-translate-y-2 group ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-accent/30 hover:shadow-[0_0_40px_rgba(234,255,150,0.1)]' : 'bg-gray-50/80 border-black/5 hover:bg-white hover:border-accent/40 hover:shadow-xl'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 ${isDark ? 'bg-[#eaff96]' : 'bg-[#d6ed68]'}`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-foreground/60 leading-relaxed text-[15px]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Testimonials */}
      <section className="py-24 bg-card border-t border-border relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-96 h-96 ${isDark ? 'bg-accent/5' : 'bg-accent/10'} rounded-full blur-[80px]`}></div>
        <div className={`absolute bottom-0 left-0 w-96 h-96 ${isDark ? 'bg-accent/5' : 'bg-accent/10'} rounded-full blur-[80px]`}></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl tracking-tight font-black mb-4 text-foreground">Loved by early adopters</h2>
            <p className="text-foreground/50 max-w-2xl mx-auto text-lg">Don't just take our word for it. Here is what folks are saying.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Sarah L.", role: "Product Designer", text: "The cleanest chat app I have ever used. The dark mode aesthetics combined with the real-time attachments blew my mind. Outstanding experience." },
              { name: "Michael R.", role: "Software Engineer", text: "Implementing real-time sockets usually takes weeks. The fact that this app handles it flawlessly under the hood makes it my favorite daily driver." },
              { name: "Emma T.", role: "Remote Worker", text: "I rely on the presence feature all day to see when my colleagues are online. The integrated trending feed is totally addicting." }
            ].map((t, i) => (
              <div key={i} className="p-8 rounded-[2rem] bg-background border border-border backdrop-blur-sm shadow-xl">
                <div className="flex space-x-1 mb-6">
                  {[1,2,3,4,5].map(s => <Star key={s} size={16} className="fill-accent text-accent" />)}
                </div>
                <p className="text-foreground/80 mb-6 text-sm leading-relaxed">"{t.text}"</p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-foreground/5 border border-border flex items-center justify-center font-bold text-foreground">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm">{t.name}</div>
                    <div className="text-xs text-foreground/40">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Call to Action */}
      <section className="py-24 bg-[#eaff96] text-black text-center px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">
            {session ? 'Your chats are waiting.' : 'Ready to upgrade your conversations?'}
          </h2>
          <p className="text-xl text-black/60 mb-10 max-w-2xl mx-auto font-medium">
            {session
              ? 'Jump back in and pick up right where you left off.'
              : 'Join thousands of users who are already experiencing the future of real-time communication.'
            }
          </p>
          <button
            onClick={onGetStarted}
            className="group px-10 py-5 font-black text-white bg-black rounded-full hover:bg-[#1a1a1a] transition-all shadow-xl hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center mx-auto tracking-wide"
          >
            {session ? 'Open Messages' : 'Create Free Account'}
            <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          {!session && (
            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-black/50 font-bold">
              <span className="flex items-center"><CheckCircle2 size={16} className="mr-2" /> No credit card</span>
              <span className="flex items-center"><CheckCircle2 size={16} className="mr-2" /> Setup in 1 min</span>
            </div>
          )}
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="bg-background text-foreground/30 py-12 text-center border-t border-border">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-accent' : 'bg-accent/80'} flex items-center justify-center`}>
              <MessageSquare size={16} className="text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">Chatify</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Chatify Inc.</p>
          <div className="flex space-x-4 mt-4 md:mt-0 font-semibold">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {zoomedImage && (
        <ZoomedImageModal 
          imageUrl={zoomedImage} 
          onClose={() => setZoomedImage(null)} 
        />
      )}
    </div>
  );
}
