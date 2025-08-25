import axiosInstance from "../config/axios";

// Get all reservations with pagination
export const getReservations = async (page = 1) => {
  try {
    const response = await axiosInstance.get(`/api/reservations?page=${page}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return { data: [] }; // Return empty array for no reservations
    }
    throw error.response?.data || { message: "Une erreur est survenue" };
  }
};

// Get a single reservation by ID

// Create a new reservation
export const createReservation = async (reservationData) => {
  try {
    const response = await axiosInstance.post("/api/reservations", reservationData);
    return {
      success: true,
      data: response.data,
      message: "Réservation créée avec succès",
    };
  } catch (error) {
    if (error.response?.status === 422) {
      // Validation errors
      return {
        success: false,
        errors: error.response.data.errors,
        message: "Erreur de validation",
      };
    }

    // Other errors
    return {
      success: false,
      message: error.response?.data?.message || "Erreur lors de la création de la réservation",
      error: error,
    };
  }
};

// Approve a reservation
export const approveReservation = async (id) => {
  try {
    const response = await axiosInstance.put(`/api/reservations/${id}/approve`);
    return {
      success: true,
      data: response.data,
      message: "Réservation approuvée avec succès",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Erreur lors de l'approbation de la réservation",
      error: error.response?.data,
    };
  }
};

// Reject a reservation
export const rejectReservation = async (id, rejectionReason) => {
  try {
    const response = await axiosInstance.put(`/api/reservations/${id}/reject`, {
      rejection_reason: rejectionReason,
    });
    return {
      success: true,
      data: response.data,
      message: "Réservation refusée avec succès",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Erreur lors du rejet de la réservation",
      error: error.response?.data,
    };
  }
};

// Delete a reservation
export const deleteReservation = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/reservations/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la suppression de la réservation" };
  }
};

export const getReservation = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/reservations/${id}`);
    return {
      success: true,
      data: response.data.data,
      message: "Réservation chargée avec succès",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Erreur lors de la récupération de la réservation",
      error: error.response?.data,
    };
  }
};

export const getMyreservation = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/my-reservations/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération de la réservation" };
  }
};

// Cancel a reservation
export const cancelReservation = async (id) => {
  try {
    const response = await axiosInstance.delete(`/api/my-reservations/${id}/cancel`);
    return {
      success: true,
      data: response.data,
      message: "Réservation annulée avec succès",
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Erreur lors de l'annulation de la réservation",
      error: error.response?.data,
    };
  }
};

// Get user's reservations
export const getMyReservations = async () => {
  try {
    const response = await axiosInstance.get("/api/my-reservations");
    return response.data.data || []; // Access the data array inside the response.data
  } catch (error) {
    if (error.response?.status === 404) {
      return []; // Return empty array for no reservations
    }
    throw error.response?.data || { message: "Une erreur est survenue" };
  }
};

// Get calendar reservations
export const getCalendarReservations = async (startDate, endDate, salleIds) => {
  try {
    const response = await axiosInstance.get("/api/reservations/calendar/view", {
      params: {
        start_date: startDate,
        end_date: endDate,
        salle_ids: salleIds
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des réservations" };
  }
};

// Get daily reservations
export const getDailyReservations = async (date, salleIds) => {
  try {
    const response = await axiosInstance.get("/api/reservations/calendar/daily", {
      params: {
        date: date,
        salle_ids: salleIds
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des réservations quotidiennes" };
  }
};

// Get all reservations
export const getAllReservations = async () => {
  try {
    const response = await axiosInstance.get("/api/reservations");
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la récupération des réservations" };
  }
};

// Update reservation status
export const updateReservationStatus = async (id, status, reason = null) => {
  try {
    const endpoint = status === 'approved' ? 'approve' : 'reject';
    const data = status === 'rejected' ? { rejection_reason: reason } : {};
    
    const response = await axiosInstance.put(`/api/reservations/${id}/${endpoint}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Erreur lors de la mise à jour du statut" };
  }
};
