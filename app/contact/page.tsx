export default function ContactPage() {
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
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#e8ff8a] mb-3 block">Get in touch</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">Contact Us</h1>
          <p className="text-white/40 text-[15px]">We'd love to hear from you.</p>
        </div>

        <div className="space-y-5">
          <div className="p-8 rounded-[1.75rem] bg-white/[0.04] border border-white/[0.07]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#e8ff8a] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6" fill="none" stroke="#000" strokeWidth="2"/></svg>
              </div>
              <h2 className="text-lg font-black text-white">Email Support</h2>
            </div>
            <p className="text-white/50 text-[14px] mb-4 leading-relaxed">
              For support, partnerships, or any questions, email us directly. We respond within 24 hours on business days.
            </p>
            <a href="mailto:supportatchatify@gmail.com" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#e8ff8a] text-black font-black text-[14px] hover:bg-white transition-all shadow-lg shadow-[#e8ff8a]/20">
              supportatchatify@gmail.com
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="p-7 rounded-[1.75rem] bg-white/[0.04] border border-white/[0.07]">
              <h3 className="text-[15px] font-black text-white mb-3">Office</h3>
              <p className="text-white/50 text-[14px] leading-relaxed">
                Chatify Inc.<br/>
                Alpha 2, Greater Noida<br/>
                Uttar Pradesh, India
              </p>
            </div>
            <div className="p-7 rounded-[1.75rem] bg-white/[0.04] border border-white/[0.07]">
              <h3 className="text-[15px] font-black text-white mb-3">Business Hours</h3>
              <p className="text-white/50 text-[14px] leading-relaxed">
                Monday – Friday<br/>
                9:00 AM – 6:00 PM IST<br/>
                <span className="text-white/30">Weekend: Closed</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
