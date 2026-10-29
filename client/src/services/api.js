import axios from "axios";

const API_CACHE_PREFIX = "transport-management:api-cache:v1:";

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

const getUserCacheScope = async () => {
  const token = localStorage.getItem("token");
  if (!token || !globalThis.crypto?.subtle) return null;

  const tokenBytes = new TextEncoder().encode(token);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", tokenBytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

const getCacheKey = (scope, url, config = {}) => {
  const serializer = config.paramsSerializer;
  const serializedParams =
    typeof serializer === "function"
      ? serializer(config.params)
      : paramsSerializer(config.params);
  const query = serializedParams ? `?${serializedParams}` : "";
  return `${API_CACHE_PREFIX}${scope}:${url}${query}`;
};

const readApiCache = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    if (parsed && Object.hasOwn(parsed, "data")) return parsed;

    console.warn("Ignoring invalid cached API response.");
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error reading cached API response:", error);
  }

  return null;
};

const writeApiCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data }));
  } catch (error) {
    console.error("Error caching API response:", error);
  }
};

export const clearApiCache = (scope = null) => {
  const prefix = scope
    ? `${API_CACHE_PREFIX}${scope}:`
    : API_CACHE_PREFIX;

  try {
    const keysToRemove = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(prefix)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing cached API responses:", error);
  }
};

const axiosGet = api.get.bind(api);
api.get = async (url, config = {}) => {
  if (/\/auth(?:\/|$)/.test(url)) {
    return axiosGet(url, config);
  }

  const scope = await getUserCacheScope();
  if (!scope) return axiosGet(url, config);

  const cacheKey = getCacheKey(scope, url, config);
  const cached = readApiCache(cacheKey);
  const request = axiosGet(url, config);

  if (!cached) {
    const response = await request;
    writeApiCache(cacheKey, response.data);
    return response;
  }

  request
    .then((response) => {
      writeApiCache(cacheKey, response.data);
    })
    .catch((error) => {
      console.error(`Error refreshing cached API response for ${url}:`, error);
    });

  return {
    data: cached.data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: { ...config, url, method: "get" },
  };
};

// Attach bearer token when available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  async (response) => {
    if (response.config?.method && response.config.method !== "get") {
      const scope = await getUserCacheScope();
      clearApiCache(scope);
    }
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthenticationRequest = /\/auth\/(login|register)\/?$/.test(
      requestUrl,
    );

    if (error.response?.status === 401 && !isAuthenticationRequest) {
      clearApiCache();
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
