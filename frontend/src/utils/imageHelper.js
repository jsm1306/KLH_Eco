import API_BASE from '../api/base';

// For local development, we'll try local images first, then fallback to production
const PRODUCTION_BASE = 'https://klh-eco.onrender.com';

export const getImageUrl = (imagePath, useProduction = false) => {
  if (!imagePath) return null;

  // If already a full URL, return as-is
  if (imagePath.startsWith('http')) return imagePath;

  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;

  // In development mode, use local backend by default
  // In production, use the API_BASE (production URL)
  const baseUrl = useProduction ? PRODUCTION_BASE : API_BASE;
  const finalUrl = `${baseUrl}/${cleanPath}`;

  return finalUrl;
};

// Helper component or function to handle image loading with fallback
export const getImageUrlWithFallback = (imagePath) => {
  if (!imagePath) return null;
  
  // If already a full URL, return as-is
  if (imagePath.startsWith('http')) return imagePath;

  // Create both URLs for potential fallback
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  return {
    primary: `${API_BASE}/${cleanPath}`,
    fallback: `${PRODUCTION_BASE}/${cleanPath}`
  };
};
