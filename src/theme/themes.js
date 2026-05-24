// src/theme/themes.js
// KidsBash theme definitions — 5 kids birthday themes with 4 curated color variations each.
// Each theme provides CSS variables injected via ThemeProvider.

export const THEMES = {
  'kids-generic': {
    label: 'Classic Balloons',
    emoji: '🎈',
    fonts: {
      heading: 'Fredoka',
      body: 'Quicksand',
      headingUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap',
      bodyUrl: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap',
    },
    vars: {
      '--t-card-bg':    'rgba(255,255,255,0.65)',
      '--t-card-border':'rgba(255,255,255,0.8)',
      '--t-btn-text':   '#fff',
      '--t-font-heading': "'Fredoka', sans-serif",
      '--t-font-body':    "'Quicksand', sans-serif",
    },
    patternSvg: (color) => `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='3' fill='${encodeURIComponent(color)}' opacity='0.15'/%3E%3Ccircle cx='65' cy='15' r='2' fill='${encodeURIComponent(color)}' opacity='0.12'/%3E%3Ccircle cx='40' cy='65' r='2.5' fill='${encodeURIComponent(color)}' opacity='0.15'/%3E%3Ccircle cx='65' cy='65' r='3.5' fill='${encodeURIComponent(color)}' opacity='0.1'/%3E%3Cpath d='M25 45 L26 48 L29 49 L26 50 L25 53 L24 50 L21 49 L24 48 Z' fill='${encodeURIComponent(color)}' opacity='0.15'/%3E%3C/svg%3E")`,
  },

  'kids-dino': {
    label: 'Dino Adventure',
    emoji: '🦕',
    fonts: {
      heading: 'Fredoka',
      body: 'Outfit',
      headingUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap',
      bodyUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap',
    },
    vars: {
      '--t-card-bg':    'rgba(255,255,255,0.65)',
      '--t-card-border':'rgba(255,255,255,0.8)',
      '--t-btn-text':   '#fff',
      '--t-font-heading': "'Fredoka', sans-serif",
      '--t-font-body':    "'Outfit', sans-serif",
    },
    patternSvg: (color) => `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='20' cy='70' rx='6' ry='3' fill='${encodeURIComponent(color)}' opacity='0.15' transform='rotate(-15 20 70)'/%3E%3Cellipse cx='60' cy='20' rx='5' ry='2.5' fill='${encodeURIComponent(color)}' opacity='0.12' transform='rotate(20 60 20)'/%3E%3Ccircle cx='40' cy='40' r='2.5' fill='${encodeURIComponent(color)}' opacity='0.1'/%3E%3Ccircle cx='70' cy='50' r='1.5' fill='${encodeURIComponent(color)}' opacity='0.1'/%3E%3C/svg%3E")`,
  },

  'kids-unicorn': {
    label: 'Unicorn Magic',
    emoji: '🦄',
    fonts: {
      heading: 'Fredoka',
      body: 'Quicksand',
      headingUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap',
      bodyUrl: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap',
    },
    vars: {
      '--t-card-bg':    'rgba(255,255,255,0.65)',
      '--t-card-border':'rgba(255,255,255,0.8)',
      '--t-btn-text':   '#fff',
      '--t-font-heading': "'Fredoka', sans-serif",
      '--t-font-body':    "'Quicksand', sans-serif",
    },
    patternSvg: (color) => `url("data:image/svg+xml,%3Csvg width='70' height='70' viewBox='0 0 70 70' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M35 5 L36.2 11 L42 12 L36.2 13 L35 19 L33.8 13 L28 12 L33.8 11 Z' fill='${encodeURIComponent(color)}' opacity='0.15'/%3E%3Ccircle cx='55' cy='45' r='2' fill='${encodeURIComponent(color)}' opacity='0.12'/%3E%3Ccircle cx='15' cy='45' r='1.5' fill='${encodeURIComponent(color)}' opacity='0.12'/%3E%3Cpath d='M50 20 C 53 18, 57 22, 54 25 C 57 28, 50 32, 48 27' fill='none' stroke='${encodeURIComponent(color)}' stroke-width='1.5' opacity='0.15'/%3E%3C/svg%3E")`,
  },

  'kids-princess': {
    label: 'Royal Princess',
    emoji: '👑',
    fonts: {
      heading: 'Fredoka',
      body: 'Quicksand',
      headingUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap',
      bodyUrl: 'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap',
    },
    vars: {
      '--t-card-bg':    'rgba(255,255,255,0.65)',
      '--t-card-border':'rgba(255,255,255,0.8)',
      '--t-btn-text':   '#fff',
      '--t-font-heading': "'Fredoka', sans-serif",
      '--t-font-body':    "'Quicksand', sans-serif",
    },
    patternSvg: (color) => `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 10 L43 20 L53 20 L45 26 L48 36 L40 30 L32 36 L35 26 L27 20 L37 20 Z' fill='${encodeURIComponent(color)}' opacity='0.1'/%3E%3Ccircle cx='15' cy='60' r='2' fill='${encodeURIComponent(color)}' opacity='0.12'/%3E%3Ccircle cx='65' cy='60' r='2' fill='${encodeURIComponent(color)}' opacity='0.12'/%3E%3C/svg%3E")`,
  },

  'kids-cars': {
    label: 'Racing Cars',
    emoji: '🏎️',
    fonts: {
      heading: 'Fredoka',
      body: 'Outfit',
      headingUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap',
      bodyUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap',
    },
    vars: {
      '--t-card-bg':    'rgba(255,255,255,0.65)',
      '--t-card-border':'rgba(255,255,255,0.8)',
      '--t-btn-text':   '#fff',
      '--t-font-heading': "'Fredoka', sans-serif",
      '--t-font-body':    "'Outfit', sans-serif",
    },
    patternSvg: (color) => `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='12' height='12' fill='${encodeURIComponent(color)}' opacity='0.08'/%3E%3Crect x='12' y='12' width='12' height='12' fill='${encodeURIComponent(color)}' opacity='0.08'/%3E%3C/svg%3E")`,
  },
};

export const THEME_COLOR_SCHEMES = {
  'kids-generic': {
    default: {
      label: 'Classic Red',
      color: '#E53935',
      vars: {
        '--t-bg-from':    '#FFF5F5',
        '--t-bg-to':      '#FFD8D8',
        '--t-accent':     '#D32F2F',
        '--t-primary':    '#D32F2F',
        '--t-secondary':  '#1E88E5',
        '--t-accent-color':'#FDD835',
        '--t-soft-bg':    '#FFEAEA',
        '--t-border':     '#FFCDD2',
        '--t-text':       '#4A0E0E',
        '--t-text-light': '#7F2727',
        '--t-btn-bg':     '#D32F2F',
      }
    },
    blue: {
      label: 'Sky Blue',
      color: '#1E88E5',
      vars: {
        '--t-bg-from':    '#F0F8FF',
        '--t-bg-to':      '#C6E2FF',
        '--t-accent':     '#1565C0',
        '--t-primary':    '#1565C0',
        '--t-secondary':  '#4CAF50',
        '--t-accent-color':'#FFEB3B',
        '--t-soft-bg':    '#E3F2FD',
        '--t-border':     '#BBDEFB',
        '--t-text':       '#0B2F61',
        '--t-text-light': '#1C549C',
        '--t-btn-bg':     '#1565C0',
      }
    },
    green: {
      label: 'Mint Green',
      color: '#4CAF50',
      vars: {
        '--t-bg-from':    '#F1FBF2',
        '--t-bg-to':      '#C8E6C9',
        '--t-accent':     '#2E7D32',
        '--t-primary':    '#2E7D32',
        '--t-secondary':  '#FBC02D',
        '--t-accent-color':'#2196F3',
        '--t-soft-bg':    '#E8F5E9',
        '--t-border':     '#C8E6C9',
        '--t-text':       '#0E3A11',
        '--t-text-light': '#226027',
        '--t-btn-bg':     '#2E7D32',
      }
    },
    purple: {
      label: 'Sweet Purple',
      color: '#8E24AA',
      vars: {
        '--t-bg-from':    '#FAF0FC',
        '--t-bg-to':      '#E8C5F2',
        '--t-accent':     '#6D1B7B',
        '--t-primary':    '#6D1B7B',
        '--t-secondary':  '#EC407A',
        '--t-accent-color':'#2196F3',
        '--t-soft-bg':    '#F3E5F5',
        '--t-border':     '#E1BEE7',
        '--t-text':       '#30073B',
        '--t-text-light': '#541566',
        '--t-btn-bg':     '#6D1B7B',
      }
    }
  },

  'kids-dino': {
    default: {
      label: 'Sweet Pink',
      color: '#FF6B8B',
      vars: {
        '--t-bg-from':    '#FFF0F3',
        '--t-bg-to':      '#FFD3E1',
        '--t-accent':     '#FF5E84',
        '--t-primary':    '#FF5E84',
        '--t-secondary':  '#C77DFF',
        '--t-accent-color':'#FFD166',
        '--t-soft-bg':    '#FFE5EC',
        '--t-border':     '#FFC2D1',
        '--t-text':       '#5C0620',
        '--t-text-light': '#8F1E42',
        '--t-btn-bg':     '#FF5E84',
      }
    },
    green: {
      label: 'Jungle Green',
      color: '#4CAF50',
      vars: {
        '--t-bg-from':    '#E8F5E9',
        '--t-bg-to':      '#C8E6C9',
        '--t-accent':     '#2E7D32',
        '--t-primary':    '#2E7D32',
        '--t-secondary':  '#81C784',
        '--t-accent-color':'#FFD166',
        '--t-soft-bg':    '#C8E6C9',
        '--t-border':     '#A5D6A7',
        '--t-text':       '#1B5E20',
        '--t-text-light': '#2E7D32',
        '--t-btn-bg':     '#2E7D32',
      }
    },
    blue: {
      label: 'Ocean Blue',
      color: '#2196F3',
      vars: {
        '--t-bg-from':    '#E3F2FD',
        '--t-bg-to':      '#BBDEFB',
        '--t-accent':     '#1976D2',
        '--t-primary':    '#1976D2',
        '--t-secondary':  '#64B5F6',
        '--t-accent-color':'#FFD166',
        '--t-soft-bg':    '#BBDEFB',
        '--t-border':     '#90CAF9',
        '--t-text':       '#0D47A1',
        '--t-text-light': '#1565C0',
        '--t-btn-bg':     '#1976D2',
      }
    },
    orange: {
      label: 'Volcano Orange',
      color: '#FF9800',
      vars: {
        '--t-bg-from':    '#FFF3E0',
        '--t-bg-to':      '#FFE0B2',
        '--t-accent':     '#F57C00',
        '--t-primary':    '#F57C00',
        '--t-secondary':  '#FFB74D',
        '--t-accent-color':'#FF8A80',
        '--t-soft-bg':    '#FFE0B2',
        '--t-border':     '#FFE082',
        '--t-text':       '#E65100',
        '--t-text-light': '#F57C00',
        '--t-btn-bg':     '#F57C00',
      }
    }
  },

  'kids-unicorn': {
    default: {
      label: 'Sweet Pink',
      color: '#FF758F',
      vars: {
        '--t-bg-from':    '#FFF0F5',
        '--t-bg-to':      '#FCE4EC',
        '--t-accent':     '#FF4D6D',
        '--t-primary':    '#FF4D6D',
        '--t-secondary':  '#CE93D8',
        '--t-accent-color':'#81D4FA',
        '--t-soft-bg':    '#FFD3E1',
        '--t-border':     '#FF8FAB',
        '--t-text':       '#4A0E17',
        '--t-text-light': '#800F2F',
        '--t-btn-bg':     'linear-gradient(135deg, #FF4D6D, #CE93D8)',
      }
    },
    purple: {
      label: 'Magic Purple',
      color: '#9C27B0',
      vars: {
        '--t-bg-from':    '#F3E5F5',
        '--t-bg-to':      '#E1BEE7',
        '--t-accent':     '#7B1FA2',
        '--t-primary':    '#7B1FA2',
        '--t-secondary':  '#BA68C8',
        '--t-accent-color':'#F8BBD0',
        '--t-soft-bg':    '#E1BEE7',
        '--t-border':     '#CE93D8',
        '--t-text':       '#4A148C',
        '--t-text-light': '#7B1FA2',
        '--t-btn-bg':     'linear-gradient(135deg, #7B1FA2, #E1BEE7)',
      }
    },
    teal: {
      label: 'Teal Dream',
      color: '#00BFA5',
      vars: {
        '--t-bg-from':    '#E0F2F1',
        '--t-bg-to':      '#B2DFDB',
        '--t-accent':     '#00796B',
        '--t-primary':    '#00796B',
        '--t-secondary':  '#4DB6AC',
        '--t-accent-color':'#B2EBF2',
        '--t-soft-bg':    '#B2DFDB',
        '--t-border':     '#80DEEA',
        '--t-text':       '#004D40',
        '--t-text-light': '#00796B',
        '--t-btn-bg':     'linear-gradient(135deg, #00796B, #80DEEA)',
      }
    },
    yellow: {
      label: 'Sunset Yellow',
      color: '#FFD54F',
      vars: {
        '--t-bg-from':    '#FFFDE7',
        '--t-bg-to':      '#FFF59D',
        '--t-accent':     '#F57F17',
        '--t-primary':    '#F57F17',
        '--t-secondary':  '#FFD54F',
        '--t-accent-color':'#FFAB91',
        '--t-soft-bg':    '#FFF59D',
        '--t-border':     '#FFE082',
        '--t-text':       '#5D4037',
        '--t-text-light': '#F57F17',
        '--t-btn-bg':     'linear-gradient(135deg, #F57F17, #FFD54F)',
      }
    }
  },

  'kids-princess': {
    default: {
      label: 'Royal Pink',
      color: '#EC407A',
      vars: {
        '--t-bg-from':    '#FFF0F5',
        '--t-bg-to':      '#F8BBD0',
        '--t-accent':     '#D81B60',
        '--t-primary':    '#D81B60',
        '--t-secondary':  '#FF85A2',
        '--t-accent-color':'#FFD700',
        '--t-soft-bg':    '#F8BBD0',
        '--t-border':     '#F48FB1',
        '--t-text':       '#4A0E2E',
        '--t-text-light': '#880E4F',
        '--t-btn-bg':     '#D81B60',
      }
    },
    teal: {
      label: 'Emerald Tiara',
      color: '#26A69A',
      vars: {
        '--t-bg-from':    '#E0F2F1',
        '--t-bg-to':      '#80DEEA',
        '--t-accent':     '#00695C',
        '--t-primary':    '#00695C',
        '--t-secondary':  '#4DB6AC',
        '--t-accent-color':'#FFE082',
        '--t-soft-bg':    '#B2DFDB',
        '--t-border':     '#80DEEA',
        '--t-text':       '#004D40',
        '--t-text-light': '#00695C',
        '--t-btn-bg':     '#00695C',
      }
    },
    yellow: {
      label: 'Golden Tiara',
      color: '#FFCA28',
      vars: {
        '--t-bg-from':    '#FFFDF0',
        '--t-bg-to':      '#FFE082',
        '--t-accent':     '#F57F17',
        '--t-primary':    '#F57F17',
        '--t-secondary':  '#FFD54F',
        '--t-accent-color':'#F48FB1',
        '--t-soft-bg':    '#FFE082',
        '--t-border':     '#FFE082',
        '--t-text':       '#5D4037',
        '--t-text-light': '#E65100',
        '--t-btn-bg':     '#F57F17',
      }
    },
    purple: {
      label: 'Lilac Tiara',
      color: '#AB47BC',
      vars: {
        '--t-bg-from':    '#F3E5F5',
        '--t-bg-to':      '#D1C4E9',
        '--t-accent':     '#6A1B9A',
        '--t-primary':    '#6A1B9A',
        '--t-secondary':  '#AB47BC',
        '--t-accent-color':'#FFE082',
        '--t-soft-bg':    '#D1C4E9',
        '--t-border':     '#B39DDB',
        '--t-text':       '#311B92',
        '--t-text-light': '#4A148C',
        '--t-btn-bg':     '#6A1B9A',
      }
    }
  },

  'kids-cars': {
    default: {
      label: 'Racing Red',
      color: '#E53935',
      vars: {
        '--t-bg-from':    '#ECEFF1',
        '--t-bg-to':      '#CFD8DC',
        '--t-accent':     '#D32F2F',
        '--t-primary':    '#D32F2F',
        '--t-secondary':  '#E53935',
        '--t-accent-color':'#FFD600',
        '--t-soft-bg':    '#FFEBEE',
        '--t-border':     '#FFCDD2',
        '--t-text':       '#1A1A1A',
        '--t-text-light': '#455A64',
        '--t-btn-bg':     '#D32F2F',
      }
    },
    blue: {
      label: 'Nitro Blue',
      color: '#1E88E5',
      vars: {
        '--t-bg-from':    '#ECEFF1',
        '--t-bg-to':      '#B0BEC5',
        '--t-accent':     '#1565C0',
        '--t-primary':    '#1565C0',
        '--t-secondary':  '#1E88E5',
        '--t-accent-color':'#00E5FF',
        '--t-soft-bg':    '#E3F2FD',
        '--t-border':     '#BBDEFB',
        '--t-text':       '#0D47A1',
        '--t-text-light': '#37474F',
        '--t-btn-bg':     '#1565C0',
      }
    },
    yellow: {
      label: 'Volt Yellow',
      color: '#FBC02D',
      vars: {
        '--t-bg-from':    '#ECEFF1',
        '--t-bg-to':      '#CFD8DC',
        '--t-accent':     '#F57F17',
        '--t-primary':    '#F57F17',
        '--t-secondary':  '#FBC02D',
        '--t-accent-color':'#212121',
        '--t-soft-bg':    '#FFFDE7',
        '--t-border':     '#FFF59D',
        '--t-text':       '#212121',
        '--t-text-light': '#5D4037',
        '--t-btn-bg':     '#F57F17',
      }
    },
    grey: {
      label: 'Midnight Grey',
      color: '#757575',
      vars: {
        '--t-bg-from':    '#F5F5F5',
        '--t-bg-to':      '#BDBDBD',
        '--t-accent':     '#424242',
        '--t-primary':    '#424242',
        '--t-secondary':  '#757575',
        '--t-accent-color':'#E0E0E0',
        '--t-soft-bg':    '#EEEEEE',
        '--t-border':     '#E0E0E0',
        '--t-text':       '#212121',
        '--t-text-light': '#616161',
        '--t-btn-bg':     '#424242',
      }
    }
  }
};

export const DEFAULT_THEME = 'kids-generic';

export function getTheme(key, colorKey = 'default') {
  const normalizedKey = key && !key.startsWith('kids-') ? `kids-${key}` : key;
  const baseTheme = THEMES[normalizedKey] || THEMES[DEFAULT_THEME];
  const normalizedColorKey = colorKey || 'default';

  // Resolve color scheme
  const themeColors = THEME_COLOR_SCHEMES[normalizedKey] || THEME_COLOR_SCHEMES[DEFAULT_THEME];
  const colorScheme = themeColors[normalizedColorKey] || themeColors['default'];

  return {
    ...baseTheme,
    selectedColorLabel: colorScheme.label,
    selectedColorValue: colorScheme.color,
    vars: {
      ...baseTheme.vars,
      ...colorScheme.vars
    }
  };
}
