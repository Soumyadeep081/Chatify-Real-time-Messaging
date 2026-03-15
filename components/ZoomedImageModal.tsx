import React from 'react';
import { X } from 'lucide-react';

interface ZoomedImageModalProps {
  imageUrl: string;
  altText?: string;
  onClose: () => void;
}

export default function ZoomedImageModal({ imageUrl, altText = 'Zoomed Image', onClose }: ZoomedImageModalProps) {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all z-10"
      >
        <X size={24} />
      </button>

      <div 
        className="relative max-w-4xl max-h-[85vh] w-[90vw] md:w-auto h-auto flex items-center justify-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={imageUrl} 
          alt={altText} 
          className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_0_100px_rgba(234,255,150,0.15)] ring-1 ring-white/10"
        />
      </div>
    </div>
  );
}
