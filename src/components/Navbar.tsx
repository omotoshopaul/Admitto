import React from 'react';

export default function Navbar() {
  return (
    <nav className="w-full fixed top-0 left-0 bg-white/95 backdrop-blur-md z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
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
          <a href="#team" className="hover:text-brand-red transition-colors">Team</a>
        </div>

        <div className="flex items-center gap-4">
          <a href="/signup" className="bg-brand-red hover:bg-red-500 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
            Get started
          </a>
        </div>
      </div>
    </nav>
  );
}
