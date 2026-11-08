import axiosInstance from "../config/axios";

// Get all documents
export const getDocuments = async () => {
  try {
    const response = await axiosInstance.get("/api/documents");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des documents" };
  }
};

// Get a single document by ID
export const getDocument = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/documents/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération du document" };
  }
};

// Create new document with file upload
export const createDocument = async (documentData) => {
  try {
    const response = await axiosInstance.post("/api/documents/upload", documentData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la création du document" };
  }
};

// Update document
export const updateDocument = async (id, documentData) => {
  try {
    const response = await axiosInstance.put(`/api/documents/${id}`, documentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la mise à jour du document" };
  }
};

// Delete document
export const deleteDocument = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/documents/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la suppression du document" };
  }
};

// Download document
export const downloadDocument = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/documents/${id}/download`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors du téléchargement du document" };
  }
};

export const getTelechargements = async () => {
  try {
    const response = await axiosInstance.get("/api/documents/telechargements");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des téléchargements" };
  }
};
