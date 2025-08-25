import axiosInstance from "../config/axios";

// Get all salles
export const getSalles = async () => {
  try {
    const response = await axiosInstance.get("/api/salles");
    // Return the data in a consistent format
    return {
      data: Array.isArray(response.data) ? response.data : response.data.data || [],
    };
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des salles" };
  }
};

// Get a single salle by ID
export const getSalle = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/salles/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération de la salle" };
  }
};

// Create new salle
export const createSalle = async (salleData) => {
  try {
    const response = await axiosInstance.post("/api/salles", salleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la création de la salle" };
  }
};

// Update salle
export const updateSalle = async (id, salleData) => {
  try {
    const response = await axiosInstance.put(`/api/salles/${id}`, salleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la mise à jour de la salle" };
  }
};

// Delete salle
export const deleteSalle = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/salles/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la suppression de la salle" };
  }
};

export const getSallesCalendar = async () => {
  try {
    const response = await axiosInstance.get("/api/sallesIndex");
    // Return the data in a consistent format
    return {
      data: Array.isArray(response.data) ? response.data : response.data.data || [],
    };
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des salles" };
  }
};
