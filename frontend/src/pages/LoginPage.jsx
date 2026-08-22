import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ArrowLeft, Eye, EyeOff, Mail, CheckCircle, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState('login'); 
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(0);

  const [name, setName] = useState('');
  const [username, setUsername] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [otpArray, setOtpArray] = useState(new Array(6).fill('')); 
  const [loading, setLoading] = useState(false);

  const [msgState, setMsgState] = useState({ type: '', text: '', isVisible: false });
  const msgTimeoutRef = useRef(null);

  const showMessage = (type, text) => {
    if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
    setMsgState({ type, text, isVisible: true });
    msgTimeoutRef.current = setTimeout(() => {
      setMsgState(prev => ({ ...prev, isVisible: false }));
    }, 4000);
  };

  useEffect(() => {
    if (location.state?.isSignup) setStep('signup');
  }, [location]);

  useEffect(() => {
    let interval;
    if (timer > 0 && (step === 'signup-otp' || step === 'forgot-otp')) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer, step]);

  useEffect(() => {
    if (step === 'login') {
      document.title = 'Sign In - LinkNest';
    } else if (step === 'signup' || step === 'signup-otp') {
      document.title = 'Sign Up - LinkNest';
    } else if (step.startsWith('forgot')) {
      // isme forgot-email, forgot-otp aur forgot-reset teeno cover ho jayenge
      document.title = 'Forgot Password - LinkNest';
    }
  }, [step]);

  const switchStep = (newStep) => {
    setStep(newStep);
    setMsgState({ isVisible: false });
    
    if (newStep === 'login') {
      setPassword('');
      setConfirmPassword('');
      setOtpArray(new Array(6).fill(''));
      setTimer(0);
    } else if (newStep === 'forgot-email') {
      setOtpArray(new Array(6).fill(''));
      setPassword('');
      setConfirmPassword('');
    } else if (newStep === 'signup') {
      setOtpArray(new Array(6).fill(''));
    }
  };

  const handleBack = () => {
    if (step === 'signup' || step === 'forgot-email') {
      switchStep('login');
    } else if (step === 'signup-otp') {
      switchStep('signup');
    } else if (step === 'forgot-otp') {
      switchStep('forgot-email');
    } else if (step === 'forgot-reset') {
      switchStep('forgot-otp');
    } else {
      navigate(-1);
    }
  };

  const fetchAPI = async (endpoint, payload) => {
    setLoading(true); 
    setMsgState({ ...msgState, isVisible: false }); 
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) throw new Error(data.message || 'Something went wrong');
      return data;
    } catch (err) {
      setLoading(false);
      showMessage('error', err.message);
      return null;
    }
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newOtp = [...otpArray];
    newOtp[index] = element.value;
    setOtpArray(newOtp);
    
    if (element.value && index < 5) {
      const inputs = document.querySelectorAll('.otp-input');
      if (inputs[index + 1]) inputs[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpArray[index] && index > 0) {
      const inputs = document.querySelectorAll('.otp-input');
      if (inputs[index - 1]) inputs[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      const newOtp = [...otpArray];
      for (let i = 0; i < pasteData.length; i++) {
        newOtp[i] = pasteData[i];
      }
      setOtpArray(newOtp);
      
      setTimeout(() => {
        const inputs = document.querySelectorAll('.otp-input');
        const focusIndex = pasteData.length < 6 ? pasteData.length : 5;
        if (inputs[focusIndex]) inputs[focusIndex].focus();
      }, 10);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const data = await fetchAPI('/login', { email, password });
    if (data) {
      login(data.token, data.role, data.username);
      navigate('/admin');
    }
  };

  const handleSignup = async (e) => {
    if(e) e.preventDefault();
    
    if (password.length < 8) {
      return showMessage('error', 'Password must be at least 8 characters long!');
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(password);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return showMessage('error', 'Password must contain A-Z, a-z, 0-9, and a special character (!@#$%^&*)');
    }
    
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const data = await fetchAPI('/register', { name, email, username: cleanUsername, password });
    
    if (data) {
      showMessage('success', data.message);
      setTimer(60); 
      switchStep('signup-otp');
    }
  };

  const handleVerifySignupOtp = async (e) => {
    e.preventDefault();
    const otpValue = otpArray.join('');
    if (otpValue.length < 6) return showMessage('error', 'Enter full 6-digit OTP');
    
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const data = await fetchAPI('/verify-signup-otp', { 
      name, email, username: cleanUsername, password, otp: otpValue 
    });
    
    if (data) {
      setTimer(-1);
      showMessage('success', 'Account Created Successfully! Redirecting...');
      setTimeout(() => { 
        switchStep('login');
      }, 2000);
    }
  };

  const handleForgotEmail = async (e) => {
    if(e) e.preventDefault();
    const data = await fetchAPI('/forgot-password', { email });
    if (data) {
      showMessage('success', data.message);
      setTimer(60);
      switchStep('forgot-otp');
    }
  };

  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    const otpValue = otpArray.join('');
    if (otpValue.length < 6) return showMessage('error', 'Enter full 6-digit OTP');

    const data = await fetchAPI('/verify-reset-otp', { email, otp: otpValue });
    if (data) {
      setTimer(-1);
      showMessage('success', data.message);
      // FIX 2: Added 1.5 seconds delay before switching step so the success message is readable
      setTimeout(() => {
        switchStep('forgot-reset');
      }, 1500);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (password.length < 8) {
      return showMessage('error', 'New password must be at least 8 characters long!');
    }
    
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(password);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return showMessage('error', 'Password must contain A-Z, a-z, 0-9, and a special character (!@#$%^&*)');
    }

    if (password !== confirmPassword) return showMessage('error', 'Passwords do not match!');
    
    const otpValue = otpArray.join('');
    const data = await fetchAPI('/reset-password', { email, otp: otpValue, newPassword: password });
    if (data) {
      showMessage('success', 'Password changed successfully! Redirecting...');
      setTimeout(() => { 
        switchStep('login'); 
      }, 2000);
    }
  };

  return (
    <div className="w-full max-w-sm bg-[#081b29] border border-cyan-500/20 rounded-3xl shadow-neon p-8 mx-auto my-10 relative overflow-hidden">
      
      {loading && (
        <div className="absolute inset-0 bg-[#081b29]/80 flex justify-center items-center z-10 pointer-events-none"></div>
      )}

      <button onClick={handleBack} className="text-cyan-400 flex items-center gap-2 mb-4 hover:text-white transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Back
      </button>
      
      <h2 className="text-2xl font-bold text-center text-white mb-2">
        {step === 'login' && 'Sign In'}
        {step === 'signup' && 'Create Account'}
        {step === 'signup-otp' && 'Verify Email'}
        {step === 'forgot-email' && 'Reset Password'}
        {step === 'forgot-otp' && 'Enter OTP'}
        {step === 'forgot-reset' && 'New Password'}
      </h2>
      
      <p className="text-gray-400 text-xs text-center">
        {(step === 'signup-otp' || step === 'forgot-otp') && `OTP sent to ${email}`}
        {step === 'forgot-reset' && 'Take your time to create a strong password'}
      </p>

      <div className="relative h-8 w-full mt-2 mb-4 flex justify-center items-center pointer-events-none">
        <div className={`absolute transition-all duration-500 ease-in-out flex items-center gap-1.5 ${msgState.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          {msgState.type === 'error' && (
            <span className="text-red-400 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle size={14} /> {msgState.text}
            </span>
          )}
          {msgState.type === 'success' && (
            <span className="text-green-400 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle size={14} /> {msgState.text}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        
        {step === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="email" 
              value={email} 
              maxLength={100}
              autoCapitalize="none" 
              autoCorrect="off" 
              onChange={(e) => setEmail(e.target.value.toLowerCase().replace(/\s/g, ''))} 
              placeholder="Email Address" 
              className="p-3 bg-[#0a2336] rounded border border-cyan-500/30 text-white outline-none focus:border-cyan-400 transition-colors" 
              required 
            />
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                maxLength={64}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))} 
                placeholder="Password" 
                className="p-3 w-full bg-[#0a2336] rounded border border-cyan-500/30 text-white outline-none focus:border-cyan-400 pr-10 transition-colors" 
                required 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="text-right -mt-2">
              <button type="button" onClick={() => switchStep('forgot-email')} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer">
                Forgot Password?
              </button>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 mt-2 bg-cyan-400 text-[#081b29] font-bold rounded-lg hover:bg-orange-400 shadow-neon transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? <span className="animate-spin h-5 w-5 border-b-2 border-[#081b29] rounded-full"></span> : 'Sign In'}
            </button>
            
            <p className="text-center text-sm text-gray-400 mt-2">
              Don't have an account? <button type="button" onClick={() => switchStep('signup')} className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors cursor-pointer">Sign Up</button>
            </p>
          </form>
        )}

        {step === 'signup' && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <input 
              type="text" 
              value={name} 
              maxLength={50} 
              onChange={(e) => setName(e.target.value.replace(/\b\w/g, c => c.toUpperCase()))} 
              placeholder="Full Name" 
              className="p-3 bg-[#0a2336] rounded border border-cyan-500/30 text-white outline-none focus:border-cyan-400 transition-colors" 
              required 
            />
            
            <input 
              type="text" 
              value={username} 
              maxLength={30} 
              autoCapitalize="none" 
              autoCorrect="off" 
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} 
              placeholder="Username" 
              className="p-3 bg-[#0a2336] rounded border border-cyan-500/30 text-white outline-none focus:border-cyan-400 transition-colors" 
              required 
            />
            
            <input 
              type="email" 
              value={email} 
              maxLength={100} 
              autoCapitalize="none" 
              autoCorrect="off" 
              onChange={(e) => setEmail(e.target.value.toLowerCase().replace(/\s/g, ''))} 
              placeholder="Email Address" 
              className="p-3 bg-[#0a2336] rounded border border-cyan-500/30 text-white outline-none focus:border-cyan-400 transition-colors" 
              required 
            />
            
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                maxLength={64} 
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))} 
                placeholder="Password (Min 8 chars, needs special char)" 
                className="p-3 w-full bg-[#0a2336] rounded border border-cyan-500/30 text-white outline-none focus:border-cyan-400 pr-10 transition-colors" 
                required 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 mt-2 bg-cyan-400 text-[#081b29] font-bold rounded-lg hover:bg-orange-400 shadow-neon transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? <span className="animate-spin h-5 w-5 border-b-2 border-[#081b29] rounded-full"></span> : 'Sign Up'}
            </button>
            
            <p className="text-center text-sm text-gray-400 mt-2">
              Already have an account? <button type="button" onClick={() => switchStep('login')} className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors cursor-pointer">Sign In</button>
            </p>
          </form>
        )}

        {step === 'forgot-email' && (
          <form onSubmit={handleForgotEmail} className="flex flex-col gap-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input 
                type="email" 
                value={email} 
                maxLength={100}
                autoCapitalize="none"
                autoCorrect="off"
                onChange={(e) => setEmail(e.target.value.toLowerCase().replace(/\s/g, ''))} 
                placeholder="Enter your email" 
                className="p-3 pl-10 w-full bg-[#0a2336] rounded border border-cyan-500/30 text-white outline-none focus:border-cyan-400 transition-colors" 
                required 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 mt-2 bg-cyan-400 text-[#081b29] font-bold rounded-lg hover:bg-orange-400 shadow-neon transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? <span className="animate-spin h-5 w-5 border-b-2 border-[#081b29] rounded-full"></span> : 'Send OTP'}
            </button>
            
            <button type="button" onClick={() => switchStep('login')} className="text-xs text-gray-400 hover:text-cyan-400 mt-2 cursor-pointer transition-colors">
              Back to Login
            </button>
          </form>
        )}

        {(step === 'signup-otp' || step === 'forgot-otp') && (
          <form onSubmit={step === 'signup-otp' ? handleVerifySignupOtp : handleVerifyForgotOtp} className="flex flex-col gap-4">
            <div className="flex justify-between gap-2">
              {otpArray.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={data}
                  onChange={e => handleOtpChange(e.target, index)}
                  onKeyDown={e => handleOtpKeyDown(e, index)}
                  onPaste={handleOtpPaste}
                  onFocus={e => e.target.select()}
                  className="otp-input w-12 h-12 text-center text-xl font-bold bg-[#0a2336] rounded border border-cyan-500/30 text-white outline-none focus:border-cyan-400 shadow-sm transition-colors"
                  required
                />
              ))}
            </div>
            
            {/* FIX 1: Jab timer 0 ho jaye tabhi expired text dikhega, verified pe (-1 par) text completely null ho jayega */}
            <div className="flex justify-between items-center mt-1 px-1">
              {timer > 0 ? (
                <span className="text-gray-400 text-xs w-full text-center">
                  OTP expires in <span className="text-cyan-400 font-mono font-bold">00:{timer < 10 ? `0${timer}` : timer}</span>
                </span>
              ) : timer === 0 ? (
                <>
                  <span className="text-red-400 text-xs font-semibold">OTP has expired!</span>
                  <button
                    type="button"
                    onClick={step === 'signup-otp' ? handleSignup : handleForgotEmail}
                    className="text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-colors cursor-pointer hover:underline"
                  >
                    Resend OTP
                  </button>
                </>
              ) : null}
            </div>
            
            <button 
              type="submit" 
              disabled={loading || timer <= 0}
              className="w-full py-3 mt-2 bg-cyan-400 text-[#081b29] font-bold rounded-lg hover:bg-orange-400 shadow-neon transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? <span className="animate-spin h-5 w-5 border-b-2 border-[#081b29] rounded-full"></span> : 'Verify OTP'}
            </button>
          </form>
        )}

        {step === 'forgot-reset' && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                maxLength={64}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))} 
                placeholder="New Password (Min 8 chars, needs special char)" 
                className="p-3 w-full bg-[#0a2336] rounded border border-cyan-500/30 text-white outline-none focus:border-cyan-400 pr-10 transition-colors" 
                required 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-cyan-400 cursor-pointer transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={confirmPassword} 
                maxLength={64}
                onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ''))} 
                placeholder="Confirm New Password" 
                className="p-3 w-full bg-[#0a2336] rounded border border-cyan-500/30 text-white outline-none focus:border-cyan-400 transition-colors" 
                required 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 mt-2 bg-cyan-400 text-[#081b29] font-bold rounded-lg hover:bg-orange-400 shadow-neon transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? <span className="animate-spin h-5 w-5 border-b-2 border-[#081b29] rounded-full"></span> : 'Change Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default LoginPage;