import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Hero() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <section className="pt-40 pb-16 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
      <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-gray-900 mb-6">
        Adm<span className="relative inline-block">
          ı
          <span className="absolute top-[0.15em] left-[50%] -translate-x-[50%] w-[0.18em] h-[0.18em] bg-brand-red rounded-full"></span>
        </span>tto
      </h1>
      
      <p className="text-xl md:text-2xl text-gray-500 font-light mb-10 max-w-2xl mx-auto">
        Your Intelligent Admissions Companion
      </p>

      <div className="flex flex-row justify-center items-center gap-3 md:gap-4 mb-16">
        <a href="#how-it-works" className="bg-brand-red hover:bg-red-500 text-white px-5 py-2 md:px-8 md:py-3 text-sm md:text-base whitespace-nowrap rounded-full font-medium transition-colors shadow-sm inline-block">
          Learn more
        </a>
        <Link to={isAuthenticated ? "/step1" : "/signup"} className="bg-transparent border-2 border-brand-red text-brand-red hover:bg-red-50 px-5 py-2 md:px-8 md:py-3 text-sm md:text-base whitespace-nowrap rounded-full font-medium transition-colors">
          Get started
        </Link>
      </div>

      <svg viewBox="0 0 600 400" className="w-full max-w-[600px] h-[350px] md:h-[400px] rounded-3xl shadow-sm border border-gray-100" style={{ background: '#FAFAFA' }} role="img" aria-label="Illustration of a student verifying documents on a laptop">
  <circle cx="90" cy="80" r="70" fill="#FCEBEB" />
  <circle cx="520" cy="320" r="90" fill="#E6F1FB" />

  <ellipse cx="300" cy="355" rx="180" ry="14" fill="#EEF0F2" />

  <g>
    <path d="M225 240 Q220 290 232 350 L260 350 Q264 300 270 260 Z" fill="#378ADD" />
    <path d="M270 260 Q300 272 316 240 L304 224 Q286 240 272 244 Z" fill="#185FA5" />
    <path d="M232 240 Q236 290 242 350 L260 350 Q262 300 252 240 Z" fill="#0C447C" opacity="0.25" />
    <circle cx="248" cy="196" r="30" fill="#F5C4B3" />
    <path d="M220 188 Q218 162 248 160 Q278 162 276 188 Q276 170 248 168 Q220 170 220 188 Z" fill="#2C2C2A" />
    <path d="M248 226 Q220 232 228 258 Q242 266 270 258 Q280 232 248 226 Z" fill="#378ADD" />
    <g transform="translate(244,198)">
      <circle cx="0" cy="0" r="2" fill="#2C2C2A" />
      <circle cx="12" cy="0" r="2" fill="#2C2C2A" />
      <path d="M-3 9 Q6 15 15 9" fill="none" stroke="#2C2C2A" stroke-width="2" stroke-linecap="round" />
    </g>
  </g>

  <g>
    <rect x="330" y="230" width="220" height="130" rx="8" fill="#2C2C2A" />
    <rect x="342" y="242" width="196" height="98" rx="2" fill="#E1F5EE" />
    <circle cx="440" cy="291" r="32" fill="#5DCAA5" />
    <path d="M425 291 L436 302 L457 277" fill="none" stroke="#04342C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
    <rect x="320" y="358" width="240" height="10" rx="4" fill="#444441" />
  </g>

  <g transform="translate(180,150)">
    <rect x="-20" y="-14" width="40" height="28" rx="4" fill="#ffffff" stroke="#E24B4A" stroke-width="1.5" />
    <path d="M-11 0 L-3 8 L12 -8" fill="none" stroke="#E24B4A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <g transform="translate(500,190)">
    <circle cx="0" cy="0" r="22" fill="#FAC775" />
    <path d="M-8 0 L-2 6 L10 -8" fill="none" stroke="#412402" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <g transform="translate(90,290)">
    <circle cx="0" cy="0" r="16" fill="#F0997B" />
    <path d="M-6 0 L-1 5 L7 -6" fill="none" stroke="#5c2a15" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>
    </section>
  );
}
