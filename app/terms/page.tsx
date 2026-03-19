export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#060608] text-[#f0f0f4] font-sans selection:bg-[#e8ff8a]/30">
      
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
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">Terms of Service</h1>
          <p className="text-white/40 text-[15px]">Effective Date: March 2026</p>
        </div>

        <div className="space-y-6">
          {[
            { title: '1. Acceptance of Terms', body: 'By accessing or using the Chatify platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.' },
            { title: '2. User Conduct', body: 'You agree to use Chatify only for lawful purposes. You are solely responsible for the knowledge and content of any messages, media, or data you transmit through our edge-network websockets.' },
            { title: '3. Account Responsibilities', body: 'You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password, whether your password is with our Service or a third-party service.' },
            { title: '4. Changes to Terms', body: 'We reserve the right to modify these terms at any time. We will provide notice of significant changes by updating the date at the top of these terms and, where appropriate, we may notify you via email.' },
          ].map((s, i) => (
            <div key={i} className="p-8 rounded-[1.75rem] bg-white/[0.04] border border-white/[0.07]">
              <h2 className="text-xl font-black text-white mb-4">{s.title}</h2>
              <p className="text-white/55 leading-relaxed text-[15px]">{s.body}</p>
            </div>
          ))}
          <div className="p-8 rounded-[1.75rem] bg-white/[0.04] border border-white/[0.07]">
            <p className="text-white/55 text-[14px]">
              Questions? Reach us at{' '}
              <a href="mailto:supportatchatify@gmail.com" className="text-[#e8ff8a] hover:underline font-semibold">supportatchatify@gmail.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
