import React, { useState } from 'react';
import { createPortal } from 'react-dom'; // FIX: Imported createPortal for true screen centering
import { useNavigate } from 'react-router-dom';
import { Share2, UserPlus, Settings, X, Copy, Check, Mail } from 'lucide-react';

const XTwitterIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const TopNavigation = ({ username, isOwner, profileData }) => {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/${username}`;
  
  const titleText = profileData?.name ? `${profileData.name} (@${profileData.username})` : `Profile of @${username}`;
  const descText = profileData?.typedText ? profileData.typedText.split(',')[0].trim() : 'View my links!';
  
  const getInitials = (name) => {
    if (!name || typeof name !== 'string' || !name.trim()) return "U";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
    return words[0].length >= 2 ? `${words[0][0]}${words[0][1]}`.toUpperCase() : words[0][0].toUpperCase();
  };

  const dynamicAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(getInitials(profileData?.name || username))}&background=0a2336&color=0ef&bold=true&size=256`;

  const copyRichTextToClipboard = async () => {
    const formattedText = `${titleText}\n${descText}\n\n🔗 ${shareUrl}`;
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard access denied.");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: titleText,
          text: `${titleText}\n${descText}`,
          url: shareUrl
        });
      } catch (err) {
        console.log("Share cancelled by user");
      }
    }
  };

  return (
    <>
      <header className="w-full flex justify-between items-center mb-6 px-2">
        <button onClick={() => navigate(isOwner ? '/admin' : '/login', { state: { isSignup: !isOwner } })} className="w-10 h-10 flex justify-center items-center rounded-full text-cyan-400 bg-[#081b29] shadow-neon hover-shadow-neon transition-all cursor-pointer">
          {isOwner ? <Settings size={18} /> : <UserPlus size={18} />}
        </button>

        <button onClick={() => setShowShareModal(true)} className="w-10 h-10 flex justify-center items-center rounded-full text-cyan-400 bg-[#081b29] shadow-neon hover-shadow-neon transition-all cursor-pointer">
          <Share2 size={18} />
        </button>
      </header>

      {/* FIX: Wrapped inside createPortal and attached to document.body to ensure strict viewport centering */}
      {showShareModal && createPortal(
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[9999] p-4 animate-fadeInSmooth">
          <div className="bg-[#081b29] w-full max-w-sm rounded-3xl border border-cyan-500/40 p-6 shadow-[0_0_30px_rgba(0,238,255,0.15)] relative">
            <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer">
              <X size={20} />
            </button>
            
            <h3 className="text-lg font-bold text-white mb-6 text-center">Share this profile</h3>
            
            <div className="flex items-center gap-4 bg-[#0a2336] p-4 rounded-2xl border border-cyan-500/20 mb-6 shadow-sm">
              <img src={profileData?.avatar || dynamicAvatar} alt="Profile" className="w-14 h-14 rounded-full object-cover border border-cyan-500/50 shrink-0" />
              <div className="overflow-hidden">
                <h4 className="text-white font-bold text-sm truncate">{profileData?.name || username}</h4>
                <p className="text-cyan-400 text-xs truncate">@{profileData?.username || username}</p>
                <p className="text-gray-400 text-[10px] truncate mt-0.5">{descText}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(titleText + " - " + descText + "\n\n🔗 " + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-gray-400 hover:text-[#25D366] transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-[#0a2336] border border-cyan-500/20 flex items-center justify-center hover:border-[#25D366]"><WhatsAppIcon size={20} /></div>
                <span className="text-[10px]">WhatsApp</span>
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(titleText + '\n🔗 ' + shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-gray-400 hover:text-[#e7e9ea] transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-[#0a2336] border border-cyan-500/20 flex items-center justify-center hover:border-[#e7e9ea]"><XTwitterIcon size={18} /></div>
                <span className="text-[10px]">X (Twitter)</span>
              </a>
              <a href={`mailto:?subject=${encodeURIComponent("Check out " + titleText)}&body=${encodeURIComponent("Hi! Check out my profile:\n\n" + titleText + "\n" + descText + "\n\n🔗 " + shareUrl)}`} className="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-[#0a2336] border border-cyan-500/20 flex items-center justify-center hover:border-white"><Mail size={20} /></div>
                <span className="text-[10px]">Email</span>
              </a>
              {navigator.share ? (
                <button onClick={handleNativeShare} className="flex flex-col items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-[#0a2336] border border-cyan-500/20 flex items-center justify-center hover:border-cyan-400"><Share2 size={20} /></div>
                  <span className="text-[10px]">More</span>
                </button>
              ) : (
                <button onClick={copyRichTextToClipboard} className="flex flex-col items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-[#0a2336] border border-cyan-500/20 flex items-center justify-center hover:border-cyan-400"><Copy size={20} /></div>
                  <span className="text-[10px]">Copy Details</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 bg-[#0a2336] p-2 rounded-xl border border-cyan-500/30">
              <div className="flex-1 overflow-hidden px-2"><p className="text-gray-300 text-xs truncate">{shareUrl}</p></div>
              <button onClick={copyRichTextToClipboard} className="bg-cyan-400 text-[#081b29] font-bold py-2 px-4 rounded-lg text-xs hover:bg-orange-400 transition-all flex items-center gap-1 shrink-0 cursor-pointer">
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TopNavigation;