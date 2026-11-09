import axiosInstance from "../config/axios";

export const getSystemHealth = async (signal) => {
  const response = await axiosInstance.get("/health", {
    signal,
    timeout: 15000,
    validateStatus: (status) => (status >= 200 && status < 300) || status === 503,
  });

  return response.data;
};
