import axios from "axios";
import Cookies from "js-cookie";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest", // Required for Laravel to identify AJAX requests
  },
  withCredentials: true, // Important for cookies and CSRF
});

// Request interceptor to add the auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the XSRF-TOKEN from cookies
    const token = Cookies.get("token");
    const xsrfToken = Cookies.get("XSRF-TOKEN");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If we have an XSRF-TOKEN cookie, add it to X-XSRF-TOKEN header
    if (xsrfToken) {
      config.headers["X-XSRF-TOKEN"] = xsrfToken;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
