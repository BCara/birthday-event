import React, { useState } from 'react';

export default function ThemeIllustration({ theme, themeColor = 'default', className = '', usePng = true, styleOverride = {} }) {
  const [imgError, setImgError] = useState(false);
  const normTheme = theme && !theme.startsWith('kids-') ? `kids-${theme}` : theme;

  const style = {
    display: 'block',
    width: '100%',
    height: '100%',
    maxHeight: '180px',
    margin: '0 auto',
    objectFit: 'contain',
    ...styleOverride,
  };

  if (usePng && !imgError) {
    const themeNameMap = {
      'kids-generic': 'classic',
      'kids-dino': 'dino',
      'kids-unicorn': 'unicorn',
      'kids-princess': 'princess',
      'kids-cars': 'cars'
    };
    const themeName = themeNameMap[normTheme];
    
    if (themeName) {
      let colorName = themeColor || 'default';
      if (colorName === 'default') {
        if (themeName === 'dino' || themeName === 'unicorn' || themeName === 'princess') {
          colorName = 'pink';
        } else {
          colorName = 'red';
        }
      }
      
      const src = `/images/themes/${themeName}_${colorName}.png`;
      return (
        <img 
          src={src} 
          className={className} 
          style={style} 
          alt={`${themeName} ${colorName}`} 
          onError={() => setImgError(true)}
        />
      );
    }
  }

  switch (normTheme) {
    case 'kids-dino':
      return (
        <svg viewBox="0 0 200 160" className={className} style={style}>
          <defs>
            <linearGradient id="dinoBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--t-primary)" />
              <stop offset="100%" stopColor="var(--t-accent)" />
            </linearGradient>
          </defs>
          
          {/* Ground/Leaves shadow */}
          <ellipse cx="100" cy="148" rx="65" ry="8" fill="var(--t-text)" opacity="0.08" />
          <path d="M50 148 C 30 148, 20 140, 10 148" stroke="var(--t-secondary)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
          <path d="M150 148 C 170 148, 180 140, 190 148" stroke="var(--t-secondary)" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
          
          {/* Spikes on Back */}
          <path d="M62 48 L52 46 L60 58 M52 64 L42 63 L51 75 M48 82 L38 83 L47 93 M52 102 L42 107 L53 113 M63 120 L55 128 L68 128" fill="var(--t-accent-color)" stroke="var(--t-text)" strokeWidth="2.5" strokeLinejoin="round" />
          
          {/* Tail */}
          <path d="M90 115 C 60 115, 35 125, 45 100 C 50 90, 70 95, 90 100" fill="url(#dinoBodyGrad)" stroke="var(--t-text)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M38 108 L28 112 L38 116" fill="var(--t-accent-color)" stroke="var(--t-text)" strokeWidth="2.5" strokeLinejoin="round" />

          {/* Body & Neck & Head */}
          <path d="M82 135 C 75 105, 80 85, 90 75 C 90 75, 78 72, 78 52 C 78 30, 118 26, 128 35 C 138 42, 138 65, 125 72 C 112 80, 110 95, 115 135 Z" fill="url(#dinoBodyGrad)" stroke="var(--t-text)" strokeWidth="3" strokeLinejoin="round" />

          {/* Cute Belly */}
          <path d="M96 78 C 96 78, 112 85, 112 108 C 112 125, 100 133, 98 135 C 92 130, 92 90, 96 78 Z" fill="var(--t-soft-bg)" opacity="0.9" />

          {/* Spots on Back */}
          <circle cx="78" cy="95" r="4.5" fill="var(--t-secondary)" opacity="0.6" />
          <circle cx="84" cy="112" r="3.5" fill="var(--t-secondary)" opacity="0.6" />
          <circle cx="74" cy="106" r="3" fill="var(--t-secondary)" opacity="0.6" />

          {/* Back Leg */}
          <path d="M72 120 C 65 120, 60 130, 65 140 C 68 145, 78 145, 80 140 Z" fill="var(--t-accent)" stroke="var(--t-text)" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Front Leg */}
          <path d="M90 125 C 82 125, 78 135, 84 146 C 88 150, 100 150, 102 144 C 104 135, 98 125, 90 125 Z" fill="url(#dinoBodyGrad)" stroke="var(--t-text)" strokeWidth="3" strokeLinejoin="round" />
          {/* Claws */}
          <circle cx="87" cy="146" r="2" fill="#fff" />
          <circle cx="93" cy="147" r="2" fill="#fff" />
          <circle cx="99" cy="145" r="2" fill="#fff" />

          {/* Tiny Arm */}
          <path d="M120 85 C 128 85, 134 90, 130 96 C 128 99, 122 96, 118 90" fill="url(#dinoBodyGrad)" stroke="var(--t-text)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Eye */}
          <circle cx="114" cy="46" r="5" fill="var(--t-text)" />
          <circle cx="112.5" cy="44.5" r="1.5" fill="#fff" />
          
          {/* Cute Cheek Blush */}
          <circle cx="124" cy="54" r="5.5" fill="#FF8EA7" opacity="0.75" />

          {/* Smile */}
          <path d="M108 58 C 112 63, 118 63, 120 58" stroke="var(--t-text)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          
          {/* Dinosaur horn/nose detail */}
          <path d="M136 46 C 137 44, 137 40, 134 42" stroke="var(--t-text)" strokeWidth="2" fill="none" />
        </svg>
      );

    case 'kids-unicorn':
      return (
        <svg viewBox="0 0 200 160" className={className} style={style}>
          <defs>
            <linearGradient id="hornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF9A6" />
              <stop offset="100%" stopColor="var(--t-accent-color)" />
            </linearGradient>
          </defs>
          
          {/* Soft base cloud shadow */}
          <path d="M45 135 C 30 135, 20 120, 35 110 C 25 95, 50 85, 65 95 C 75 80, 105 85, 105 105 C 120 100, 135 110, 130 125 C 145 125, 145 140, 130 142 C 130 142, 50 142, 45 135 Z" fill="#F3F8FC" opacity="0.9" />
          <path d="M125 130 C 115 120, 95 120, 85 135" stroke="var(--t-border)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />

          {/* Star decorations */}
          <path d="M155 45 L157 50 L162 51 L158 54 L159 59 L155 56 L151 59 L152 54 L148 51 L153 50 Z" fill="var(--t-accent-color)" />
          <path d="M35 60 L36 63 L39 64 L37 66 L38 69 L35 67 L32 69 L33 66 L31 64 L34 63 Z" fill="var(--t-secondary)" opacity="0.7" />
          <path d="M165 95 L166 97 L169 98 L167 99 L168 102 L165 100 L162 102 L163 99 L161 98 L164 97 Z" fill="var(--t-primary)" opacity="0.5" />

          {/* Unicorn Neck & Head */}
          <path d="M85 135 L95 95 C 95 95, 80 82, 85 62 C 89 44, 112 40, 128 44 C 142 48, 146 62, 140 76 C 132 90, 118 96, 118 135 Z" fill="#FFFFFF" stroke="var(--t-border)" strokeWidth="2.5" strokeLinejoin="round" />
          
          {/* Cute Muzzle */}
          <path d="M124 45 C 128 45, 138 52, 135 65 C 132 74, 122 74, 118 70" fill="var(--t-soft-bg)" opacity="0.6" stroke="var(--t-border)" strokeWidth="1.5" />
          <circle cx="129" cy="56" r="1.5" fill="var(--t-text)" opacity="0.6" />

          {/* Ears */}
          <path d="M96 55 C 92 42, 98 32, 102 34 C 105 36, 102 46, 100 52 Z" fill="#FFFFFF" stroke="var(--t-border)" strokeWidth="2" />
          <path d="M97 50 C 95 44, 98 38, 100 39 C 102 40, 100 46, 99 49 Z" fill="var(--t-soft-bg)" />

          {/* Mane (Dynamic colors matching the variables) */}
          <path d="M86 65 C 70 65, 62 82, 75 92 C 60 92, 55 108, 72 118 C 62 118, 62 130, 85 130" fill="none" stroke="var(--t-primary)" strokeWidth="11" strokeLinecap="round" />
          <path d="M90 75 C 78 75, 72 90, 82 98 C 70 98, 66 112, 82 120" fill="none" stroke="var(--t-secondary)" strokeWidth="7" strokeLinecap="round" />
          <path d="M93 85 C 85 85, 80 96, 88 104" fill="none" stroke="var(--t-accent-color)" strokeWidth="4" strokeLinecap="round" />

          {/* Magical Horn */}
          <path d="M112 42 L118 12 L124 40 Z" fill="url(#hornGrad)" stroke="var(--t-border)" strokeWidth="2" strokeLinejoin="round" />
          <path d="M114 34 L121 31 M116 26 L121 23 M117 18 L120 16" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

          {/* Closed Sleeping Eye */}
          <path d="M112 55 Q 116 59, 120 54" stroke="var(--t-text)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M110 52 L112 55 M115 57 L116 61 M121 54 L123 51" stroke="var(--t-text)" strokeWidth="1.5" strokeLinecap="round" />

          {/* Cheek Blush */}
          <circle cx="120" cy="65" r="7" fill="var(--t-primary)" opacity="0.35" />

          {/* Smile */}
          <path d="M124 67 C 122 70, 119 69, 118 67" stroke="var(--t-text)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      );

    case 'kids-princess':
      return (
        <svg viewBox="0 0 200 160" className={className} style={style}>
          <defs>
            <linearGradient id="castleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--t-border)" />
              <stop offset="100%" stopColor="var(--t-soft-bg)" />
            </linearGradient>
          </defs>
          
          {/* Background Castle silhouette */}
          <g opacity="0.85">
            {/* Center tower */}
            <rect x="88" y="28" width="24" height="60" fill="url(#castleGrad)" />
            <polygon points="84,28 100,6 116,28" fill="var(--t-secondary)" opacity="0.8" />
            <rect x="98" y="-2" width="4" height="8" fill="var(--t-accent-color)" />
            
            {/* Left tower */}
            <rect x="62" y="48" width="18" height="40" fill="url(#castleGrad)" />
            <polygon points="59,48 71,30 83,48" fill="var(--t-secondary)" opacity="0.8" />

            {/* Right tower */}
            <rect x="120" y="48" width="18" height="40" fill="url(#castleGrad)" />
            <polygon points="117,48 129,30 141,48" fill="var(--t-secondary)" opacity="0.8" />
            
            {/* Wall */}
            <rect x="68" y="70" width="64" height="20" fill="url(#castleGrad)" />
            <rect x="74" y="64" width="8" height="8" fill="url(#castleGrad)" />
            <rect x="96" y="64" width="8" height="8" fill="url(#castleGrad)" />
            <rect x="118" y="64" width="8" height="8" fill="url(#castleGrad)" />
          </g>

          {/* Floor / Ground */}
          <ellipse cx="100" cy="144" rx="75" ry="10" fill="var(--t-text)" opacity="0.06" />

          {/* Princess in foreground */}
          <g transform="translate(10, 10)">
            {/* Hair back */}
            <circle cx="90" cy="85" r="22" fill="#5c3826" />
            <path d="M68 85 C 68 115, 112 115, 112 85" fill="#5c3826" />

            {/* Gown Skirt */}
            <path d="M62 135 C 62 110, 80 100, 90 100 C 100 100, 118 110, 118 135 Z" fill="var(--t-primary)" stroke="var(--t-text)" strokeWidth="2.5" strokeLinejoin="round" />
            
            {/* Gown Overlay/Details */}
            <path d="M72 135 C 75 120, 85 110, 90 110 C 95 110, 105 120, 108 135" fill="var(--t-soft-bg)" stroke="var(--t-text)" strokeWidth="1.5" />
            <path d="M66 126 C 72 122, 108 122, 114 126" stroke="var(--t-secondary)" strokeWidth="2.5" fill="none" opacity="0.8" />

            {/* Arms */}
            <circle cx="70" cy="106" r="5" fill="#FFDFD3" stroke="var(--t-text)" strokeWidth="2" />
            <circle cx="110" cy="106" r="5" fill="#FFDFD3" stroke="var(--t-text)" strokeWidth="2" />

            {/* Bodice */}
            <path d="M80 94 L100 94 L96 104 L84 104 Z" fill="var(--t-secondary)" stroke="var(--t-text)" strokeWidth="2.5" strokeLinejoin="round" />
            
            {/* Head & Neck */}
            <rect x="86" y="86" width="8" height="10" fill="#FFDFD3" />
            <circle cx="90" cy="80" r="14" fill="#FFDFD3" stroke="var(--t-text)" strokeWidth="2.5" />

            {/* Hair Front / Bangs */}
            <path d="M76 80 C 76 68, 104 68, 104 80 C 104 74, 98 72, 90 74 C 82 72, 76 74, 76 80 Z" fill="#5c3826" />
            <path d="M73 80 C 70 85, 72 95, 75 95" stroke="#5c3826" strokeWidth="4" strokeLinecap="round" />
            <path d="M107 80 C 110 85, 108 95, 105 95" stroke="#5c3826" strokeWidth="4" strokeLinecap="round" />

            {/* Crown / Tiara */}
            <path d="M82 68 L85 62 L90 66 L95 62 L98 68 Z" fill="var(--t-accent-color)" stroke="var(--t-text)" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="90" cy="61" r="2" fill="var(--t-primary)" />
            <circle cx="85" cy="61" r="1.5" fill="var(--t-secondary)" />
            <circle cx="95" cy="61" r="1.5" fill="var(--t-secondary)" />

            {/* Face Details */}
            <circle cx="84" cy="79" r="1.5" fill="var(--t-text)" />
            <circle cx="96" cy="79" r="1.5" fill="var(--t-text)" />
            <path d="M88 84 Q 90 87, 92 84" stroke="var(--t-text)" strokeWidth="2" strokeLinecap="round" fill="none" />
            <circle cx="81" cy="82" r="2.5" fill="#FF8EA7" opacity="0.6" />
            <circle cx="99" cy="82" r="2.5" fill="#FF8EA7" opacity="0.6" />
          </g>
          
          {/* Sparkles */}
          <path d="M150 110 L152 113 L155 114 L152 115 L150 118 L148 115 L145 114 L148 113 Z" fill="var(--t-accent-color)" />
          <path d="M40 90 L41 92 L43 93 L41 94 L40 96 L39 94 L37 93 L39 92 Z" fill="var(--t-accent-color)" />
        </svg>
      );

    case 'kids-cars':
      return (
        <svg viewBox="0 0 200 160" className={className} style={style}>
          {/* Crossed racing flags behind */}
          <g stroke="var(--t-text)" strokeWidth="2" strokeLinecap="round">
            {/* Flag 1 Staff */}
            <line x1="60" y1="110" x2="140" y2="40" />
            {/* Flag 1 Canvas */}
            <path d="M110 65 L135 44 L125 32 L100 52 Z" fill="#FFFFFF" stroke="var(--t-text)" strokeWidth="2" strokeLinejoin="round" />
            <path d="M110 65 L122 55 L117 48 L105 58 Z" fill="var(--t-text)" />
            <path d="M122 55 L135 44 L130 38 L117 48 Z" fill="var(--t-text)" opacity="0.15" />

            {/* Flag 2 Staff */}
            <line x1="140" y1="110" x2="60" y2="40" />
            {/* Flag 2 Canvas */}
            <path d="M90 65 L65 44 L75 32 L100 52 Z" fill="#FFFFFF" stroke="var(--t-text)" strokeWidth="2" strokeLinejoin="round" />
            <path d="M90 65 L78 55 L83 48 L95 58 Z" fill="var(--t-text)" />
            <path d="M78 55 L65 44 L70 38 L83 48 Z" fill="var(--t-text)" opacity="0.15" />
          </g>

          {/* Road shadow */}
          <ellipse cx="100" cy="130" rx="70" ry="12" fill="var(--t-text)" opacity="0.12" />
          <path d="M40 130 L160 130" stroke="var(--t-secondary)" strokeWidth="4" strokeDasharray="6,6" opacity="0.5" />

          {/* Racing Car */}
          <g transform="translate(0, 10)">
            {/* Spoiler */}
            <path d="M40 85 L35 70 L48 70 L52 85 Z" fill="var(--t-secondary)" stroke="var(--t-text)" strokeWidth="2" />
            <path d="M30 70 L55 70 L55 64 L30 64 Z" fill="var(--t-primary)" stroke="var(--t-text)" strokeWidth="2" strokeLinejoin="round" />

            {/* Wheels Back/Under */}
            <circle cx="65" cy="115" r="16" fill="#333333" stroke="var(--t-text)" strokeWidth="2.5" />
            <circle cx="65" cy="115" r="7" fill="#E0E0E0" stroke="var(--t-text)" strokeWidth="1.5" />
            <circle cx="135" cy="115" r="16" fill="#333333" stroke="var(--t-text)" strokeWidth="2.5" />
            <circle cx="135" cy="115" r="7" fill="#E0E0E0" stroke="var(--t-text)" strokeWidth="1.5" />

            {/* Car Main Body */}
            <path d="M42 110 C 42 98, 55 92, 70 92 L130 92 C 145 92, 162 98, 162 112 C 162 118, 150 120, 100 120 C 50 120, 42 118, 42 110 Z" fill="var(--t-primary)" stroke="var(--t-text)" strokeWidth="3" strokeLinejoin="round" />
            
            {/* Racing Stripe */}
            <path d="M80 92 L96 92 L100 120 L84 120 Z" fill="var(--t-accent-color)" opacity="0.9" />

            {/* Windshield / Cabin */}
            <path d="M78 92 C 82 76, 118 76, 122 92 Z" fill="#E0F7FA" stroke="var(--t-text)" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M110 78 C 114 82, 116 88, 118 92" stroke="var(--t-text)" strokeWidth="1.5" fill="none" opacity="0.3" />

            {/* Front Headlight */}
            <ellipse cx="152" cy="104" rx="6" ry="4" fill="#FFF9A6" stroke="var(--t-text)" strokeWidth="2" />
            
            {/* Number 3 decal (matching Robins 3rd Birthday) */}
            <circle cx="110" cy="106" r="10" fill="#FFFFFF" stroke="var(--t-text)" strokeWidth="1.5" />
            <text x="110" y="110" fontFamily="sans-serif" fontWeight="900" fontSize="12" fill="var(--t-text)" textAnchor="middle">3</text>
          </g>
        </svg>
      );

    case 'kids-generic':
    default:
      return (
        <svg viewBox="0 0 200 160" className={className} style={style}>
          {/* Confetti / Sparkles background */}
          <circle cx="35" cy="50" r="3" fill="var(--t-secondary)" opacity="0.6" />
          <circle cx="165" cy="40" r="4" fill="var(--t-accent-color)" opacity="0.7" />
          <circle cx="50" cy="110" r="2.5" fill="var(--t-primary)" opacity="0.5" />
          <circle cx="155" cy="115" r="3.5" fill="var(--t-secondary)" opacity="0.6" />
          <path d="M95 20 L98 25 L93 27 Z" fill="var(--t-secondary)" opacity="0.5" />
          <path d="M130 90 L135 92 L131 96 Z" fill="var(--t-accent-color)" opacity="0.6" />

          {/* Balloon Strings */}
          <g stroke="#9E9E9E" strokeWidth="2" fill="none" strokeLinecap="round">
            {/* Left Balloon String */}
            <path d="M72 88 Q 80 115, 100 142" />
            {/* Right Balloon String */}
            <path d="M128 88 Q 120 115, 100 142" />
            {/* Center Balloon String */}
            <path d="M100 78 L 100 142" />
          </g>

          {/* String Tie Bow */}
          <ellipse cx="100" cy="142" rx="4" ry="2.5" fill="var(--t-primary)" />
          <path d="M96 142 C 92 138, 92 146, 100 142 C 108 146, 108 138, 100 142" fill="var(--t-primary)" />

          {/* Balloon 2 (Left, Secondary Color) */}
          <g transform="translate(-5, -5)">
            <ellipse cx="77" cy="62" rx="22" ry="26" fill="var(--t-secondary)" stroke="var(--t-text)" strokeWidth="2.5" />
            {/* Highlight */}
            <path d="M64 50 A 12 15 0 0 1 76 43" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
            {/* Knot */}
            <polygon points="77,88 73,93 81,93" fill="var(--t-secondary)" stroke="var(--t-text)" strokeWidth="2" strokeLinejoin="round" />
          </g>

          {/* Balloon 3 (Right, Accent Color) */}
          <g transform="translate(5, -5)">
            <ellipse cx="123" cy="62" rx="22" ry="26" fill="var(--t-accent-color)" stroke="var(--t-text)" strokeWidth="2.5" />
            {/* Highlight */}
            <path d="M110 50 A 12 15 0 0 1 122 43" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" opacity="0.65" />
            {/* Knot */}
            <polygon points="123,88 119,93 127,93" fill="var(--t-accent-color)" stroke="var(--t-text)" strokeWidth="2" strokeLinejoin="round" />
          </g>

          {/* Balloon 1 (Center Front, Primary Color) */}
          <g>
            <ellipse cx="100" cy="50" rx="24" ry="29" fill="var(--t-primary)" stroke="var(--t-text)" strokeWidth="3" />
            {/* Highlight */}
            <path d="M87 37 A 14 17 0 0 1 100 29" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
            {/* Knot */}
            <polygon points="100,79 95,85 105,85" fill="var(--t-primary)" stroke="var(--t-text)" strokeWidth="2.5" strokeLinejoin="round" />
          </g>
        </svg>
      );
  }
}
