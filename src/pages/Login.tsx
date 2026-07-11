import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail } from '../lib/firebase';
import { FirebaseError } from 'firebase/app';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showVerifiedBanner, setShowVerifiedBanner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setShowVerifiedBanner(true);
      const prefilledEmail = searchParams.get('email');
      if (prefilledEmail) {
        setEmail(prefilledEmail);
      }
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);
  const [password, setPassword] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const validate = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    if (!email.trim()) {
      setEmailError('This field is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('This field is required');
      isValid = false;
    } else if (password.length < 6 || !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/.test(password)) {
      setPasswordError('Password must be at least 6 characters and include a letter, a number, and a special character');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const redirectTo = searchParams.get('redirect') || '/step1';
      navigate(redirectTo);
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
            setGeneralError('Incorrect email or password');
            break;
          case 'auth/user-not-found':
            setGeneralError('No account found with this email');
            break;
          case 'auth/too-many-requests':
            setGeneralError('Too many attempts. Please try again later');
            break;
          default:
            setGeneralError('Something went wrong. Please try again');
        }
      } else {
        setGeneralError('Something went wrong. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotEmailError('');
    setForgotMessage('');
    
    if (!forgotEmail.trim()) {
      setForgotEmailError('This field is required');
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotEmailError('Please enter a valid email address');
      return;
    }

    setIsForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setForgotMessage('If an account exists for this email, a password reset link has been sent. Please check your inbox.');
    } catch (error) {
      setForgotEmailError('Something went wrong. Please try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-['Lexend',sans-serif]">
      {/* LEFT COLUMN: FORM */}
      <div className="w-full md:w-1/2 min-h-screen flex flex-col px-6 py-8 md:px-16 lg:px-24">
        {/* Top Navigation */}
        <div className="mb-12">
          <Link to="/signup" className="text-gray-400 hover:text-gray-600 transition-colors inline-block">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center md:text-left">Login</h1>
          
          {showVerifiedBanner && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
              Your email has been verified! Please log in to continue.
            </div>
          )}

          <div className="group border border-[rgba(226,75,74,0.7)] focus-within:border-[rgba(226,75,74,1)] rounded-2xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition-all duration-300">
            <form className="flex flex-col gap-5" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Email address</label>
                <input 
                  type="email" 
                  placeholder="johndoe@gmail.com"
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${emailError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#E24B4A]'}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                />
                {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors pr-12 ${passwordError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#E24B4A]'}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
                <div className="flex justify-end mt-1">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForgotModal(true);
                      setForgotEmail(email); // Pre-fill with entered email
                      setForgotEmailError('');
                      setForgotMessage('');
                    }} 
                    className="text-xs text-[#E24B4A] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {generalError && <p className="text-red-500 text-sm text-center font-medium mt-2">{generalError}</p>}

              {/* Primary Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#E24B4A] hover:bg-red-500 text-white font-medium py-3.5 rounded-xl mt-2 transition-all hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center h-[52px]"
              >
                {isLoading ? <i className="fa-solid fa-spinner animate-spin text-xl"></i> : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">Don't have an account? </span>
              <Link to="/signup" className="text-[#E24B4A] font-medium hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: BRAND PANEL (Hidden on mobile) */}
      <div className="hidden md:flex w-1/2 min-h-screen bg-gradient-to-br from-[#E24B4A] to-[#c73e3d] flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Optional decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 0%, transparent 50%)' }}></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <h1 className="text-6xl lg:text-8xl font-bold tracking-tight leading-none text-white mb-6">
            Adm<span className="relative inline-block">
              ı
              <span className="absolute top-[0.15em] left-[50%] -translate-x-[50%] w-[0.18em] h-[0.18em] bg-white/50 rounded-full"></span>
            </span>tto
          </h1>
          <p className="text-xl text-white/90 font-light">
            Your Intelligent Admissions Companion
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative">
            <button 
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Reset your password</h2>
            
            {forgotMessage ? (
              <p className="text-sm text-gray-600 mb-6">{forgotMessage}</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-6">Enter your email address and we'll send you a link to reset your password.</p>
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <input 
                      type="email" 
                      placeholder="johndoe@gmail.com"
                      className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${forgotEmailError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#E24B4A]'}`}
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotEmailError) setForgotEmailError('');
                      }}
                    />
                    {forgotEmailError && <p className="text-red-500 text-xs mt-1">{forgotEmailError}</p>}
                  </div>
                  <button 
                    type="submit" 
                    disabled={isForgotLoading}
                    className="w-full bg-[#E24B4A] hover:bg-red-500 text-white font-medium py-3 rounded-xl transition-all hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center h-[48px]"
                  >
                    {isForgotLoading ? <i className="fa-solid fa-spinner animate-spin text-xl"></i> : 'Send reset link'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
