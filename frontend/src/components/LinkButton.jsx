import React from 'react';

const LinkButton = ({ link }) => {
  const rawUrl = (link?.url || '').trim();
  
  let isEmailLink = false;
  let emailAddress = "";

  // FIX: Pure email validation ensuring normal web URLs are never accidentally misclassified
  const isJustEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(rawUrl);
  const isMailtoPrefix = rawUrl.toLowerCase().startsWith('mailto:');

  if (isJustEmail) {
    isEmailLink = true;
    emailAddress = rawUrl;
  } else if (isMailtoPrefix) {
    isEmailLink = true;
    emailAddress = rawUrl.replace(/^mailto:/i, '').trim();
  }

  const formatUrl = (url) => {
    if (!url) return '#';
    if (isEmailLink) return `mailto:${emailAddress}`;
    if (/^(https?|tel|whatsapp|sms):/i.test(url)) return url;
    return `https://${url}`;
  };

  const finalUrl = formatUrl(rawUrl);

  const handleClick = (e) => {
    if (isEmailLink && emailAddress) {
      e.preventDefault(); 
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        window.location.href = `mailto:${emailAddress}`;
      } else {
        const gmailDesktopUrl = `https://mail.google.com/mail/u/0/?fs=1&to=${emailAddress}&tf=cm`;
        window.open(gmailDesktopUrl, '_blank');
      }
    }
  };

  return (
    <a 
      href={finalUrl}
      onClick={handleClick}
      target={isEmailLink ? "_self" : "_blank"}
      rel="noopener noreferrer"
      className="w-full text-center py-3 px-6 bg-cyan-400 text-[#081b29] font-semibold rounded-full shadow-neon hover-shadow-neon transition-all duration-300 transform hover:scale-[1.02]"
    >
      {link.title}
    </a>
  );
};

export default LinkButton;