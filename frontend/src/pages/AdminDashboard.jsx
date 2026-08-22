import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import DraggableLinkList from '../components/Admin/DraggableLinkList';
import EditLinkModal from '../components/Admin/EditLinkModal';
import ImageCropModal from '../components/Admin/ImageCropModal';
import { LogOut, Eye, EyeOff, Save, Trash2, AlertTriangle } from 'lucide-react';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const AdminDashboard = () => {
  const { username, token, links, setLinks, profileData, logout, fetchMyProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ ...profileData, password: '' });
  const [saveMsg, setSaveMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [imageToCrop, setImageToCrop] = useState(null);
  
  // Specific Loaders instead of one global loader
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isLinksSaving, setIsLinksSaving] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [newResumeFile, setNewResumeFile] = useState(null);
  const [removedAvatar, setRemovedAvatar] = useState(false);
  const [removedResume, setRemovedResume] = useState(false);

  useEffect(() => {
    setFormData({ ...profileData, password: '' });
  }, [profileData]);

  useEffect(() => {
    return () => {
      if (imageToCrop) URL.revokeObjectURL(imageToCrop);
      if (formData.resumeLink && formData.resumeLink.startsWith('blob:')) {
        URL.revokeObjectURL(formData.resumeLink);
      }
      if (formData.avatar && formData.avatar.startsWith('blob:')) {
        URL.revokeObjectURL(formData.avatar);
      }
    };
  }, [imageToCrop, formData.resumeLink, formData.avatar]);

  useEffect(() => {
    document.title = 'Dashboard - LinkNest';
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });
      
      const contentType = res.headers.get("content-type");
      const data = contentType && contentType.includes("application/json") ? await res.json() : {};

      if (res.ok) {
        setShowDeleteModal(false);
        logout(); 
      } else {
        setErrorMsg(data.message || 'Error deleting account. Please try again.');
        setShowDeleteModal(false);
      }
    } catch (err) {
      setErrorMsg('Network error while deleting account. Ensure backend is running.');
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsProfileSaving(true);
    setErrorMsg('');

    if (!formData.name?.trim() || !formData.username?.trim() || !formData.email?.trim()) {
      setErrorMsg('Name, Username, and Email cannot be empty spaces!');
      setIsProfileSaving(false);
      return;
    }

    if (formData.password && formData.password.trim() !== '') {
      if (formData.password.length < 8) {
        setErrorMsg('New password must be at least 8 characters long!');
        setIsProfileSaving(false);
        return;
      }
      
      const hasUpper = /[A-Z]/.test(formData.password);
      const hasLower = /[a-z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(formData.password);
      
      if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        setErrorMsg('Password must contain A-Z, a-z, 0-9, and a special character (!@#$%^&*)');
        setIsProfileSaving(false);
        return;
      }
    }
    
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('typedText', formData.typedText);
    submitData.append('username', formData.username);
    submitData.append('email', formData.email);
    
    if (formData.password) submitData.append('password', formData.password);
    if (removedAvatar) submitData.append('removeAvatar', 'true');
    if (removedResume) submitData.append('removeResume', 'true');
    if (newAvatarFile) submitData.append('avatar', newAvatarFile);
    if (newResumeFile) submitData.append('resume', newResumeFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: submitData
      });
      const data = await res.json();
      
      if (res.ok) {
        await fetchMyProfile();
        setRemovedAvatar(false);
        setRemovedResume(false);
        setFormData(prev => ({...prev, password: ''})); 
        setSaveMsg('Profile & Files Updated!');
        setTimeout(() => setSaveMsg(''), 2000);
      } else {
        setSaveMsg('');
        setErrorMsg(data.message || 'Error saving profile');
      }
    } catch (err) {
      setSaveMsg('');
      setErrorMsg('Error saving profile');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handleLinksSave = async (newLinks) => {
    const previousLinks = [...links];
    setIsLinksSaving(true);
    setErrorMsg('');
    setLinks(newLinks); // Optimistic UI Update

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/links`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ links: newLinks })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update links');
      }
    } catch (e) {
      setLinks(previousLinks); // Revert UI if API fails
      setErrorMsg(e.message || 'Failed to save links. Changes reverted.');
      setTimeout(() => setErrorMsg(''), 3500);
    } finally {
      setIsLinksSaving(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg('Image size must be less than 2MB!');
        e.target.value = '';
        return;
      }
      setErrorMsg('');
      setImageToCrop(URL.createObjectURL(file)); 
    }
    e.target.value = ''; 
  };

  const handleCropComplete = async (croppedUrl) => {
    setIsImageProcessing(true);
    setFormData({ ...formData, avatar: croppedUrl });
    setImageToCrop(null);
    setRemovedAvatar(false); 
    
    try {
      const blob = await fetch(croppedUrl).then(r => r.blob());
      const file = new File([blob], "avatar.png", { type: "image/png" });
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg('Cropped image size exceeds 2MB!');
        setIsImageProcessing(false);
        return;
      }
      setNewAvatarFile(file);
    } catch (err) {
      console.error("Error cropping image", err);
    } finally {
      setIsImageProcessing(false);
    }
  };

  const handleImageDelete = () => {
    if (formData.avatar && formData.avatar.startsWith('blob:')) {
      URL.revokeObjectURL(formData.avatar);
    }
    setFormData({ ...formData, avatar: '' }); 
    setNewAvatarFile(null);
    setRemovedAvatar(true); 
  };

  const handleResumeSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg('Resume PDF size must be less than 2MB!');
        e.target.value = '';
        return;
      }
      setErrorMsg('');
      setFormData({ ...formData, resumeLink: URL.createObjectURL(file), resumeName: file.name });
      setNewResumeFile(file);
      setRemovedResume(false); 
    }
    e.target.value = ''; 
  };

  const handleResumeDelete = () => {
    if (formData.resumeLink && formData.resumeLink.startsWith('blob:')) {
      URL.revokeObjectURL(formData.resumeLink);
    }
    setFormData({ ...formData, resumeLink: '', resumeName: '' });
    setNewResumeFile(null);
    setRemovedResume(true); 
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string' || !name.trim()) return "U";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
    return words[0].length >= 2 ? `${words[0][0]}${words[0][1]}`.toUpperCase() : words[0][0].toUpperCase();
  };

  const dynamicAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(getInitials(formData.name))}&background=0a2336&color=0ef&bold=true&size=256`;

  return (
    <div className="w-full max-w-[600px] bg-[#081b29] border border-cyan-500/20 rounded-3xl shadow-neon p-6 sm:p-8 flex flex-col my-10 mx-auto relative overflow-hidden">

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[9999] px-4 animate-fadeInSmooth">
          <div className="bg-[#081b29] p-6 sm:p-8 rounded-3xl border border-red-500/50 w-full max-w-sm text-center shadow-[0_0_40px_rgba(255,0,0,0.15)] relative overflow-hidden">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <AlertTriangle className="text-red-500 w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Delete Account?</h3>
            <p className="text-gray-400 text-sm mb-8">This action is permanent and cannot be undone. All your links, data, and username will be erased forever.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-[#0a2336] border border-cyan-500/30 text-gray-300 font-semibold rounded-xl hover:bg-[#06141f] transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleDeleteAccount} disabled={deleteLoading} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-[0_0_15px_rgba(255,0,0,0.4)] cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50">
                {deleteLoading ? <span className="animate-spin h-5 w-5 border-b-2 border-white rounded-full"></span> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {imageToCrop && <ImageCropModal imageSrc={imageToCrop} onComplete={handleCropComplete} onClose={() => setImageToCrop(null)} />}

      <header className="flex justify-between items-center mb-6 border-b border-cyan-500/30 pb-4">
        <h2 className="text-xl font-bold text-cyan-400">Dashboard</h2>
        <div className="flex gap-3 sm:gap-4">
          <button onClick={() => navigate(`/${profileData?.username || username}`)} className="text-gray-400 hover:text-cyan-400 flex flex-col items-center text-xs transition-colors cursor-pointer">
            <Eye size={18} /> Preview
          </button>
          <button onClick={handleLogout} className="text-gray-400 hover:text-orange-400 flex flex-col items-center text-xs transition-colors cursor-pointer">
            <LogOut size={18} /> Logout
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="text-gray-400 hover:text-red-500 flex flex-col items-center text-xs transition-colors cursor-pointer ml-1">
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </header>

      {errorMsg && <div className="w-full bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm font-semibold text-center mb-4">{errorMsg}</div>}

      <div className="mb-10 bg-[#0a2336] p-5 rounded-xl border border-cyan-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">Edit Profile Info</h3>
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative">
              <img src={formData.avatar || dynamicAvatar} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-cyan-500/50 shadow-neon" />
              {isImageProcessing && (
                <div className="absolute inset-0 bg-[#081b29]/60 rounded-full flex justify-center items-center">
                  <span className="animate-spin h-6 w-6 border-b-2 border-cyan-400 rounded-full"></span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className={`bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded text-sm text-center transition-colors ${isProfileSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-cyan-500/20'}`}>
                Upload Picture (Max 2MB)
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" disabled={isProfileSaving} />
              </label>
              {formData.avatar && <button type="button" onClick={handleImageDelete} disabled={isProfileSaving} className="text-red-400 text-xs hover:text-red-500 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Remove Picture</button>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">Full Name</label>
              <input type="text" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} className="p-3 bg-[#081b29] border border-cyan-500/30 rounded text-white text-sm outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed" required disabled={isProfileSaving} />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">Username</label>
              <input type="text" value={formData.username || ''} onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})} className="p-3 bg-[#081b29] border border-cyan-500/30 rounded text-white text-sm outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed" required disabled={isProfileSaving} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">Email Address</label>
              <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase().replace(/\s/g, '')})} className="p-3 bg-[#081b29] border border-cyan-500/30 rounded text-white text-sm outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed" required disabled={isProfileSaving} />
            </div>
            
            <div className="flex flex-col">
              <label className="text-xs text-gray-400 mb-1">New Password (Optional)</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Leave blank to keep current" 
                  autoComplete="new-password" 
                  value={formData.password || ''} 
                  onChange={(e) => setFormData({...formData, password: e.target.value.replace(/\s/g, '')})} 
                  className="p-3 w-full bg-[#081b29] border border-cyan-500/30 rounded text-white text-sm outline-none focus:border-cyan-400 pr-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProfileSaving}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-3 text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProfileSaving}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1">Auto-type text (comma separated)</label>
            <input type="text" value={formData.typedText || ''} onChange={(e) => setFormData({...formData, typedText: e.target.value})} className="p-3 bg-[#081b29] border border-cyan-500/30 rounded text-white text-sm outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed" required disabled={isProfileSaving} />
          </div>
          
          <div className="mt-2">
            <label className="block text-gray-400 text-xs mb-2">Upload Resume (Max 2MB)</label>
            <input type="file" accept=".pdf" onChange={handleResumeSelect} disabled={isProfileSaving} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:file:bg-cyan-500/20" />
            {formData.resumeName && (
               <div className="flex items-center gap-4 mt-2 bg-[#081b29] border border-cyan-500/30 p-2 rounded-lg">
                 <p className="text-green-400 text-xs flex-1 truncate">✓ Attached: {formData.resumeName}</p>
                 <button type="button" onClick={handleResumeDelete} disabled={isProfileSaving} className="text-red-400 text-xs hover:text-red-500 font-bold px-2 disabled:opacity-50 disabled:cursor-not-allowed">Remove</button>
               </div>
            )}
          </div>
          
          <button type="submit" disabled={isProfileSaving} className="mt-4 flex items-center justify-center gap-2 py-3 bg-cyan-400 text-[#081b29] font-bold rounded-lg hover:bg-orange-400 shadow-neon transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {isProfileSaving ? <span className="animate-spin h-5 w-5 border-b-2 border-[#081b29] rounded-full"></span> : <><Save size={18} /> Save Changes</>}
          </button>
          
          {saveMsg && <p className="text-green-400 text-sm text-center font-semibold mt-2">{saveMsg}</p>}
        </form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Manage Links</h3>
        <EditLinkModal 
           onAdd={async (newLink) => await handleLinksSave([...links, newLink])} 
           isLoading={isLinksSaving} 
        />
        <div className="mt-6">
          <h4 className="text-xs text-gray-400 mb-2 flex items-center justify-between">
            <span>Active Links <span className="text-[10px] text-cyan-500/50">(Hold grip icon to drag)</span></span>
            {/* Inline drag-and-drop / delete loader */}
            {isLinksSaving && <span className="animate-spin h-4 w-4 border-b-2 border-cyan-400 rounded-full"></span>}
          </h4>
          <DraggableLinkList links={links} setLinks={handleLinksSave} isLoading={isLinksSaving} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;