// src/theme/ThemedPage.jsx
// Wraps any page in the selected theme's CSS variables and background.
// Usage: <ThemedPage themeKey="kids-unicorn"> ... </ThemedPage>
import React, { useEffect } from 'react';
import { getTheme } from './themes';
import './ThemedPage.css';

export default function ThemedPage({ themeKey, themeColor, themeMode = 'system', children }) {
  const theme = getTheme(themeKey, themeColor);

  // Determine active mode (light/dark)
  const activeMode = 'light';

  // Inject Google Fonts for heading/body
  useEffect(() => {
    const ids = ['kb-theme-font-heading', 'kb-theme-font-body'];
    const urls = [theme.fonts.headingUrl, theme.fonts.bodyUrl];

    ids.forEach((id, i) => {
      if (document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = urls[i];
      document.head.appendChild(link);
    });

    // Cleanup: remove on unmount
    return () => {
      ids.forEach(id => document.getElementById(id)?.remove());
    };
  }, [theme.fonts.headingUrl, theme.fonts.bodyUrl]);

  // Helper to compute a dark background tint based on the theme's accent color
  const getDarkBgColor = (hex) => {
    if (!hex || typeof hex !== 'string' || hex.startsWith('var') || hex.startsWith('linear')) {
      return '#121214';
    }
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    // Scale down to 8% brightness
    const factor = 0.08;
    const dr = Math.round(r * factor);
    const dg = Math.round(g * factor);
    const db = Math.round(b * factor);
    
    // Minimum dark tint
    const minR = Math.max(10, dr);
    const minG = Math.max(10, dg);
    const minB = Math.max(12, db);
    
    return `rgb(${minR}, ${minG}, ${minB})`;
  };

  const darkBgColor = getDarkBgColor(theme.selectedColorValue);

  // Build CSS variable style object using '--t-light-' prefixes
  const cssVars = {};
  Object.entries(theme.vars).forEach(([k, v]) => {
    cssVars[k.replace('--t-', '--t-light-')] = v;
  });
  cssVars['--t-dark-bg-to'] = darkBgColor;

  // SVG pattern as background
  const patternUrl = theme.patternSvg(theme.vars['--t-accent']);

  const bgStyle = {
    ...cssVars,
    background: `${patternUrl}, linear-gradient(160deg, var(--t-bg-from) 0%, var(--t-bg-to) 100%)`,
    minHeight: '100dvh',
    color: 'var(--t-text)',
  };

  return (
    <div className="tp-root" style={bgStyle} data-theme={activeMode}>
      {children}
    </div>
  );
}
