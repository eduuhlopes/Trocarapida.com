import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white/60 backdrop-blur-sm shadow-md w-full sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-20">
          
          {/* Logo */}
           <div className="flex items-center gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 6.5H21.5V11.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.16 11.5A7.5 7.5 0 1 0 17 6.5L21.5 6.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.5 17.5H2.5V12.5" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.84 12.5A7.5 7.5 0 1 0 7 17.5L2.5 17.5" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-2xl font-bold tracking-tight text-gray-800 font-sans">
              TrocaRápida<span className="text-gray-500">.com</span>
            </span>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;