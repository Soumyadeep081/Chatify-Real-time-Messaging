'use client';

import { useEffect, useState } from 'react';
import { insforge } from '../lib/insforge';

export default function TrendingPreviewCard({ contentId, onGoToTrending, isDark }: { contentId: string, onGoToTrending?: (id?: string) => void, isDark: boolean }) {
  const [content, setContent] = useState<any>(null);
  useEffect(() => {
    insforge.database.from('trending_content').select('*').eq('id', contentId).single().then(({ data }) => {
      if (data) setContent(data);
    });
  }, [contentId]);

  if (!content) return <div className={`p-4 rounded-xl text-foreground/30 text-sm animate-pulse w-72 h-32 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>Loading trend preview...</div>;
 
  return (
    <div className={`mt-2 border rounded-3xl w-72 shadow-lg overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform ${isDark ? 'bg-[#141414] border-accent/20' : 'bg-white border-black/5'}`}>
      <div className="h-32 w-full relative bg-black">
        {content.media_type === 'video' ? (
           <video src={content.media_url} className="absolute inset-0 w-full h-full object-cover opacity-80" autoPlay muted loop playsInline />
        ) : (
           <img src={content.media_url} className="absolute inset-0 w-full h-full object-cover opacity-80" />
        )}
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#eaff96] text-black text-[10px] font-black uppercase tracking-widest rounded-sm">
          {content.category}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <span className="text-white text-xs font-black uppercase tracking-widest bg-[#eaff96] text-black px-3 py-1.5 rounded-full">View in Trending</span>
        </div>
      </div>
      <div className="p-4">
        <div className={`font-bold text-sm leading-snug mb-1 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{content.title}</div>
        <div className={`text-[11px] flex items-center justify-between mt-2 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
          <span>{content.source_name}</span>
          <span className="text-accent">Tap to view →</span>
        </div>
      </div>
    </div>
  );
}
