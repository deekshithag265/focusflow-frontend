import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ff_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.log("API Error:", err.response?.status, err.response?.data);
    if (err.response?.status === 401) {
      localStorage.removeItem("ff_token");
      window.location.href = "/";
    }
    return Promise.reject(err.response?.data?.message || "Something went wrong");
  }
);

export default api;