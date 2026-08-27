import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return "http://localhost:5000/api";
};

// Serialize params so arrays are encoded in canonical bracket form: key[]=v1&key[]=v2
const paramsSerializer = (params) => {
  const parts = [];
  const encode = encodeURIComponent;
  Object.keys(params || {}).forEach((key) => {
    const val = params[key];
    if (val === null || typeof val === "undefined") return;
    if (Array.isArray(val)) {
      val.forEach((v) => {
        parts.push(`${encode(key)}[]=${encode(String(v))}`);
      });
    } else if (typeof val === "object") {
      // fallback: JSON-encode objects
      parts.push(`${encode(key)}=${encode(JSON.stringify(val))}`);
    } else {
      parts.push(`${encode(key)}=${encode(String(val))}`);
    }
  });
  return parts.join("&");
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer,
});

// Attach bearer token when available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
