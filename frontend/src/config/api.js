// Centralized API Configuration
// Automatically detects environment and uses appropriate backend URL

const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://stockflow-new-backend.onrender.com";

export default API_URL;
