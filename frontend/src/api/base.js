// Default to local backend during development. In production (Render) set
// REACT_APP_API_URL to your deployed backend URL (e.g. https://klh-eco.onrender.com).
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export default API_BASE;
