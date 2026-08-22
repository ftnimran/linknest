import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TopNavigation from '../components/TopNavigation';
import ProfileHeader from '../components/ProfileHeader';
import LinkButton from '../components/LinkButton';
import SkeletonProfile from '../components/SkeletonProfile';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Edit3, UserPlus, Link as LinkIcon } from 'lucide-react';

const ProfilePage = () => {
  const { isAuth, username: loggedInUser } = useAuth();
  const navigate = useNavigate();
  const { username } = useParams();
  
  const [publicData, setPublicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const resolveAssetUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const cleanBase = API_BASE_URL.replace(/\/$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/u/${username}`);
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();
        
        data.avatar = data.avatar ? resolveAssetUrl(data.avatar) : "";
        data.resumeLink = resolveAssetUrl(data.resumeLink);
        
        setPublicData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (username) fetchPublicProfile();
  }, [username]);

  useEffect(() => {
    if (publicData) {
      const title = `${publicData.name} - LinkNest`;
      const desc = publicData.typedText ? publicData.typedText.split(',')[0].trim() : 'View all my important links in one place.';
      
      const getInitials = (name) => {
        if (!name || typeof name !== 'string' || !name.trim()) return "U";
        const words = name.trim().split(/\s+/);
        if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
        return words[0].length >= 2 ? `${words[0][0]}${words[0][1]}`.toUpperCase() : words[0][0].toUpperCase();
      };
      
      const imgUrl = publicData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(getInitials(publicData.name || username))}&background=0a2336&color=0ef&bold=true&size=256`;

      document.title = title;

      const setMetaTag = (attrName, attrValue, content) => {
        let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute(attrName, attrValue);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };

      setMetaTag('property', 'og:title', title);
      setMetaTag('property', 'og:description', desc);
      setMetaTag('property', 'og:image', imgUrl);
      setMetaTag('property', 'og:url', window.location.href);
      setMetaTag('property', 'og:type', 'profile');
      
      setMetaTag('name', 'twitter:card', 'summary_large_image');
      setMetaTag('name', 'twitter:title', title);
      setMetaTag('name', 'twitter:description', desc);
      setMetaTag('name', 'twitter:image', imgUrl);
    }
    
    return () => {
      document.title = 'LinkNest';
    };
  }, [publicData]);

  if (loading) return <SkeletonProfile />;
  
  if (error) {
    return (
      <div className="w-full max-w-md mx-auto bg-[#081b29] border border-red-500/30 rounded-3xl p-8 text-center my-12 shadow-neon">
        <p className="text-red-400 font-bold text-lg mb-2">{error}</p>
        <p className="text-gray-400 text-xs mb-6">The profile you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-cyan-400 text-[#081b29] font-bold rounded-full text-xs hover:bg-orange-400 transition-colors cursor-pointer">
          Go to Home
        </button>
      </div>
    );
  }

  if (!publicData) return null;

  const isOwner = isAuth && loggedInUser === username;

  return (
    <main className="w-full max-w-[400px] sm:max-w-[450px] md:max-w-[500px] mx-auto bg-[#081b29] border border-cyan-500/20 rounded-3xl shadow-neon p-6 sm:p-8 flex flex-col items-center animate-fadeInSmooth">
      
      <TopNavigation username={username} isOwner={isOwner} profileData={publicData} />
      
      <ProfileHeader profileData={publicData} />
      
      <div className="w-full mt-8 space-y-4 flex flex-col items-center">
        {publicData.links && publicData.links.length > 0 ? (
          publicData.links.map((link) => (
            <LinkButton key={link.id || link.url} link={link} />
          ))
        ) : (
          <div className="w-full py-8 bg-[#0a2336] border border-cyan-500/20 rounded-2xl flex flex-col items-center justify-center text-center px-4">
            <LinkIcon className="w-8 h-8 text-cyan-500/40 mb-2" />
            <p className="text-gray-400 text-xs font-medium">No links available yet</p>
          </div>
        )}
      </div>

      <div className="mt-10 w-full flex justify-center">
        <button onClick={() => navigate(isOwner ? '/admin' : '/login', { state: { isSignup: !isOwner } })} className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-cyan-400 transition-colors bg-[#0a2336] px-6 py-2 rounded-full border border-cyan-500/30 shadow-sm cursor-pointer">
          {isOwner ? <><Edit3 size={16} /> Edit Profile & Links</> : <><UserPlus size={16} /> Create your own Profile</>}
        </button>
      </div>

      <footer className="mt-8 w-full pt-4 border-t border-cyan-500/30">
        <h6 className="text-center text-xs text-gray-500">Copyright &copy; {new Date().getFullYear()} | Designed by Imran Ali</h6>
      </footer>
    </main>
  );
};

export default ProfilePage;