"use client";

import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import axiosInstance from "../config/axios";
import { getUserProfile } from "../services/userProfileService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    checkAuth();
    // Set up periodic permission refresh (every 5 minutes)
    const refreshInterval = setInterval(refreshPermissions, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  const refreshPermissions = async () => {
    try {
      const token = Cookies.get("token");
      if (token) {
        const permissionsResponse = await axiosInstance.get("/api/user/permissions");
        setPermissions(permissionsResponse.data.permissions);
      }
    } catch (error) {
      console.error("Permission refresh error:", error);
    }
  };

  const checkAuth = async () => {
    try {
      const token = Cookies.get("token");
      if (token) {
        // Use the profile endpoint to get complete user data
        const userData = await getUserProfile();
        setUser(userData);
        // Fetch permissions
        const permissionsResponse = await axiosInstance.get("/api/user/permissions");
        setPermissions(permissionsResponse.data.permissions);
      }
    } catch (error) {
      console.error("Auth check error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      Cookies.remove("token");
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      await axiosInstance.get("/sanctum/csrf-cookie");

      const response = await axiosInstance.post("/api/login", {
        email,
        password,
      });

      if (response.data.token) {
        Cookies.set("token", response.data.token);
        // Obtenir les données utilisateur complètes après la connexion
        const userData = await getUserProfile();
        setUser(userData);
        setPermissions(response.data.permissions || []);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur de connexion" };
    }
  };
  const logout = async () => {
    try {
      await axiosInstance.post("/api/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      Cookies.remove("token");
      setUser(null);
      setPermissions([]);
    }
  };
  const registerTeacher = async (userData) => {
    try {
      await axiosInstance.get("/sanctum/csrf-cookie");
      const response = await axiosInstance.post("/api/register/enseignant", userData);

      if (response.data.token) {
        Cookies.set("token", response.data.token);
        // Get complete user data after registration
        const profileData = await getUserProfile();
        setUser(profileData);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de l'inscription" };
    }
  };

  const registerStudent = async (userData) => {
    try {
      await axiosInstance.get("/sanctum/csrf-cookie");
      const response = await axiosInstance.post("/api/register/eleve", userData);

      if (response.data.token) {
        Cookies.set("token", response.data.token);
        // Get complete user data after registration
        const profileData = await getUserProfile();
        setUser(profileData);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de l'inscription" };
    }
  };

  const registerLabManager = async (userData) => {
    try {
      await axiosInstance.get("/sanctum/csrf-cookie");
      const response = await axiosInstance.post("/api/register/responsable_labo", userData);

      if (response.data.token) {
        Cookies.set("token", response.data.token);
        // Get complete user data after registration
        const profileData = await getUserProfile();
        setUser(profileData);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de l'inscription" };
    }
  };

  const registerAdmin = async (userData) => {
    try {
      await axiosInstance.get("/sanctum/csrf-cookie");
      const response = await axiosInstance.post("/api/register/admin", userData);

      if (response.data.token) {
        Cookies.set("token", response.data.token);
        // Get complete user data after registration
        const profileData = await getUserProfile();
        setUser(profileData);
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: "Erreur lors de l'inscription" };
    }
  };

  const updateUser = async () => {
    try {
      // Use the profile endpoint to get complete user data
      const userData = await getUserProfile();
      setUser(userData);
      // Update permissions as well
      const permissionsResponse = await axiosInstance.get("/api/user/permissions");
      setPermissions(permissionsResponse.data.permissions);
      return userData;
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasRole = (roleName) => {
    if (!user || !user.roles) return false;

    // Handle both array of objects and array of strings
    return user.roles.some((role) => (typeof role === "string" ? role === roleName : role.name === roleName));
  };

  const hasAnyPermission = (requiredPermissions) => {
    return requiredPermissions.some((permission) => hasPermission(permission));
  };

  const hasAllPermissions = (requiredPermissions) => {
    return requiredPermissions.every((permission) => hasPermission(permission));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        permissions,
        login,
        registerStudent,
        registerTeacher,
        registerLabManager,
        registerAdmin,
        logout,
        checkAuth,
        updateUser,
        hasPermission,
        hasRole,
        hasAnyPermission,
        hasAllPermissions,
        refreshPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
