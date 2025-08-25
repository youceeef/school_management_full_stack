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
    // Get token from cookies
    let token = null;
    const cookies = document.cookie || "";
    if (cookies) {
      const tokenCookie = cookies.split("; ").find((row) => row.startsWith("token="));
      if (tokenCookie) {
        token = tokenCookie.split("=")[1];
      }
    }

    // Prepare headers
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Get the download URL
    const downloadUrl = `${axiosInstance.defaults.baseURL}/api/documents/${id}/download`;

    // Make the request
    const response = await fetch(downloadUrl, { headers });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Vous devez être connecté pour télécharger ce document");
      }
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.blob();
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