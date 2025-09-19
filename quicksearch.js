import { useEffect, useRef } from 'react';

export default function useQuickSearch() {
  const searchRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        if (searchRef.current) {
          searchRef.current.focus();
          searchRef.current.select();
          searchRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return searchRef;
}

// usage
  const searchRef = useQuickSearch();
      <TextField
        inputRef={searchRef}
