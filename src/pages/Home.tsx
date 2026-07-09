import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import StatStrip from '../components/StatStrip';
import HowItWorks from '../components/HowItWorks';
import FAQ from '../components/FAQ';
import Team from '../components/Team';
import Footer from '../components/Footer';
import { auth, sendEmailVerification } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !currentUser.emailVerified) {
        setShowVerificationBanner(true);
      } else {
        setShowVerificationBanner(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleResendVerification = async () => {
    if (!user) return;
    setSendingVerification(true);
    try {
      await sendEmailVerification(user);
      alert("Verification email sent! Please check your inbox.");
    } catch (error) {
      alert("Failed to send verification email. Please try again later.");
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {showVerificationBanner && (
        <div className="w-full bg-[#E24B4A] text-white text-sm py-3 px-6 flex items-center justify-between z-[60] relative">
          <div className="flex-1 text-center font-medium">
            Please verify your email — check your inbox for a link from Admitto. 
            <button 
              onClick={handleResendVerification}
              disabled={sendingVerification}
              className="ml-2 underline hover:text-white/80 transition-colors font-semibold disabled:opacity-70"
            >
              {sendingVerification ? 'Sending...' : 'Resend email'}
            </button>
          </div>
          <button 
            onClick={() => setShowVerificationBanner(false)}
            className="text-white hover:text-white/80 transition-colors ml-4"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}
      <Navbar />
      <main>
        <Hero />
        <StatStrip />
        <HowItWorks />
        <FAQ />
        <Team />
      </main>
      <Footer />
    </div>
  );
}
