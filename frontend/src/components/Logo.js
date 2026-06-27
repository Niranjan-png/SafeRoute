'use client';

export default function Logo({ className = '', size = 40 }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div 
        className="relative flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 shadow-[0_4px_16px_rgba(15,165,138,0.15)] transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_24px_rgba(15,165,138,0.25)] select-none shrink-0"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Soft background radial glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-teal-500/5 opacity-80 blur-[2px]" />
        
        <svg 
          viewBox="0 0 100 100" 
          width={size * 0.65} 
          height={size * 0.65} 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0fa58a" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ccfbf1" />
            </linearGradient>
            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Minimalist Geometric Shield */}
          <path 
            d="M50 14 L80 23 C80 50 67 74 50 86 C33 74 20 50 20 23 Z" 
            stroke="url(#shieldGradient)" 
            strokeWidth="4.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="#0fa58a"
            fillOpacity="0.04"
          />

          {/* Winding Safe Route Path inside Shield */}
          <path 
            d="M36 60 C42 48, 42 62, 50 49 C58 36, 56 42, 64 33" 
            stroke="url(#nodeGradient)" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            strokeDasharray="1 6"
            strokeDashoffset="1"
            opacity="0.55"
          />

          {/* Safe Node 1 - Source */}
          <circle cx="36" cy="60" r="4.5" fill="#14b8a6" filter="url(#logoGlow)" />
          
          {/* Safe Node 2 - Intermediate checkpoint */}
          <circle cx="50" cy="49" r="5" fill="#2dd4bf" filter="url(#logoGlow)" />
          <circle cx="50" cy="49" r="1.5" fill="#ffffff" />

          {/* Pin/Destination Node at upper right */}
          <g transform="translate(64, 33)">
            {/* Outer radar pulse */}
            <circle cx="0" cy="-10" r="8" fill="#0fa58a" fillOpacity="0.2" className="animate-pulse" />
            
            {/* Map Pin Path */}
            <path 
              d="M0 0 C-4.5 -4.5, -7.5 -8.5, -7.5 -12.5 C-7.5 -17, -4.2 -20, 0 -20 C4.2 -20, 7.5 -17, 7.5 -12.5 C7.5 -8.5, 4.5 -4.5, 0 0 Z" 
              fill="url(#shieldGradient)"
              filter="url(#logoGlow)"
            />
            {/* Center safety dot */}
            <circle cx="0" cy="-12.5" r="2.5" fill="#ffffff" />
          </g>
        </svg>
      </div>
      <div className="flex flex-col select-none">
        <span className="font-display text-[19px] font-black tracking-tight text-slate-800 leading-none">
          SafeRoute
        </span>
        <span className="text-slate-500 font-sans font-bold text-[9px] tracking-widest uppercase mt-1">
          Bengaluru Safety Net
        </span>
      </div>
    </div>
  );
}
