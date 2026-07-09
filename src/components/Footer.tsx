import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full mt-24 text-white flex flex-col" style={{ backgroundColor: 'rgba(226, 75, 74, 1.0)' }}>
      <div className="max-w-7xl mx-auto w-full px-6 pt-16 pb-8 flex flex-col items-center">
        {/* Top Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">How can we help?</h2>
          <p className="text-lg opacity-90 mb-8">Contact us</p>
          <div className="flex flex-row justify-center items-center gap-8">
            <a href="#" className="text-white hover:opacity-80 hover:scale-110 transition-all">
              <i className="fa-brands fa-square-instagram text-4xl"></i>
            </a>
            <a href="#" className="text-white hover:opacity-80 hover:scale-110 transition-all">
              <i className="fa-brands fa-square-x-twitter text-4xl"></i>
            </a>
            <a href="mailto:admittoverification@gmail.com" className="text-white hover:opacity-80 hover:scale-110 transition-all">
              <i className="fa-solid fa-square-envelope text-4xl"></i>
            </a>
            <a href="https://wa.link/lpdfu3" className="text-white hover:opacity-80 hover:scale-110 transition-all">
              <i className="fa-brands fa-square-whatsapp text-4xl"></i>
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/30 mb-16"></div>

        {/* Big Wordmark */}
        <div className="mb-16 text-center w-full overflow-hidden flex justify-center">
          <h1 className="text-7xl sm:text-8xl md:text-[10rem] lg:text-[14rem] font-bold tracking-tight leading-none">
            Adm<span className="relative inline-block">
              ı
              <span className="absolute top-[0.15em] left-[50%] -translate-x-[50%] w-[0.18em] h-[0.18em] bg-white/50 rounded-full"></span>
            </span>tto
          </h1>
        </div>

        {/* Bottom Row */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-90">
          <div>© 2026 Admitto</div>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span className="opacity-50">|</span>
            <a href="#" className="hover:underline">Legal</a>
            <span className="opacity-50">|</span>
            <a href="#" className="hover:underline">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
