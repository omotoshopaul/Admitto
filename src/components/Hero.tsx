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

      <img 
        src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2U3ZTVlNCIvPjwvc3ZnPg==" 
        alt="Admitto hero image"
        className="w-full max-w-[600px] h-[350px] md:h-[400px] bg-gray-100 rounded-3xl shadow-sm border border-gray-100 object-cover"
      />
    </section>
  );
}
