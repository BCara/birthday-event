import { useState, useEffect, useRef, useCallback } from 'react';

export default function LocationInput({ id, value, onChange, placeholder, style }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [autocompleteService, setAutocompleteService] = useState(null);
  
  const wrapperRef = useRef(null);

  // Load Google Maps Script dynamically if not present
  useEffect(() => {
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript || window.google) {
      setGoogleLoaded(true);
      if (window.google?.maps?.places) {
        setAutocompleteService(new window.google.maps.places.AutocompleteService());
      }
      return;
    }
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("LocationInput: VITE_GOOGLE_MAPS_API_KEY is missing in .env. Search will be disabled.");
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleLoaded(true);
      if (window.google?.maps?.places) {
        setAutocompleteService(new window.google.maps.places.AutocompleteService());
      }
    };
    script.onerror = () => console.error("LocationInput: Failed to load Google Maps script.");
    document.head.appendChild(script);
  }, []);

  // Fetch predictions when value changes
  useEffect(() => {
    if (!autocompleteService || !value || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    // Debounce the fetch slightly
    const timer = setTimeout(() => {
      autocompleteService.getPlacePredictions(
        { input: value },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [value, autocompleteService]);

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

  const selectSuggestion = (suggestion) => {
    const fullName = suggestion.description;
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
          disabled={!googleLoaded && import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        />
        {/* Simple loader if script is still loading */}
        {!googleLoaded && import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
          <div style={styles.loader} />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div style={styles.dropdown}>
          {suggestions.map((suggestion, index) => {
            const { main_text, secondary_text } = suggestion.structured_formatting;
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={suggestion.place_id}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={{
                  ...styles.suggestionItem,
                  ...(isHighlighted ? styles.suggestionHighlighted : {})
                }}
              >
                <span style={styles.pinIcon}>📍</span>
                <div style={styles.textContainer}>
                  <div style={styles.mainName}>{main_text}</div>
                  {secondary_text && <div style={styles.secondaryText}>{secondary_text}</div>}
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
