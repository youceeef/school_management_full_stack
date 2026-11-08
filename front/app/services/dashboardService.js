import axiosInstance from "../config/axios";

export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get("/api/dashboard/summary");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error.response?.data || error;
  }
};

export const getRecentReservations = async (limit = 5) => {
  try {
    const response = await axiosInstance.get(`/api/reservations/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
