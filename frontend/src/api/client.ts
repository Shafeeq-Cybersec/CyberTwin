import axios from "axios";
import { handleMockRequest } from "./mockData";

/**
 * Central Axios instance. All API calls go through /api which the Vite
 * dev server proxies to the FastAPI backend (see vite.config.ts).
 */
const apiClient = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
  // Short timeout so if real backend is not running, fallback engages quickly
  timeout: 1500,
});

// Attach JWT from localStorage to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("cybertwin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Fallback to mock data whenever backend is offline or returns error
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    // If backend is unreachable or connection fails, check mock handler
    const mockRes = handleMockRequest(error.config);
    if (mockRes) {
      return Promise.resolve(mockRes);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("cybertwin_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
