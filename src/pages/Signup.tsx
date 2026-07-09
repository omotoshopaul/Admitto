import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from '../lib/firebase';
import { FirebaseError } from 'firebase/app';

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let isValid = true;
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    if (!firstName.trim()) {
      setFirstNameError('This field is required');
      isValid = false;
    }

    if (!lastName.trim()) {
      setLastNameError('This field is required');
      isValid = false;
    }

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`
      });
      const actionCodeSettings = {
        url: `${window.location.origin}/step1`
      };
      await sendEmailVerification(userCredential.user, actionCodeSettings);
      navigate('/step1');
    } catch (error) {
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setGeneralError('An account with this email already exists');
            break;
          case 'auth/weak-password':
            setGeneralError('Password is too weak');
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

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-['Lexend',sans-serif]">
      {/* LEFT COLUMN: FORM */}
      <div className="w-full md:w-1/2 min-h-screen flex flex-col px-6 py-8 md:px-16 lg:px-24">
        {/* Top Navigation */}
        <div className="mb-12">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors inline-block">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center md:text-left">Create an account</h1>

          <div className="group border border-gray-200 focus-within:border-[rgba(226,75,74,1)] rounded-2xl p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all duration-300">
            <form className="flex flex-col gap-5" onSubmit={handleSignup}>
              {/* Name Fields Row */}
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <input 
                    type="text" 
                    placeholder="John"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${firstNameError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#E24B4A]'}`}
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (firstNameError) setFirstNameError('');
                    }}
                  />
                  {firstNameError && <p className="text-red-500 text-xs mt-1">{firstNameError}</p>}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <input 
                    type="text" 
                    placeholder="Doe"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${lastNameError ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#E24B4A]'}`}
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (lastNameError) setLastNameError('');
                    }}
                  />
                  {lastNameError && <p className="text-red-500 text-xs mt-1">{lastNameError}</p>}
                </div>
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
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
              </div>

              {generalError && <p className="text-red-500 text-sm text-center font-medium mt-2">{generalError}</p>}

              {/* Primary Button */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#E24B4A] hover:bg-red-500 text-white font-medium py-3.5 rounded-xl mt-2 transition-all hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center h-[52px]"
              >
                {isLoading ? <i className="fa-solid fa-spinner animate-spin text-xl"></i> : 'Create account'}
              </button>
            </form>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-500">Already have an account? </span>
              <Link to="/login" className="text-[#E24B4A] font-medium hover:underline">
                Sign in
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
    </div>
  );
}
