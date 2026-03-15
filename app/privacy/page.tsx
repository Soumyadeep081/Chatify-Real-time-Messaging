export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#ececec] p-12 font-sans selection:bg-[#eaff96]/30">
      <div className="max-w-3xl mx-auto space-y-6">
        <a href="/?view=landing" className="text-[#eaff96] hover:underline mb-8 inline-block font-semibold">← Back to Home</a>
        
        <h1 className="text-4xl md:text-5xl font-black mb-8 text-white">Privacy Policy</h1>
        
        <div className="space-y-6 text-white/70 leading-relaxed text-lg bg-[#111] p-8 rounded-3xl border border-white/5">
          <p>Effective Date: March 2026</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p>At Chatify, we collect information you provide directly to us when you create an account, update your profile, use our interactive features, or communicate with us.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to operate and maintain the Chatify platform, provide you with the services you request, and improve our real-time messaging engine.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Data Security</h2>
          <p>We implement strict Row-Level Security policies to protect your personal information from unauthorized access, alteration, disclosure, or destruction.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:supportatchatify@gmail.com" className="text-[#eaff96] hover:underline">supportatchatify@gmail.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
