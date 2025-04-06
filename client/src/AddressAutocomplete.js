import React, { useState, useEffect } from 'react';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

function AddressAutocomplete({ onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=US&limit=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        console.log("Raw Mapbox results:", data);
        const results = data?.features || [];
        setSuggestions(results);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Mapbox API error:", err);
        }
        setSuggestions([]);
      }
    };

    fetchSuggestions();
    return () => controller.abort();
  }, [query]);

  const handleSelect = (feature) => {
    const fullAddress = feature.place_name || '';
    onSelect(fullAddress);
    setQuery(fullAddress);
    setSuggestions([]);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        placeholder="Enter your address"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 150)}
        style={{
          width: '100%',
          padding: '0.6rem 0.75rem',
          fontSize: '1rem',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
        }}
      />
      {isFocused && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          marginTop: '4px',
          padding: 0,
          listStyle: 'none',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 9999,
        }}>
          {suggestions.map((sug, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(sug)}
              style={{
                padding: '0.75rem',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6'
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {sug.place_name || '(No address found)'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AddressAutocomplete;