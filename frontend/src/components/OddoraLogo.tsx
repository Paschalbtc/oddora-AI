import React from "react";
import Link from "next/link";

export interface OddoraLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showBadge?: boolean;
  showText?: boolean;
  href?: string;
  className?: string;
}

export const OddoraLogo: React.FC<OddoraLogoProps> = ({
  size = "md",
  showBadge = true,
  showText = true,
  href = "/",
  className = "",
}) => {
  // Dimension tokens
  const dimensions = {
    sm: { svgSize: 28, text: "text-lg", badge: "text-[9px] px-1 py-0.2" },
    md: { svgSize: 36, text: "text-xl", badge: "text-[10px] px-1.5 py-0.5" },
    lg: { svgSize: 44, text: "text-2xl", badge: "text-xs px-2 py-0.5" },
    xl: { svgSize: 56, text: "text-3xl", badge: "text-xs px-2.5 py-1" },
  }[size];

  const logoGraphic = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Hexagonal Neural Football + Rising Chart Arrow SVG */}
      <div className="relative flex-shrink-0 group">
        <svg
          width={dimensions.svgSize}
          height={dimensions.svgSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            {/* Emerald to Gold Primary Gradient */}
            <linearGradient id="oddoraHexStroke" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>

            {/* Rising Arrow Gradient */}
            <linearGradient id="oddoraArrowGrad" x1="10" y1="38" x2="38" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#6EE7B7" />
            </linearGradient>

            {/* Neural Hexagon Inner Fill */}
            <linearGradient id="oddoraInnerBg" x1="24" y1="6" x2="24" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0B132B" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#060913" stopOpacity="0.95" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#10B981" floodOpacity="0.6" />
            </filter>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#F59E0B" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* Hexagonal Outer Frame */}
          <polygon
            points="24,5 40,14.5 40,33.5 24,43 8,33.5 8,14.5"
            fill="url(#oddoraInnerBg)"
            stroke="url(#oddoraHexStroke)"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Neural Football Panel Nodes & Geometric Seams */}
          {/* Central Neural Football Pentagon */}
          <polygon
            points="24,16 30,21 28,28 20,28 18,21"
            fill="#0F172A"
            stroke="#10B981"
            strokeWidth="1.2"
            strokeOpacity="0.8"
          />

          {/* Neural Network Interconnect Lines to Hexagon Vertices */}
          <line x1="24" y1="16" x2="24" y2="5.5" stroke="#10B981" strokeWidth="1" strokeDasharray="1.5 1.5" strokeOpacity="0.7" />
          <line x1="30" y1="21" x2="39.5" y2="15" stroke="#34D399" strokeWidth="1" strokeOpacity="0.6" />
          <line x1="28" y1="28" x2="39.5" y2="33" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.6" />
          <line x1="20" y1="28" x2="8.5" y2="33" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.6" />
          <line x1="18" y1="21" x2="8.5" y2="15" stroke="#10B981" strokeWidth="1" strokeOpacity="0.6" />

          {/* Neural Synapse Nodes (Glowing Points) */}
          <circle cx="24" cy="16" r="1.8" fill="#10B981" filter="url(#emeraldGlow)" />
          <circle cx="30" cy="21" r="1.8" fill="#34D399" />
          <circle cx="28" cy="28" r="1.8" fill="#F59E0B" filter="url(#goldGlow)" />
          <circle cx="20" cy="28" r="1.8" fill="#F59E0B" filter="url(#goldGlow)" />
          <circle cx="18" cy="21" r="1.8" fill="#10B981" />

          {/* Rising Quantitative Chart Trendline & Arrow */}
          <path
            d="M 12 33 L 20 27 L 27 30 L 37 13"
            stroke="url(#oddoraArrowGrad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#emeraldGlow)"
          />
          {/* Arrowhead */}
          <polygon
            points="37,13 32,14.5 35.5,18"
            fill="#6EE7B7"
          />
        </svg>

        {/* Ambient Glow Aura */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Typography: ODDORA AI + BETA Badge */}
      {showText && (
        <div className="flex items-center gap-2">
          <div className={`font-black ${dimensions.text} tracking-tight leading-none text-white`}>
            <span>ODDORA</span>
            <span className="ml-1 bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#F59E0B] bg-clip-text text-transparent font-extrabold drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              AI
            </span>
          </div>

          {showBadge && (
            <span
              className={`inline-flex items-center gap-1 font-mono font-semibold tracking-wider uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.15)] ${dimensions.badge}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              BETA v1.0
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg">
        {logoGraphic}
      </Link>
    );
  }

  return logoGraphic;
};

export default OddoraLogo;

