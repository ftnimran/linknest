import React, { useState } from 'react';
import { Plus, X, Info, ChevronDown, ChevronUp } from 'lucide-react';

const EditLinkModal = ({ onAdd, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const formatUrlBeforeSave = (inputUrl) => {
    const cleaned = inputUrl.replace(/\s+/g, '');
    if (!cleaned) return '';
    
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned);
    if (isEmail) return `mailto:${cleaned}`;
    
    if (/^(https?|mailto|tel|whatsapp|sms):/i.test(cleaned)) {
      return cleaned;
    }
    return `https://${cleaned}`;
  };

  const handleClose = () => {
    // Save hote time modal close hone se rokein
    if (isLoading) return; 
    setIsOpen(false);
    setShowGuide(false);
    setTitle('');
    setUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.trim() && url.trim()) {
      await onAdd({
        id: Date.now().toString(),
        title: title.trim(),
        url: formatUrlBeforeSave(url)
      });
      // Data backend me save hone ke baad hi modal empty aur close hoga
      setTitle('');
      setUrl('');
      setShowGuide(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full">
      <button 
        onClick={() => setIsOpen(true)} 
        className="w-full py-3 bg-cyan-400 text-[#081b29] font-bold rounded-lg flex justify-center items-center gap-2 hover:bg-orange-400 shadow-neon transition-colors cursor-pointer"
      >
        <Plus size={18} /> Add New Link
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 px-4 animate-fadeInSmooth">
          <div className="bg-[#081b29] p-6 rounded-2xl border border-cyan-500/50 w-full max-w-sm relative shadow-neon">
            <button 
              onClick={handleClose} 
              disabled={isLoading}
              className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-cyan-400 mb-6">Add New Link</h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Title (e.g. YouTube)" 
                value={title} 
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)} 
                disabled={isLoading}
                className="w-full p-3 bg-[#0a2336] rounded-lg border border-cyan-500/30 text-white outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                required 
              />
              <input 
                type="text" 
                placeholder="URL (e.g. youtube.com)" 
                value={url} 
                maxLength={500}
                onChange={(e) => setUrl(e.target.value)} 
                disabled={isLoading}
                className="w-full p-3 bg-[#0a2336] rounded-lg border border-cyan-500/30 text-white outline-none focus:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                required 
              />
              
              <div className="flex flex-col gap-2">
                <button 
                  type="button"
                  onClick={() => setShowGuide(!showGuide)}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors w-fit cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Info size={14} /> How to format URLs? {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                
                {showGuide && (
                  <div className="p-3 bg-[#05111a] rounded-lg border border-cyan-500/20 text-xs text-gray-300 space-y-2 animate-fadeInSmooth">
                    <p><strong className="text-cyan-400">Website/Social:</strong> yourwebsite.com </p>
                    <p><strong className="text-cyan-400">WhatsApp:</strong> wa.me/919876543210</p>
                    <p><strong className="text-cyan-400">Email:</strong> youremail@gmail.com </p>
                    <p><strong className="text-cyan-400">Phone:</strong> tel:+919876543210</p>
                    <p><strong className="text-cyan-400">SMS:</strong> sms:+919876543210</p>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-3 bg-cyan-400 text-[#081b29] font-bold rounded-lg hover:bg-orange-400 transition-colors mt-2 cursor-pointer shadow-neon disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isLoading ? <span className="animate-spin h-5 w-5 border-b-2 border-[#081b29] rounded-full"></span> : 'Save Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditLinkModal;