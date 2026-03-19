'use client';

import { MessageSquare, Zap, Shield, Users, ArrowRight, CheckCircle2, Star, Globe, Lock, Gamepad2, Flame, Sun, Moon, Video } from 'lucide-react';
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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => { setIsVisible(true); }, []);

  const user = session?.user;
  const profileName = user?.profile?.name || (user?.profile?.username ? `@${user.profile.username}` : 'My Profile');
  const profileAvatar = user?.profile?.avatar_url;
  const initials = profileName[0]?.toUpperCase();

  const dark = isDark;
  const bg = dark ? 'bg-[#060608]' : 'bg-[#f5f5f7]';
  const fg = dark ? 'text-white' : 'text-black';
  const subFg = dark ? 'text-white/40' : 'text-black/45';
  const borderLine = dark ? 'border-white/[0.07]' : 'border-black/[0.07]';
  const cardBg = dark ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-white border-black/[0.07]';

  return (
    <div className={`min-h-screen ${bg} ${fg} selection:bg-accent/30 font-sans flex flex-col overflow-x-hidden transition-colors duration-300`}>

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

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className={`flex items-center justify-between px-5 py-3 md:px-10 ${dark ? 'bg-[#060608]/80' : 'bg-[#f5f5f7]/80'} backdrop-blur-2xl border-b ${borderLine} sticky top-0 z-50`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20`}>
            <MessageSquare size={18} className="text-black" />
          </div>
          <span className={`font-black text-[17px] tracking-tight ${fg}`}>Chatify</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${dark ? 'text-white/40 hover:text-white hover:bg-white/8' : 'text-black/40 hover:text-black hover:bg-black/5'}`}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            onClick={onGoToTrending}
            className={`hidden md:flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-full border transition-all ${dark ? 'text-white/50 border-white/10 hover:bg-white/6 hover:text-white' : 'text-black/50 border-black/10 hover:bg-black/5 hover:text-black'}`}
          >
            <Flame size={13} className="text-orange-400" />
            <span>Trending</span>
          </button>

          {session ? (
            <button
              onClick={() => setShowProfile(true)}
              className={`flex items-center gap-2 pl-1 pr-3.5 py-1 rounded-full border transition-all ${dark ? 'border-white/10 hover:bg-white/6' : 'border-black/10 hover:bg-black/5 bg-white shadow-sm'}`}
            >
              <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 overflow-hidden flex items-center justify-center text-sm font-black">
                {profileAvatar
                  ? <img src={profileAvatar} className="w-full h-full object-cover" alt={profileName} onClick={(e) => { e.stopPropagation(); setZoomedImage(profileAvatar); }} />
                  : <span className="text-[11px] font-black">{initials}</span>
                }
              </div>
              <span className={`text-[13px] font-semibold hidden sm:block transition-colors ${dark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}>{profileName}</span>
            </button>
          ) : (
            <button
              onClick={onGetStarted}
              className={`text-[13px] font-bold px-5 py-2 rounded-full transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm ${dark ? 'bg-white text-black hover:bg-accent' : 'bg-black text-white hover:bg-gray-800'}`}
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center text-center px-5 pt-28 pb-28 relative overflow-hidden">
        {/* Ambient glows */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[130px] pointer-events-none -z-10 ${dark ? 'bg-[#e8ff8a]/12' : 'bg-[#e8ff8a]/35'} animate-pulse`} />
        <div className={`absolute top-[30%] right-0 w-[500px] h-[500px] rounded-full blur-[110px] pointer-events-none -z-10 ${dark ? 'bg-indigo-500/12' : 'bg-indigo-400/20'}`} />
        <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none -z-10 ${dark ? 'bg-[#e8ff8a]/8' : 'bg-[#e8ff8a]/25'}`} />

        <div
          className="w-full max-w-5xl relative z-10 transition-all duration-1000"
          style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(20px)' }}
        >


          <h1 className={`text-5xl sm:text-7xl md:text-[5.5rem] lg:text-[6.5rem] font-black tracking-[-0.03em] mb-8 leading-[1.04] ${fg}`}>
            {session ? (
              <>Welcome back,{' '}
                <span className={`${dark ? 'text-accent' : 'text-[#7a9900]'}`}>{profileName}.</span>
              </>
            ) : (
              <>Chat smarter,<br />
                <span className="relative inline-block">
                  <span className={`${dark ? 'text-accent' : 'text-[#7a9900]'}`}>live bigger.</span>
                </span>
              </>
            )}
          </h1>

          <p className={`text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-medium ${subFg}`}>
            Ultra-fast messaging, encrypted native{' '}
            <strong className={dark ? 'text-white/80 font-semibold' : 'text-black/70 font-semibold'}>WebRTC calls</strong>,
            multiplayer{' '}
            <strong className={dark ? 'text-white/80 font-semibold' : 'text-black/70 font-semibold'}>Arcade Games</strong>,
            and a global trending feed — all in one beautiful app.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-[15px] font-black text-black rounded-full transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0 w-full sm:w-auto shadow-lg bg-accent shadow-accent/30 hover:shadow-accent/40 hover:bg-white"
            >
              {session ? 'Open Messages' : 'Start Chatting — Free'}
              <ArrowRight size={17} className="ml-2.5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onGoToTrending}
              className={`inline-flex items-center justify-center px-8 py-4 text-[15px] font-semibold rounded-full transition-all hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto border ${dark ? 'border-white/10 text-white/60 hover:bg-white/6 hover:text-white/90 hover:border-white/20' : 'border-black/10 text-black/55 hover:bg-black/5 hover:text-black/80 bg-white shadow-sm'}`}
            >
              <Flame size={16} className="mr-2 text-orange-400" />
              Explore Trending
            </button>
          </div>

          {/* Stats row */}
          <div className={`mt-16 pt-8 border-t ${borderLine} flex flex-wrap items-center justify-center gap-8 md:gap-12`}>
            {[
              { icon: <Globe size={14} />, label: 'Edge Network' },
              { icon: <Lock size={14} />, label: 'E2E Encrypted' },
              { icon: <Zap size={14} />, label: '< 50ms Latency' },
            ].map((s, i) => (
              <div key={i} className={`flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest ${subFg}`}>
                {s.icon}{s.label}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── How it Works ───────────────────────────────────── */}
      <section className={`py-24 border-t ${borderLine} ${dark ? 'bg-[#0a0a0e]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-3 ${dark ? 'text-accent' : 'text-[#7a9900]'}`}>Features</p>
            <h2 className={`text-3xl md:text-5xl font-black tracking-tight mb-4 ${fg}`}>Everything you actually need</h2>
            <p className={`max-w-xl mx-auto text-lg ${subFg}`}>Built for people who value speed, privacy, and great design.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Chat Mock */}
            <div className={`rounded-[2rem] border overflow-hidden flex flex-col h-[400px] shadow-2xl ${dark ? 'bg-[#0f0f12] border-white/8 shadow-black/60' : 'bg-white border-black/8 shadow-black/10'}`}>
              <div className={`px-4 py-3 flex items-center gap-2 border-b shrink-0 ${dark ? 'bg-[#1a1a1e] border-white/6' : 'bg-gray-50/80 border-black/6'}`}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                <span className={`absolute left-1/2 -translate-x-1/2 text-[11px] font-bold ${subFg}`}>Chatify</span>
              </div>
              <div className={`flex-1 overflow-hidden relative ${dark ? 'bg-[#090910]' : 'bg-[#f9f9fb]'}`}>
                <div className={`absolute top-0 inset-x-0 h-10 bg-gradient-to-b ${dark ? 'from-[#090910]' : 'from-[#f9f9fb]'} to-transparent z-10 pointer-events-none`} />
                <div className={`absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t ${dark ? 'from-[#090910]' : 'from-[#f9f9fb]'} to-transparent z-10 pointer-events-none`} />
                <div className="p-4 space-y-4 animate-chat absolute w-full top-0 left-0 pt-6 pb-12">
                  {[
                    { me: true, msg: 'Did you see what\'s trending right now? 🔥' },
                    { me: false, msg: 'No what happened? Wait, did you try the AI bot?', avatar: 'Y' },
                    { me: true, msg: 'Yeah! Next.js just dropped Turbopack updates!' },
                    { me: false, msg: 'Oh you\'re ON, let\'s play Tic Tac Toe 🕹️', avatar: 'Y', game: true },
                    { me: true, msg: 'Deal! Starting now...' },
                  ].map((m, i) => m.game ? (
                    <div key={i} className="flex justify-end">
                      <div className={`border rounded-2xl p-3 text-center w-44 ${dark ? 'bg-[#14141a] border-accent/20' : 'bg-white border-accent/30 shadow-sm'}`}>
                        <Gamepad2 size={22} className="mx-auto text-accent mb-1.5" />
                        <div className={`font-bold text-[13px] ${dark ? 'text-white' : 'text-black'}`}>Tic Tac Toe</div>
                        <div className={`text-[10px] mb-1.5 ${subFg}`}>Game invite</div>
                        <button className="w-full bg-accent text-black rounded-lg font-black py-1 text-[10px]">Play Now</button>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className={`flex gap-2 ${m.me ? 'justify-end' : 'justify-start'}`}>
                      {!m.me && <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${dark ? 'bg-white/8 text-white/50' : 'bg-gray-200 text-gray-500'}`}>{m.avatar}</div>}
                      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] font-medium leading-snug ${m.me ? 'bg-accent text-black rounded-tr-sm' : dark ? 'bg-white/8 text-white/90 rounded-tl-sm' : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-black/5'}`}>
                        {m.msg}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`p-3 flex items-center gap-2 border-t shrink-0 ${dark ? 'border-white/6 bg-[#0f0f12]' : 'border-black/6 bg-white'}`}>
                <div className={`flex-1 rounded-full h-9 flex items-center px-4 border text-[13px] ${dark ? 'bg-white/5 border-white/8 text-white/25' : 'bg-gray-100 border-black/6 text-black/30'}`}>
                  Message...
                </div>
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shadow-md shrink-0">
                  <Zap size={16} className="text-black" fill="currentColor" strokeWidth={0} />
                </div>
              </div>
            </div>

            {/* Feature bullets */}
            <div className="space-y-7">
              {[
                { icon: <Zap size={20} />, title: 'Instant Websockets', desc: 'Typing indicators, read receipts, calls and messages delivered in under 50ms over the global edge network.' },
                { icon: <Gamepad2 size={20} />, title: 'Arcade Center', desc: 'Challenge anyone to 10+ real-time multiplayer games — chess, Tic Tac Toe, and more — right inside chat.' },
                { icon: <Flame size={20} />, title: 'Trending Feed', desc: 'Browse a global immersive feed of current events, filter categories, and share them directly into chat.' },
              ].map((f, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all group-hover:bg-accent group-hover:border-accent group-hover:text-black group-hover:shadow-lg group-hover:shadow-accent/20 ${dark ? 'bg-white/5 border-white/10 text-white/60' : 'bg-gray-50 border-black/10 text-black/50 shadow-sm'}`}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 className={`text-[17px] font-bold mb-1.5 ${fg}`}>{f.title}</h3>
                    <p className={`text-[14px] leading-relaxed ${subFg}`}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Cards Grid ─────────────────────────────── */}
      <section className={`px-5 py-28 border-t ${borderLine} ${bg} relative overflow-hidden`}>
        <div className={`absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none ${dark ? 'bg-indigo-500/8' : 'bg-indigo-500/12'}`} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-3 ${dark ? 'text-accent' : 'text-[#7a9900]'}`}>Why Chatify</p>
            <h2 className={`text-4xl md:text-6xl font-black tracking-tight mb-4 ${fg}`}>Built different.</h2>
            <p className={`max-w-xl mx-auto text-lg ${subFg}`}>A truly premium messaging platform powered by edge infrastructure.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <Zap size={22} className="text-black" />, title: 'Instant Delivery', desc: 'Sub-millisecond payloads over deep websocket integration. Messages arrive before you blink.' },
              { icon: <Shield size={22} className="text-black" />, title: 'End-to-End Secure', desc: 'Row-Level Security enforced at the database layer. Your messages are yours, always.' },
              { icon: <Users size={22} className="text-black" />, title: 'Global Presence', desc: 'See who\'s online in real-time. Our presence engine tracks activity globally, instantly.' },
              { icon: <Lock size={22} className="text-black" />, title: 'Persistent Auth', desc: 'Smart "Remember Me" flows — sign in once, stay in forever. OAuth with Google & GitHub.' },
              { icon: <Video size={22} className="text-black" />, title: 'Native Video Calls', desc: 'Crystal-clear P2P WebRTC calls with a premium, WhatsApp-like interface and controls.' },
              { icon: <Gamepad2 size={22} className="text-black" />, title: 'Arcade Games', desc: 'Challenge friends to real-time multiplayer games in-chat. No app switching needed.' },
            ].map((f, i) => (
              <div key={i} className={`p-7 rounded-[1.75rem] border transition-all duration-400 hover:-translate-y-2 group cursor-default ${dark
                ? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07] hover:border-accent/30 hover:shadow-[0_0_60px_rgba(232,255,138,0.08)]'
                : 'bg-white border-black/[0.07] hover:border-accent/50 hover:shadow-xl shadow-sm'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300 bg-accent`}>
                  {f.icon}
                </div>
                <h3 className={`text-[18px] font-bold mb-2.5 ${fg}`}>{f.title}</h3>
                <p className={`text-[14px] leading-relaxed ${subFg}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────── */}
      <section className={`py-24 border-t ${borderLine} ${dark ? 'bg-[#0a0a0e]' : 'bg-white'} relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] ${dark ? 'bg-accent/7' : 'bg-accent/15'}`} />
        <div className="max-w-7xl mx-auto px-5 relative z-10">
          <div className="text-center mb-14">
            <p className={`text-[11px] font-black uppercase tracking-[0.2em] mb-3 ${dark ? 'text-accent' : 'text-[#7a9900]'}`}>Reviews</p>
            <h2 className={`text-3xl md:text-5xl font-black tracking-tight mb-3 ${fg}`}>Loved by early adopters</h2>
            <p className={`max-w-xl mx-auto text-lg ${subFg}`}>Real people sharing real experiences.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Sarah L.', role: 'Product Designer', text: 'The cleanest chat app I\'ve ever used. The dark mode aesthetics and real-time features blew my mind. Outstanding.' },
              { name: 'Michael R.', role: 'Software Engineer', text: 'Implementing real-time sockets takes weeks normally. This app handles it flawlessly and has become my daily driver.' },
              { name: 'Emma T.', role: 'Remote Worker', text: 'I rely on the presence feature all day to coordinate with my team. The integrated trending feed is totally addicting.' },
            ].map((t, i) => (
              <div key={i} className={`p-7 rounded-[1.75rem] border transition-all hover:-translate-y-1 duration-300 ${dark ? 'bg-white/[0.04] border-white/[0.07]' : 'bg-gray-50 border-black/[0.07] shadow-sm'}`}>
                <div className="flex gap-0.5 mb-5">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} className="fill-accent text-accent" />)}
                </div>
                <p className={`text-[14px] leading-relaxed mb-6 ${subFg}`}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[13px] border ${dark ? 'bg-white/8 border-white/10 text-white/70' : 'bg-gray-200 border-black/10 text-black/70'}`}>{t.name[0]}</div>
                  <div>
                    <div className={`font-bold text-[14px] ${fg}`}>{t.name}</div>
                    <div className={`text-[12px] ${subFg}`}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className={`py-24 border-t ${borderLine} relative overflow-hidden ${dark ? 'bg-[#e8ff8a]' : 'bg-[#e8ff8a]'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.4),_transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,0,0,0.08),_transparent_60%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center px-5 relative z-10">
          <h2 className="text-4xl md:text-[3.5rem] font-black tracking-[-0.03em] text-black mb-5 leading-tight">
            {session ? 'Your chats are waiting.' : 'Ready to upgrade your conversations?'}
          </h2>
          <p className="text-[17px] text-black/55 mb-10 max-w-xl mx-auto font-medium leading-relaxed">
            {session
              ? 'Jump back in and pick up right where you left off.'
              : 'Join thousands already experiencing the future of real-time communication.'
            }
          </p>
          <button
            onClick={onGetStarted}
            className="group inline-flex items-center justify-center gap-2 px-9 py-4 font-black text-white bg-black rounded-full hover:bg-gray-900 transition-all shadow-2xl hover:-translate-y-1 hover:shadow-black/30 active:translate-y-0 text-[15px]"
          >
            {session ? 'Open Messages' : 'Create Free Account'}
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
          </button>
          {!session && (
            <div className="mt-6 flex items-center justify-center gap-6 text-[13px] text-black/50 font-semibold">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} />No credit card</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} />Setup in 60 sec</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} />Free forever</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className={`py-10 border-t ${borderLine} ${dark ? 'bg-[#060608]' : 'bg-[#f5f5f7]'}`}>
        <div className="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <MessageSquare size={14} className="text-black" />
            </div>
            <span className={`font-black text-[15px] tracking-tight ${fg}`}>Chatify</span>
          </div>
          <p className={`text-[13px] ${subFg}`}>© {new Date().getFullYear()} Chatify Inc. All rights reserved.</p>
          <div className={`flex gap-5 text-[13px] font-semibold ${subFg}`}>
            <a href="/privacy" className={`hover:${fg} transition-colors`}>Privacy</a>
            <a href="/terms" className={`hover:${fg} transition-colors`}>Terms</a>
            <a href="/contact" className={`hover:${fg} transition-colors`}>Contact</a>
          </div>
        </div>
      </footer>

      {zoomedImage && (
        <ZoomedImageModal imageUrl={zoomedImage} onClose={() => setZoomedImage(null)} />
      )}
    </div>
  );
}
