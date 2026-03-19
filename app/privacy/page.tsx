export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-[#f0f0f4] font-sans selection:bg-[#e8ff8a]/30">
      
      {/* Top bar */}
      <div className="border-b border-white/[0.07] bg-[#060608]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <a href="/?view=landing" className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </a>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#e8ff8a] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <span className="font-black text-[15px] tracking-tight">Chatify</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#e8ff8a] mb-3 block">Legal</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">Privacy Policy</h1>
          <p className="text-white/40 text-[15px]">Effective Date: March 2026</p>
        </div>
        
        <div className="space-y-10">
          {[
            {
              title: '1. Information We Collect',
              body: 'At Chatify, we collect information you provide directly to us when you create an account, update your profile, use our interactive features, or communicate with us. This includes your name, username, email address, and any content you post or share.'
            },
            {
              title: '2. How We Use Your Information',
              body: 'We use the information we collect to operate and maintain the Chatify platform, provide you with the services you request, improve our real-time messaging engine, and send you technical notices or administrative messages.'
            },
            {
              title: '3. Data Security',
              body: 'We implement strict Row-Level Security policies enforced at the database layer to protect your personal information from unauthorized access, alteration, disclosure, or destruction. Your direct messages are cryptographically protected.'
            },
            {
              title: '4. Contact Us',
              body: null,
              email: 'supportatchatify@gmail.com'
            }
          ].map((s, i) => (
            <div key={i} className="p-8 rounded-[1.75rem] bg-white/[0.04] border border-white/[0.07]">
              <h2 className="text-xl font-black text-white mb-4">{s.title}</h2>
              {s.body && <p className="text-white/55 leading-relaxed text-[15px]">{s.body}</p>}
              {s.email && <p className="text-white/55 leading-relaxed text-[15px]">If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href={`mailto:${s.email}`} className="text-[#e8ff8a] hover:underline font-semibold">{s.email}</a>.
              </p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
