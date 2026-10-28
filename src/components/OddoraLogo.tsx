import React from "react";

export interface OddoraLogoProps {
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  className?: string;
}

export const OddoraLogo: React.FC<OddoraLogoProps> = ({
  size = "md",
  showBadge = true,
  className = "",
}) => {
  const dimensions = {
    sm: { svg: 26, text: "text-lg", badge: "text-[9px] px-1.5 py-0.2" },
    md: { svg: 34, text: "text-xl", badge: "text-[10px] px-2 py-0.5" },
    lg: { svg: 42, text: "text-2xl", badge: "text-xs px-2.5 py-0.5" },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Hexagonal Neural Football + Rising Quantum Vector SVG */}
      <div className="relative shrink-0 group">
        <svg
          width={dimensions.svg}
          height={dimensions.svg}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="oddoraGrad1" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="60%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="oddoraGrad2" x1="12" y1="36" x2="36" y2="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Outer Hexagon */}
          <path
            d="M24 3L42 13.4V34.6L24 45L6 34.6V13.4L24 3Z"
            stroke="url(#oddoraGrad1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="filter drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]"
          />

          {/* Inner Neural Nodes */}
          <circle cx="24" cy="24" r="3" fill="#10B981" />
          <path
            d="M15 24L24 15L33 24L24 33L15 24Z"
            stroke="url(#oddoraGrad2)"
            strokeWidth="1.8"
            strokeDasharray="2 2"
          />

          {/* Rising Arrow Vector */}
          <path
            d="M17 31L24 24L31 17M31 17H24M31 17V24"
            stroke="#F59E0B"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex items-center gap-1.5">
        <span className={`font-black tracking-tight text-white ${dimensions.text}`}>
          ODDORA <span className="text-emerald-400">AI</span>
        </span>
        {showBadge && (
          <span
            className={`font-mono font-black uppercase rounded-full bg-gradient-to-r from-emerald-500/20 to-amber-500/20 text-emerald-400 border border-emerald-500/30 ${dimensions.badge}`}
          >
            V2
          </span>
        )}
      </div>
    </div>
  );
};

export default OddoraLogo;

