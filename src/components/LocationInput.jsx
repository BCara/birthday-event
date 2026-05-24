import { useState, useEffect, useRef } from 'react';

export default function LocationInput({ id, value, onChange, placeholder, style }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const justSelectedRef = useRef(false);

  // Format helper to split suggestion into Main Title and Subtitle Address
  const getSuggestionDetails = (feature) => {
    const { properties } = feature;
    const mainName = properties.name || '';
    const addressParts = [];

    const streetAddress = [properties.housenumber, properties.street].filter(Boolean).join(' ');
    if (streetAddress && streetAddress !== mainName) {
      addressParts.push(streetAddress);
    }

    const city = properties.city || properties.town || properties.suburb || properties.village;
    if (city && city !== mainName) {
      addressParts.push(city);
    }

    if (properties.state && properties.state !== mainName) {
      addressParts.push(properties.state);
    }

    if (properties.country && properties.country !== mainName) {
      addressParts.push(properties.country);
    }

    return {
      mainName,
      secondaryText: addressParts.join(', '),
      fullName: [mainName, ...addressParts].filter(Boolean).join(', ')
    };
  };

  // Debounced API fetch when value changes
  useEffect(() => {
    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(value)}&limit=5`
        );
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        if (data && data.features) {
          setSuggestions(data.features);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error fetching location suggestions:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [value]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        selectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const selectSuggestion = (feature) => {
    const { fullName } = getSuggestionDetails(feature);
    justSelectedRef.current = true;
    onChange(fullName);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div ref={wrapperRef} style={{ ...styles.container, ...style }}>
      <div style={styles.inputWrapper}>
        <input
          id={id}
          type="text"
          className="kb-input"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          style={styles.input}
        />
        {isLoading && <div style={styles.loader} />}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div style={styles.dropdown}>
          {suggestions.map((suggestion, index) => {
            const { mainName, secondaryText } = getSuggestionDetails(suggestion);
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={suggestion.properties.osm_id || index}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={{
                  ...styles.suggestionItem,
                  ...(isHighlighted ? styles.suggestionHighlighted : {})
                }}
              >
                <span style={styles.pinIcon}>📍</span>
                <div style={styles.textContainer}>
                  <div style={styles.mainName}>{mainName}</div>
                  {secondaryText && <div style={styles.secondaryText}>{secondaryText}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    zIndex: 50,
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    paddingRight: '40px', // leave room for loading spinner
  },
  loader: {
    position: 'absolute',
    right: '14px',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(0, 0, 0, 0.1)',
    borderTopColor: 'var(--kb-coral)',
    borderRadius: '50%',
    animation: 'kb-spin 0.6s linear infinite',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    zIndex: 1000,
    background: 'var(--kb-surface)',
    border: '1px solid var(--kb-border)',
    borderRadius: 'var(--kb-radius-md)',
    boxShadow: 'var(--kb-shadow-md)',
    maxHeight: '260px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: '6px',
    animation: 'kb-fade-up 0.2s ease-out both',
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: 'var(--kb-radius-sm)',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, transform 0.1s ease',
  },
  suggestionHighlighted: {
    background: 'var(--kb-surface-2)',
    transform: 'translateX(2px)',
  },
  pinIcon: {
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  mainName: {
    fontFamily: 'var(--kb-font-body)',
    fontWeight: 600,
    fontSize: '0.92rem',
    color: 'var(--kb-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  secondaryText: {
    fontFamily: 'var(--kb-font-body)',
    fontSize: '0.8rem',
    color: 'var(--kb-text-muted)',
    marginTop: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};
