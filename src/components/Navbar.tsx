import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="w-full fixed top-0 left-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center relative" ref={menuRef}>
        <a href="#" className="flex-shrink-0 transition-opacity hover:opacity-90">
          <img 
            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=" 
            alt="Admitto logo"
            className="w-[120px] h-[40px] bg-gray-100 rounded object-cover"
          />
        </a>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#how-it-works" className="hover:text-brand-red transition-colors">How it works</a>
          <a href="#faqs" className="hover:text-brand-red transition-colors">FAQs</a>
          <button onClick={() => navigate(isAuthenticated ? '/purchase' : '/login?redirect=/purchase')} className="hover:text-brand-red transition-colors">Purchase</button>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link to={isAuthenticated ? "/step1" : "/signup"} className="bg-brand-red hover:bg-red-500 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
            Get started
          </Link>
          {isAuthenticated && (
            <button 
              onClick={handleLogout}
              className="text-gray-500 hover:text-brand-red transition-colors w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50"
              title="Log out"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Icon */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-600 hover:text-brand-red transition-colors w-10 h-10 flex items-center justify-center text-xl"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-20 left-0 right-0 bg-white border-b border-gray-100 shadow-lg md:hidden flex flex-col py-4 px-6 gap-4">
            <Link 
              to={isAuthenticated ? "/step1" : "/signup"} 
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-800 font-medium hover:text-brand-red transition-colors py-2"
            >
              Get started
            </Link>
            {isAuthenticated && (
              <button 
                onClick={handleLogout}
                className="text-left text-gray-800 font-medium hover:text-brand-red transition-colors py-2"
              >
                Log out
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
