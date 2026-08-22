import React from 'react';

const SkeletonProfile = () => {
  return (
    <main 
      role="status" 
      aria-label="Loading profile" 
      aria-hidden="true" 
      className="w-full max-w-[400px] sm:max-w-[450px] md:max-w-[500px] mx-auto bg-[#081b29] border border-cyan-500/20 rounded-3xl shadow-neon p-6 sm:p-8 flex flex-col items-center animate-pulse"
    >
      {/* Top Bar Header Buttons */}
      <div className="w-full flex justify-between items-center mb-6 px-2">
        <div className="w-10 h-10 rounded-full bg-[#0a2336] border border-cyan-500/20"></div>
        <div className="w-10 h-10 rounded-full bg-[#0a2336] border border-cyan-500/20"></div>
      </div>

      {/* Avatar Circle */}
      <div className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 rounded-full bg-[#0a2336] border border-cyan-500/30 mb-3"></div>

      {/* Username Handle (@admin_super) */}
      <div className="h-3.5 w-24 bg-[#0a2336] rounded-full mb-3"></div>

      {/* Greeting Name (Hi 👋 , I'm Admin Sahib) */}
      <div className="h-6 w-48 bg-[#0a2336] rounded-full mb-2.5"></div>

      {/* Auto-type Bio Line (Full Stack Developer) */}
      <div className="h-4 w-36 bg-[#0a2336] rounded-full mb-8"></div>

      {/* Link Buttons Skeleton (Added to match the real layout) */}
      <div className="w-full flex flex-col gap-4 mb-10">
        <div className="w-full h-12 bg-[#0a2336] rounded-full border border-cyan-500/20 shadow-sm"></div>
        <div className="w-full h-12 bg-[#0a2336] rounded-full border border-cyan-500/20 shadow-sm"></div>
        <div className="w-full h-12 bg-[#0a2336] rounded-full border border-cyan-500/20 shadow-sm"></div>
      </div>

      {/* Edit Profile & Links Button Pill */}
      <div className="h-9 w-44 bg-[#0a2336] rounded-full border border-cyan-500/20 mb-8"></div>

      {/* Footer Line */}
      <div className="w-full pt-4 border-t border-cyan-500/20 flex justify-center">
        <div className="h-3 w-44 bg-[#0a2336] rounded-full"></div>
      </div>
    </main>
  );
};

export default SkeletonProfile;