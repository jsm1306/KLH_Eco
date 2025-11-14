import API_BASE from '../api/base';

// For local development, fallback to production images if local doesn't exist
const PRODUCTION_BASE = 'https://klh-eco.onrender.com';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If running locally (API_BASE contains localhost), use production for images
  // This allows you to see production-uploaded images when developing locally
  const baseUrl = API_BASE.includes('localhost') ? PRODUCTION_BASE : API_BASE;
  
  return `${baseUrl}/${imagePath}`;
};
