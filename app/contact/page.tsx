export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#ececec] p-12 font-sans selection:bg-[#eaff96]/30">
      <div className="max-w-3xl mx-auto space-y-6">
        <a href="/?view=landing" className="text-[#eaff96] hover:underline mb-8 inline-block font-semibold">← Back to Home</a>
        
        <h1 className="text-4xl md:text-5xl font-black mb-8 text-white">Contact Us</h1>
        
        <div className="space-y-6 text-white/70 leading-relaxed text-lg bg-[#111] p-8 rounded-3xl border border-white/5">
          <p>We'd love to hear from you. Whether you have a question about features, pricing, need a demo, or anything else, our team is ready to answer all your questions.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Get in Touch</h2>
          <p>For support or any questions, please email us directly at:</p>
          <a href="mailto:supportatchatify@gmail.com" className="text-[#eaff96] hover:underline font-bold text-xl block mt-2">supportatchatify@gmail.com</a>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Office Address</h2>
          <p>Chatify Inc.<br/>Alpha 2<br/>Greater Noida, Uttar Pradesh<br/>India</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">Business Hours</h2>
          <p>Monday - Friday: 9:00 AM - 6:00 PM (IST)<br/>Saturday & Sunday: Closed</p>
        </div>
      </div>
    </div>
  );
}
