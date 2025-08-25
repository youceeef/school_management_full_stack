import axiosInstance from "../config/axios"; // Make sure this is imported

export const getDashboardStats = async () => {
  try {
    // Use your configured axiosInstance for all requests
    const responses = await Promise.all([axiosInstance.get("/api/users/count"), axiosInstance.get("/api/salles/count"), axiosInstance.get("/api/equipements/count"), axiosInstance.get("/api/documents/count")]);

    return {
      users: responses[0].data.count,
      rooms: responses[1].data.count,
      equipments: responses[2].data.count,
      documents: responses[3].data.count,
    };
  } catch (error) {
    // It's good practice to handle potential errors from Promise.all
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

export const getRecentReservations = async (limit = 5) => {
  try {
    const response = await axiosInstance.get(`/api/reservations/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
