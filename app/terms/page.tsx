export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#ececec] p-12 font-sans selection:bg-[#eaff96]/30">
      <div className="max-w-3xl mx-auto space-y-6">
        <a href="/?view=landing" className="text-[#eaff96] hover:underline mb-8 inline-block font-semibold">← Back to Home</a>
        
        <h1 className="text-4xl md:text-5xl font-black mb-8 text-white">Terms of Service</h1>
        
        <div className="space-y-6 text-white/70 leading-relaxed text-lg bg-[#111] p-8 rounded-3xl border border-white/5">
          <p>Effective Date: March 2026</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing or using the Chatify platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. User Conduct</h2>
          <p>You agree to use Chatify only for lawful purposes. You are solely responsible for the knowledge and content of any messages, media, or data you transmit through our edge-network websockets.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Account Responsibilities</h2>
          <p>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. We will provide notice of significant changes by updating the date at the top of these terms.</p>
          
          <p className="mt-8 pt-6 border-t border-white/10">Questions? Reach out to <a href="mailto:supportatchatify@gmail.com" className="text-[#eaff96] hover:underline">supportatchatify@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
