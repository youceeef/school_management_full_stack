import axiosInstance from "../config/axios";

// Get all equipment
export const getEquipements = async () => {
  try {
    const response = await axiosInstance.get("/api/equipements");
    // Return the data in a consistent format
    return {
      data: Array.isArray(response.data) ? response.data : response.data.data || [],
    };
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des équipements" };
  }
};

// Get a single equipment by ID
export const getEquipement = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/equipements/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération de l'équipement" };
  }
};

// Create new equipment (admin only)
export const createEquipement = async (equipementData) => {
  try {
    const response = await axiosInstance.post("/api/equipements", equipementData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la création de l'équipement" };
  }
};

// Update equipment (admin only)
export const updateEquipement = async (id, equipementData) => {
  try {
    const response = await axiosInstance.put(`/api/equipements/${id}`, equipementData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la mise à jour de l'équipement" };
  }
};

// Delete equipment (admin only)
export const deleteEquipement = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/equipements/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la suppression de l'équipement" };
  }
};

// Get all equipment
export const getReservationsEquipements = async () => {
  try {
    const response = await axiosInstance.get("/api/indexEquipements");
    // Return the data in a consistent format
    return {
      data: Array.isArray(response.data) ? response.data : response.data.data || [],
    };
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des équipements" };
  }
};
