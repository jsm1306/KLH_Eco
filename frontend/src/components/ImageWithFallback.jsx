import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../utils/imageHelper';
import API_BASE from '../api/base';

const PRODUCTION_BASE = 'https://klh-eco.onrender.com';

/**
 * Image component with automatic fallback from local to production
 * Tries to load from local backend first, falls back to production via proxy if it fails
 */
const ImageWithFallback = ({ src, alt, className, style, crossOrigin = "anonymous", ...props }) => {
  const [imgSrc, setImgSrc] = useState(() => getImageUrl(src, false)); // Start with local
  const [hasErrored, setHasErrored] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setImgSrc(getImageUrl(src, false));
    setHasErrored(false);
  }, [src]);

  const handleError = (e) => {
    if (!hasErrored && src && !src.startsWith('http')) {
      // Extract filename from path
      const cleanPath = src.startsWith('/') ? src.slice(1) : src;
      const filename = cleanPath.split('/').pop(); // Get just the filename
      
      // Use local backend proxy to fetch production image (avoids CORS)
      const isLocalDev = API_BASE.includes('localhost');
      const fallbackUrl = isLocalDev 
        ? `${API_BASE}/uploads/proxy/${filename}` // Proxy through local backend
        : `${PRODUCTION_BASE}/${cleanPath}`; // Direct in production
      
      setImgSrc(fallbackUrl);
      setHasErrored(true);
    } else if (hasErrored) {
      // Image not found in both local and production
    }
  };

  if (!src) return null;

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      crossOrigin={crossOrigin}
      onError={handleError}
      {...props}
    />
  );
};

export default ImageWithFallback;
