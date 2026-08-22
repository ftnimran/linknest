import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; 

export const AuthProvider = ({ children }) => {
  const [isAuth, setIsAuth] = useState(false); 
  const [token, setToken] = useState(localStorage.getItem('linknest_token') || null);
  const [username, setUsername] = useState(localStorage.getItem('linknest_username') || null);
  const [isAdminRole, setIsAdminRole] = useState(false);
  
  const [isAppLoading, setIsAppLoading] = useState(true);
  
  const [profileData, setProfileData] = useState({
    name: "User",
    username: "user",
    email: "", 
    avatar: "", 
    typedText: "Welcome to Linknest",
    resumeLink: "",
    resumeName: ""
  });
  
  const [links, setLinks] = useState([]);

  const logout = useCallback(() => {
    localStorage.removeItem('linknest_token');
    localStorage.removeItem('linknest_username');
    setToken(null);
    setUsername(null);
    setIsAuth(false);
    setIsAdminRole(false);
    setLinks([]);
  }, []);

  const fetchMyProfile = useCallback(async () => {
    if (!token) {
      setIsAppLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.username) {
          setUsername(data.username);
          localStorage.setItem('linknest_username', data.username);
        }

        const avatarUrl = data.avatar 
          ? (data.avatar.startsWith('http') || data.avatar.startsWith('data:') 
              ? data.avatar 
              : `${API_BASE_URL}${data.avatar}`) 
          : "";

        const resumeUrl = data.resumeLink 
          ? (data.resumeLink.startsWith('http') || data.resumeLink.startsWith('data:') 
              ? data.resumeLink 
              : `${API_BASE_URL}${data.resumeLink}`) 
          : "";

        setProfileData({
          name: data.name || "User",
          username: data.username || "user",
          email: data.email || "", 
          avatar: avatarUrl,
          typedText: data.typedText || "",
          resumeLink: resumeUrl,
          resumeName: data.resumeName || ""
        });
        setLinks(data.links || []);
        setIsAuth(true);
        setIsAdminRole(data.role === 'admin');
      } else {
        logout();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      logout();
    } finally {
      setIsAppLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) {
      fetchMyProfile();
    } else {
      setIsAppLoading(false);
    }
  }, [token, fetchMyProfile]);

  const login = (newToken, userRole, uName) => {
    localStorage.setItem('linknest_token', newToken);
    localStorage.setItem('linknest_username', uName);
    setToken(newToken);
    setUsername(uName);
    setIsAuth(true);
    setIsAdminRole(userRole === 'admin');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuth, isAdminRole, token, username, login, logout, 
      links, setLinks, profileData, setProfileData, fetchMyProfile, isAppLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);