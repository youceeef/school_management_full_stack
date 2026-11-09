import axiosInstance from "../config/axios";

// Get user profile
export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get("/api/user/profile");
    return response.data.user;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération du profil" };
  }
};

// Update user profile
export const updateUserProfile = async (formData) => {
  try {
    // Override the Axios instance's JSON default. Axios detects FormData and
    // adds the required multipart boundary in the browser.
    const response = await axiosInstance.post("/api/user/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    const responseData = error.response?.data;
    const validationMessage = responseData?.errors?.picture?.[0];

    throw {
      ...(responseData || {}),
      message:
        validationMessage ||
        responseData?.message ||
        "Erreur lors de la mise à jour du profil",
    };
  }
};

// Delete user profile
export const deleteUserProfile = async () => {
  try {
    const response = await axiosInstance.delete("/api/user/profile");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la suppression du profil" };
  }
};

// Delete profile picture
export const deleteProfilePicture = async () => {
  try {
    const response = await axiosInstance.delete("/api/user/profile/picture");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la suppression de la photo de profil" };
  }
};

// Helper function to get the properly formatted storage URL
export const getStorageImageUrl = (picturePath) => {
  if (!picturePath) return null;

  // If the picture path already has a full URL, return it
  if (picturePath.startsWith("http")) return picturePath;

  const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || axiosInstance.defaults.baseURL;
  const baseUrl = storageUrl.replace(/\/$/, "");
  
  // If the path starts with a slash, remove it to avoid double slashes
  const cleanPath = picturePath.replace(/^\//, "");

  // Combine the base URL with the clean path
  return `${baseUrl}/${cleanPath}`;
};
