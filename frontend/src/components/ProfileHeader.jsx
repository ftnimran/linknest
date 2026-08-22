import React, { useEffect, useRef, useState } from 'react';
import Typed from 'typed.js';
import { FileText } from 'lucide-react';
import ResumeViewerModal from './ResumeViewerModal';

const ProfileHeader = ({ profileData }) => {
  const typedRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!typedRef.current || !profileData?.typedText) return;
    const stringsArray = profileData.typedText.split(',').map(s => s.trim());
    
    const typed = new Typed(typedRef.current, {
      strings: stringsArray,
      typeSpeed: 60,
      backSpeed: 60,
      loop: true,
    });
    return () => typed.destroy();
  }, [profileData?.typedText]);

  // FIX: Space removed & Crash Proof logic (Imran Ali -> IA, Imran -> IM)
  const getInitials = (name) => {
    if (!name || typeof name !== 'string' || !name.trim()) return "U";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
    return words[0].length >= 2 ? `${words[0][0]}${words[0][1]}`.toUpperCase() : words[0][0].toUpperCase();
  };

  const dynamicAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(getInitials(profileData?.name))}&background=0a2336&color=0ef&bold=true&size=256`;

  return (
    <div className="flex flex-col items-center w-full">
      <img 
        className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 rounded-full object-cover shadow-neon transition-transform duration-300 hover:scale-105" 
        src={profileData?.avatar || dynamicAvatar} 
        alt="Profile" 
      />
      
      <p className="mt-3 text-cyan-500/80 text-sm font-semibold tracking-wide">
        @{profileData?.username || 'user'}
      </p>
      
      <h2 className="mt-1 text-xl md:text-2xl font-bold flex items-center justify-center gap-2 text-center">
        Hi <img src="/Hi.gif" width="30" alt="wave" />, I'm {profileData?.name}
      </h2>
      
      <h4 className="mt-2 text-cyan-400 min-h-[24px] text-sm md:text-base text-center">
        <span ref={typedRef}></span>
      </h4>

      {profileData?.resumeLink && (
        <>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-6 flex items-center justify-center gap-2 w-full max-w-[280px] py-3 bg-cyan-400 text-[#081b29] font-bold rounded-full shadow-neon hover-shadow-neon transition-all cursor-pointer"
          >
            <FileText size={18} /> View Resume
          </button>

          <ResumeViewerModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            resumeUrl={profileData.resumeLink}
            resumeName={profileData.resumeName}
          />
        </>
      )}
    </div>
  );
};

export default ProfileHeader;