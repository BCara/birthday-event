import React from 'react';
import ThemeIllustration from '../theme/ThemeIllustration';
import { getTheme } from '../theme/themes';

export default function OgImageTemplate({ 
  themeKey, 
  themeColor, 
  name, 
  childName, 
  date, 
  time, 
  endTime, 
  location, 
  address 
}) {
  const normalizedThemeKey = themeKey && !themeKey.startsWith('kids-') ? `kids-${themeKey}` : (themeKey || 'kids-generic');
  const themeData = getTheme(normalizedThemeKey, themeColor || 'default');
  
  const cssVars = Object.fromEntries(
    Object.entries(themeData.vars).map(([k, v]) => [k, v])
  );
  const patternUrl = themeData.patternSvg(themeData.vars['--t-accent']);

  const formattedDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  }) : 'Date TBD';

  const formatTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    return `${hour % 12 || 12}:${m}${hour >= 12 ? 'pm' : 'am'}`;
  };

  const tStart = formatTime(time) || 'Time TBD';
  const tEnd = formatTime(endTime);
  const timeString = tEnd ? `${tStart} – ${tEnd}` : tStart;
  
  const childNameStr = childName ? `${childName}${childName.toLowerCase().endsWith('s') || childName.includes("'") ? "" : "'s"}` : "";
  const titleStr = childNameStr ? `${childNameStr} ${name || 'Birthday Party'}` : (name || 'Birthday Party');

  return (
    <div 
      className="og-image-template tp-root"
      style={{
        ...cssVars,
        width: '1200px',
        height: '630px',
        background: `linear-gradient(165deg, var(--t-bg-from) 0%, var(--t-bg-to) 100%)`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '60px',
        boxSizing: 'border-box',
        fontFamily: 'var(--t-font-heading), sans-serif',
        overflow: 'hidden',
        color: 'var(--t-text)'
      }}
    >
      {/* Background Pattern */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: patternUrl, backgroundSize: '150px 150px', opacity: 0.8, zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '50px', alignItems: 'center' }}>
        
        {/* Left Side: Illustration */}
        <div style={{ flex: '0 0 450px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <ThemeIllustration 
             theme={normalizedThemeKey} 
             themeColor={themeColor || 'default'} 
             styleOverride={{ width: '400px', height: '400px', maxHeight: 'none' }} 
             usePng={false}
           />
        </div>

        {/* Right Side: Text Details */}
        <div style={{ flex: 1, paddingLeft: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          <div style={{ fontSize: '30px', fontWeight: 700, color: 'var(--t-accent)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '15px' }}>
            You're Invited!
          </div>
          
          <h1 style={{ fontSize: '75px', fontWeight: 800, margin: '0 0 40px 0', lineHeight: 1.1, color: 'var(--t-text)' }}>
            {titleStr}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: 'var(--t-font-body), sans-serif', fontSize: '38px', fontWeight: 600, color: 'var(--t-text-light)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '45px' }}>📅</span>
              <span>{formattedDate}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '45px' }}>🕒</span>
              <span>{timeString}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <span style={{ fontSize: '45px' }}>📍</span>
              <span style={{ maxWidth: '500px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {location ? location : (address ? address : 'Location TBD')}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
